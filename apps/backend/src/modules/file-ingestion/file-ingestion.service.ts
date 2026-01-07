import { createHash } from 'crypto';
import { statSync } from 'fs';

import { Injectable, Inject, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';

import { DATABASE_CONNECTION } from '../../database';
import * as schema from '../../database/schema';
import { IssuesGateway } from '../issues/issues.gateway';
import { IssuesService } from '../issues/issues.service';
import { LogsGateway } from '../logs/logs.gateway';
import {
  SettingsService,
  FILE_INGESTION_DEFAULTS,
  type FileIngestionSettings,
} from '../settings/settings.service';

import { FileDiscoveryService } from './file-discovery.service';
import { FileStateService } from './file-state.service';
import { LogFileProcessor } from './log-file-processor';
import { LogFileTailer } from './log-file-tailer';

import type { MediaServerProvider, ParsedLogEntry } from '@logarr/core';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

/**
 * Progress information for file ingestion
 */
export interface FileIngestionProgress {
  serverId: string;
  serverName: string;
  status: 'discovering' | 'processing' | 'watching' | 'error';
  totalFiles: number;
  processedFiles: number;
  skippedFiles: number;
  activeFiles: number;
  queuedFiles: number;
  currentFiles: string[];
  error?: string;
}

// Type guard for providers with file ingestion support
interface FileIngestionProvider extends MediaServerProvider {
  getLogFileConfig(): LogFileConfig;
  isLogContinuation?(line: string): boolean;
}

function hasFileIngestionSupport(provider: MediaServerProvider): provider is FileIngestionProvider {
  return typeof (provider as FileIngestionProvider).getLogFileConfig === 'function';
}

// LogFileConfig interface
interface LogFileConfig {
  defaultPaths: {
    docker: readonly string[];
    linux: readonly string[];
    windows: readonly string[];
    macos: readonly string[];
  };
  filePatterns: readonly string[];
  encoding?: string;
  rotatesDaily?: boolean;
  datePattern?: RegExp;
}

/**
 * FileIngestionService - Responsible for file-based log ingestion
 *
 * ## How Log File Access Works
 *
 * Since Logarr and the media servers typically run in separate Docker containers,
 * log files must be made accessible through one of these methods:
 *
 * 1. **Volume Mounts (Recommended)**:
 *    Mount the log directories from your media server containers to Logarr's container.
 *    Example docker-compose:
 *    ```yaml
 *    logarr:
 *      volumes:
 *        - /path/to/jellyfin/log:/logs/jellyfin:ro
 *        - /path/to/sonarr/logs:/logs/sonarr:ro
 *    ```
 *    Then configure the server with logPaths: ['/logs/jellyfin']
 *
 * 2. **Shared Volume**:
 *    Use a shared named volume between containers.
 *
 * 3. **Direct Host Path**:
 *    If running Logarr on the host (not in Docker), directly access the log directories.
 */
@Injectable()
export class FileIngestionService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(FileIngestionService.name);
  private tailers: Map<string, LogFileTailer> = new Map();
  private isStarted = false;
  /** Queue of files waiting to be processed per server */
  private fileQueue: Map<string, string[]> = new Map();
  /** Progress tracking per server */
  private progressMap: Map<string, FileIngestionProgress> = new Map();
  /** Provider reference for processing queued files */
  private providerMap: Map<string, MediaServerProvider> = new Map();
  /** Cached settings - loaded on first use */
  private cachedSettings: FileIngestionSettings | null = null;

  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: PostgresJsDatabase<typeof schema>,
    private readonly fileStateService: FileStateService,
    private readonly fileDiscoveryService: FileDiscoveryService,
    private readonly logsGateway: LogsGateway,
    private readonly issuesService: IssuesService,
    private readonly issuesGateway: IssuesGateway,
    private readonly settingsService: SettingsService
  ) {}

  /**
   * Get file ingestion settings, with caching for performance
   */
  private async getSettings(): Promise<FileIngestionSettings> {
    if (this.cachedSettings === null) {
      try {
        this.cachedSettings = await this.settingsService.getFileIngestionSettings();
      } catch (error) {
        this.logger.warn('Failed to load file ingestion settings, using defaults', error);
        this.cachedSettings = FILE_INGESTION_DEFAULTS;
      }
    }
    return this.cachedSettings;
  }

  /**
   * Invalidate cached settings (call when settings are updated)
   */
  invalidateSettingsCache(): void {
    this.cachedSettings = null;
  }

  onModuleInit(): void {
    this.logger.log('File ingestion service initialized');
  }

  async onModuleDestroy(): Promise<void> {
    await this.stopAllTailers();
  }

  /**
   * Start file ingestion for all enabled servers
   */
  async startFileIngestion(providers: Map<string, MediaServerProvider>): Promise<void> {
    if (this.isStarted) {
      this.logger.warn('File ingestion already started');
      return;
    }

    this.logger.log('Starting file ingestion...');

    const servers = await this.db
      .select()
      .from(schema.servers)
      .where(
        and(eq(schema.servers.isEnabled, true), eq(schema.servers.fileIngestionEnabled, true))
      );

    this.logger.log(`Found ${servers.length} servers with file ingestion enabled`);

    for (const server of servers) {
      try {
        await this.startServerFileIngestion(server, providers);
      } catch (error) {
        this.logger.error(`Failed to start file ingestion for server ${server.name}:`, error);
      }
    }

    this.isStarted = true;
  }

  /**
   * Start file ingestion for a single server with batched processing
   */
  async startServerFileIngestion(
    server: typeof schema.servers.$inferSelect,
    providers: Map<string, MediaServerProvider>
  ): Promise<void> {
    const provider = providers.get(server.providerId);
    if (!provider) {
      this.logger.warn(`No provider found for ${server.providerId}`);
      return;
    }

    // Check if provider supports file-based log ingestion
    if (!hasFileIngestionSupport(provider)) {
      this.logger.debug(`Provider ${server.providerId} does not support file-based log ingestion`);
      return;
    }

    // Load settings from database
    const settings = await this.getSettings();

    // Store provider reference for queue processing
    this.providerMap.set(server.id, provider);

    const logFileConfig = provider.getLogFileConfig();

    // Get paths to monitor - use server-configured paths or provider defaults
    let paths: string[];
    if (server.logPaths && server.logPaths.length > 0) {
      paths = [...server.logPaths];
    } else {
      paths = this.fileDiscoveryService.getDefaultPaths(logFileConfig);
    }

    const patterns =
      server.logFilePatterns && server.logFilePatterns.length > 0
        ? [...server.logFilePatterns]
        : [...logFileConfig.filePatterns];

    this.logger.log(`Starting file ingestion for ${server.name}`);
    this.logger.log(`  Paths: ${paths.join(', ')}`);
    this.logger.log(`  Patterns: ${patterns.join(', ')}`);

    // Initialize progress tracking
    const progress: FileIngestionProgress = {
      serverId: server.id,
      serverName: server.name,
      status: 'discovering',
      totalFiles: 0,
      processedFiles: 0,
      skippedFiles: 0,
      activeFiles: 0,
      queuedFiles: 0,
      currentFiles: [],
    };
    this.progressMap.set(server.id, progress);
    this.broadcastProgress(progress);

    // Validate paths exist
    for (const path of paths) {
      const validation = await this.fileDiscoveryService.validatePath(path);
      if (!validation.accessible) {
        this.logger.warn(`Path not accessible for ${server.name}: ${path} - ${validation.error}`);
      }
    }

    // Discover log files
    const allLogFiles = await this.fileDiscoveryService.discoverLogFiles(paths, patterns);

    if (allLogFiles.length === 0) {
      this.logger.warn(
        `No log files found for server ${server.name} in paths: ${paths.join(', ')}`
      );
      progress.status = 'watching';
      this.broadcastProgress(progress);
      return;
    }

    // Filter files by age - only process recent files to prevent memory exhaustion
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - settings.maxFileAgeDays);

    const { recentFiles, skippedFiles } = this.filterFilesByAge(allLogFiles, cutoffDate);

    progress.totalFiles = allLogFiles.length;
    progress.skippedFiles = skippedFiles.length;

    this.logger.log(
      `Found ${allLogFiles.length} log files for ${server.name}, ` +
      `${recentFiles.length} recent (last ${settings.maxFileAgeDays} days), ` +
      `${skippedFiles.length} skipped (older)`
    );

    if (recentFiles.length === 0) {
      this.logger.log(`No recent log files to process for ${server.name}`);
      progress.status = 'watching';
      this.broadcastProgress(progress);
      return;
    }

    // Sort by modification time (newest first) so we process most relevant logs first
    recentFiles.sort((a, b) => {
      try {
        return statSync(b).mtimeMs - statSync(a).mtimeMs;
      } catch {
        return 0;
      }
    });

    // Queue files for batched processing
    this.fileQueue.set(server.id, [...recentFiles]);
    progress.queuedFiles = recentFiles.length;
    progress.status = 'processing';
    this.broadcastProgress(progress);

    // Start processing the queue with concurrency limit
    await this.processFileQueue(server.id, provider);
  }

  /**
   * Filter files by modification date
   */
  private filterFilesByAge(
    files: string[],
    cutoffDate: Date
  ): { recentFiles: string[]; skippedFiles: string[] } {
    const recentFiles: string[] = [];
    const skippedFiles: string[] = [];

    for (const file of files) {
      try {
        const stats = statSync(file);
        if (stats.mtime >= cutoffDate) {
          recentFiles.push(file);
        } else {
          skippedFiles.push(file);
        }
      } catch {
        // If we can't stat the file, include it (might be accessible later)
        recentFiles.push(file);
      }
    }

    return { recentFiles, skippedFiles };
  }

  /**
   * Process queued files with concurrency limit
   */
  private async processFileQueue(serverId: string, provider: MediaServerProvider): Promise<void> {
    const queue = this.fileQueue.get(serverId);
    const progress = this.progressMap.get(serverId);

    if (!queue || !progress) {
      return;
    }

    // Get settings for concurrency limits
    const settings = await this.getSettings();

    // Process files up to the concurrency limit
    while (queue.length > 0) {
      // Count currently active tailers for this server
      const activeTailers = Array.from(this.tailers.keys()).filter(
        (id) => id.startsWith(`${serverId}:`)
      ).length;

      if (activeTailers >= settings.maxConcurrentTailers) {
        // Wait a bit before checking again
        await this.sleep(settings.tailerStartDelayMs);
        continue;
      }

      const filePath = queue.shift();
      if (filePath === undefined || filePath === '') break;

      // Update progress
      progress.queuedFiles = queue.length;
      progress.activeFiles = activeTailers + 1;
      progress.currentFiles = this.getCurrentFilesForServer(serverId);
      progress.currentFiles.push(this.getFileName(filePath));
      this.broadcastProgress(progress);

      try {
        await this.startTailingFile(serverId, filePath, provider);
        progress.processedFiles++;

        // Small delay between starting tailers to spread out load
        await this.sleep(settings.tailerStartDelayMs);
      } catch (error) {
        this.logger.error(`Failed to start tailing ${filePath}:`, error);
      }
    }

    // All files processed, now in watching mode
    progress.status = 'watching';
    progress.queuedFiles = 0;
    progress.currentFiles = this.getCurrentFilesForServer(serverId);
    this.broadcastProgress(progress);

    this.logger.log(
      `File ingestion for server ${progress.serverName} complete: ` +
      `${progress.processedFiles} files active, ${progress.skippedFiles} skipped`
    );
  }

  /**
   * Get list of currently tailed file names for a server
   */
  private getCurrentFilesForServer(serverId: string): string[] {
    return Array.from(this.tailers.keys())
      .filter((id) => id.startsWith(`${serverId}:`))
      .map((id) => this.getFileName(id.split(':')[1] ?? ''));
  }

  /**
   * Get just the filename from a path
   */
  private getFileName(filePath: string): string {
    const parts = filePath.split(/[/\\]/);
    const lastPart = parts[parts.length - 1];
    return lastPart !== undefined && lastPart !== '' ? lastPart : filePath;
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Broadcast progress update via WebSocket
   */
  private broadcastProgress(progress: FileIngestionProgress): void {
    this.logsGateway.broadcastFileIngestionProgress(progress);
  }

  /**
   * Get current progress for all servers
   */
  getProgress(): FileIngestionProgress[] {
    return Array.from(this.progressMap.values());
  }

  /**
   * Get progress for a specific server
   */
  getServerProgress(serverId: string): FileIngestionProgress | undefined {
    return this.progressMap.get(serverId);
  }

  /**
   * Start tailing a single log file
   */
  private async startTailingFile(
    serverId: string,
    filePath: string,
    provider: MediaServerProvider
  ): Promise<void> {
    const tailerId = `${serverId}:${filePath}`;

    // Check if already tailing this file
    if (this.tailers.has(tailerId)) {
      this.logger.debug(`Already tailing ${filePath}`);
      return;
    }

    // Get or create file state
    const state =
      (await this.fileStateService.getState(serverId, filePath)) ??
      (await this.fileStateService.createState(serverId, filePath));

    // Create processor for multi-line handling
    const processor = new LogFileProcessor(provider);
    processor.setFilePath(filePath);

    // Create tailer
    const tailer = new LogFileTailer(
      {
        serverId,
        filePath,
        resumeFromState: state ?? undefined,
        onEntry: async (entry: ParsedLogEntry) => {
          await this.processEntry(serverId, entry, filePath);
        },
        onError: (error: Error) => {
          this.logger.error(`Error tailing ${filePath}:`, error.message);
          void this.fileStateService.updateError(serverId, filePath, error.message);
        },
        onRotation: () => {
          this.logger.log(`Log rotation detected for ${filePath}`);
          void this.fileStateService.resetState(serverId, filePath);
        },
        onStateChange: async (newState) => {
          // Persist state to database
          const updates: {
            byteOffset?: bigint;
            lineNumber?: number;
            fileSize?: bigint;
            fileInode?: string | null;
          } = {};

          if (newState.byteOffset !== undefined) {
            updates.byteOffset = newState.byteOffset;
          }
          if (newState.lineNumber !== undefined) {
            updates.lineNumber = newState.lineNumber;
          }
          if (newState.fileSize !== undefined) {
            updates.fileSize = newState.fileSize;
          }
          if (newState.fileInode !== undefined) {
            updates.fileInode = newState.fileInode;
          }

          await this.fileStateService.updateState(serverId, filePath, updates);
        },
      },
      processor,
      provider
    );

    this.tailers.set(tailerId, tailer);

    // Start tailing
    try {
      await tailer.start();
      this.logger.log(`Started tailing ${filePath}`);
    } catch (error) {
      this.logger.error(`Failed to start tailing ${filePath}:`, error);
      this.tailers.delete(tailerId);
    }
  }

  /**
   * Stop tailing all files
   */
  async stopAllTailers(): Promise<void> {
    this.logger.log(`Stopping ${this.tailers.size} file tailers...`);

    for (const [tailerId, tailer] of this.tailers) {
      try {
        await tailer.stop();
      } catch (error) {
        this.logger.error(`Error stopping tailer ${tailerId}:`, error);
      }
    }

    this.tailers.clear();
    this.isStarted = false;
  }

  /**
   * Stop file ingestion for a specific server
   */
  async stopServerFileIngestion(serverId: string): Promise<void> {
    const serverTailers = Array.from(this.tailers.entries()).filter(([id]) =>
      id.startsWith(`${serverId}:`)
    );

    for (const [tailerId, tailer] of serverTailers) {
      try {
        await tailer.stop();
        this.tailers.delete(tailerId);
      } catch (error) {
        this.logger.error(`Error stopping tailer ${tailerId}:`, error);
      }
    }
  }

  /**
   * Process a parsed log entry
   */
  private async processEntry(
    serverId: string,
    entry: ParsedLogEntry,
    filePath: string
  ): Promise<typeof schema.logEntries.$inferSelect | null> {
    // Generate deduplication key
    const dedupKey = this.generateDeduplicationKey(entry);

    // Insert with conflict handling for deduplication
    const result = await this.db
      .insert(schema.logEntries)
      .values({
        serverId,
        timestamp: entry.timestamp,
        level: entry.level,
        message: entry.message,
        source: entry.source ?? null,
        threadId: entry.threadId ?? null,
        raw: entry.raw,
        sessionId: entry.sessionId ?? null,
        userId: entry.userId ?? null,
        deviceId: entry.deviceId ?? null,
        itemId: entry.itemId ?? null,
        playSessionId: entry.playSessionId ?? null,
        metadata: entry.metadata ?? null,
        exception: entry.exception ?? null,
        stackTrace: entry.stackTrace ?? null,
        logSource: 'file',
        logFilePath: filePath,
        deduplicationKey: dedupKey,
      })
      .onConflictDoNothing({
        target: [schema.logEntries.serverId, schema.logEntries.deduplicationKey],
      })
      .returning();

    const inserted = result[0];
    if (inserted === undefined) {
      return null;
    }

    this.logger.debug(`Ingested log entry from file: ${entry.message.substring(0, 50)}...`);

    // Broadcast to WebSocket clients
    const logData: Parameters<typeof this.logsGateway.broadcastLog>[0] = {
      id: inserted.id,
      serverId,
      timestamp: inserted.timestamp,
      level: inserted.level,
      message: inserted.message,
      logSource: 'file',
    };
    if (inserted.source !== null && inserted.source !== '') {
      logData.source = inserted.source;
    }
    this.logsGateway.broadcastLog(logData);

    // Process for issue detection (errors and warnings)
    if (['error', 'warn'].includes(inserted.level)) {
      try {
        const issueId = await this.issuesService.processLogEntry(inserted);
        if (issueId !== null && issueId !== '') {
          const issue = await this.issuesService.findOne(issueId);
          if (issue !== null) {
            if (issue.occurrenceCount === 1) {
              this.issuesGateway.broadcastNewIssue(issue);
            } else {
              this.issuesGateway.broadcastIssueUpdate(issue);
            }
          }
        }
      } catch (err) {
        this.logger.warn(`Failed to process issue for log entry ${inserted.id}:`, err);
      }
    }

    return inserted;
  }

  /**
   * Generate a deduplication key for a log entry
   * Combines timestamp, level, source, and message hash for uniqueness
   */
  private generateDeduplicationKey(entry: ParsedLogEntry): string {
    const messageHash = createHash('sha256')
      .update(entry.message.substring(0, 200))
      .digest('hex')
      .substring(0, 16);

    // Use second-precision timestamp for matching
    const timestampKey = entry.timestamp.toISOString().substring(0, 19);

    return `${timestampKey}:${entry.level}:${entry.source ?? ''}:${messageHash}`;
  }

  /**
   * Restart file ingestion for a server (e.g., after config change)
   */
  async restartServerFileIngestion(serverId: string, providers: Map<string, MediaServerProvider>): Promise<void> {
    await this.stopServerFileIngestion(serverId);

    const [server] = await this.db
      .select()
      .from(schema.servers)
      .where(eq(schema.servers.id, serverId));

    if (server && server.isEnabled && server.fileIngestionEnabled) {
      await this.startServerFileIngestion(server, providers);
    }
  }

  /**
   * Get status of file ingestion
   */
  getStatus(): { isStarted: boolean; activeTailers: number; tailers: string[] } {
    return {
      isStarted: this.isStarted,
      activeTailers: this.tailers.size,
      tailers: Array.from(this.tailers.keys()),
    };
  }

  /**
   * Validate log paths for a server
   */
  async validateLogPaths(paths: string[]): Promise<{
    valid: boolean;
    results: Array<{
      path: string;
      accessible: boolean;
      error?: string;
      files?: string[];
    }>;
  }> {
    const results = await Promise.all(
      paths.map(async (path) => ({
        path,
        ...(await this.fileDiscoveryService.validatePath(path)),
      }))
    );

    return {
      valid: results.every((r) => r.accessible),
      results,
    };
  }

  /**
   * Backfill logs from files for a server
   * Reads all log files from the beginning and ingests them
   */
  async backfillFromFiles(
    serverId: string,
    providers: Map<string, MediaServerProvider>,
    progressCallback?: (progress: {
      status: 'started' | 'progress' | 'completed' | 'error';
      totalFiles: number;
      processedFiles: number;
      totalLines: number;
      processedLines: number;
      entriesIngested: number;
      currentFile?: string;
      error?: string;
    }) => void
  ): Promise<{
    processedFiles: number;
    processedLines: number;
    entriesIngested: number;
  }> {
    const [server] = await this.db
      .select()
      .from(schema.servers)
      .where(eq(schema.servers.id, serverId));

    if (
      server === undefined ||
      !server.fileIngestionEnabled ||
      server.logPaths === null ||
      server.logPaths.length === 0
    ) {
      throw new Error('Server not found or file ingestion not enabled');
    }

    const provider = providers.get(server.providerId);
    if (!provider) {
      throw new Error(`Provider ${server.providerId} not found`);
    }

    // Check if provider supports file-based log ingestion
    if (!hasFileIngestionSupport(provider)) {
      throw new Error(`Provider ${server.providerId} does not support file-based log ingestion`);
    }

    const logFileConfig = provider.getLogFileConfig();
    const patterns =
      server.logFilePatterns !== null && server.logFilePatterns.length > 0
        ? [...server.logFilePatterns]
        : [...logFileConfig.filePatterns];

    // Discover all log files
    const logFiles = await this.fileDiscoveryService.discoverLogFiles(
      [...server.logPaths],
      patterns
    );

    if (logFiles.length === 0) {
      progressCallback?.({
        status: 'completed',
        totalFiles: 0,
        processedFiles: 0,
        totalLines: 0,
        processedLines: 0,
        entriesIngested: 0,
      });
      return { processedFiles: 0, processedLines: 0, entriesIngested: 0 };
    }

    this.logger.log(`Backfilling ${logFiles.length} log files for server ${server.name}`);

    progressCallback?.({
      status: 'started',
      totalFiles: logFiles.length,
      processedFiles: 0,
      totalLines: 0,
      processedLines: 0,
      entriesIngested: 0,
    });

    let totalProcessedFiles = 0;
    let totalProcessedLines = 0;
    let totalEntriesIngested = 0;

    // Process each file
    for (const filePath of logFiles) {
      try {
        const result = await this.backfillSingleFile(
          serverId,
          filePath,
          provider,
          (lineProgress) => {
            progressCallback?.({
              status: 'progress',
              totalFiles: logFiles.length,
              processedFiles: totalProcessedFiles,
              totalLines: lineProgress.totalLines,
              processedLines: totalProcessedLines + lineProgress.processedLines,
              entriesIngested: totalEntriesIngested + lineProgress.entriesIngested,
              currentFile: filePath,
            });
          }
        );

        totalProcessedFiles++;
        totalProcessedLines += result.processedLines;
        totalEntriesIngested += result.entriesIngested;

        this.logger.log(
          `Backfilled ${filePath}: ${result.processedLines} lines, ${result.entriesIngested} entries`
        );
      } catch (error) {
        this.logger.error(`Error backfilling ${filePath}:`, error);
        progressCallback?.({
          status: 'error',
          totalFiles: logFiles.length,
          processedFiles: totalProcessedFiles,
          totalLines: 0,
          processedLines: totalProcessedLines,
          entriesIngested: totalEntriesIngested,
          currentFile: filePath,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    progressCallback?.({
      status: 'completed',
      totalFiles: logFiles.length,
      processedFiles: totalProcessedFiles,
      totalLines: totalProcessedLines,
      processedLines: totalProcessedLines,
      entriesIngested: totalEntriesIngested,
    });

    return {
      processedFiles: totalProcessedFiles,
      processedLines: totalProcessedLines,
      entriesIngested: totalEntriesIngested,
    };
  }

  /**
   * Backfill a single log file
   */
  private async backfillSingleFile(
    serverId: string,
    filePath: string,
    provider: MediaServerProvider,
    progressCallback?: (progress: {
      totalLines: number;
      processedLines: number;
      entriesIngested: number;
    }) => void
  ): Promise<{
    processedLines: number;
    entriesIngested: number;
  }> {
    const { createReadStream } = await import('fs');
    const { createInterface } = await import('readline');

    const processor = new LogFileProcessor(provider);
    processor.setFilePath(filePath);

    const stream = createReadStream(filePath, { encoding: 'utf-8' });
    const rl = createInterface({ input: stream, crlfDelay: Infinity });

    let lineNumber = 0;
    let entriesIngested = 0;
    let parseFailures = 0;
    const BATCH_SIZE = 100;
    const BATCH_REPORT_SIZE = 1000;

    // Collect entries in batches for more efficient processing
    const pendingEntries: Array<{ entry: ParsedLogEntry; lineNum: number }> = [];

    for await (const line of rl) {
      lineNumber++;

      const result = processor.processLine(line, lineNumber);
      if (result) {
        pendingEntries.push({ entry: result, lineNum: lineNumber });
      } else if (lineNumber <= 5) {
        // Log first few failures for debugging
        this.logger.debug(`Line ${lineNumber} not parsed: ${line.substring(0, 80)}...`);
        parseFailures++;
      } else {
        parseFailures++;
      }

      // Process in batches
      if (pendingEntries.length >= BATCH_SIZE) {
        for (const { entry } of pendingEntries) {
          const inserted = await this.processEntry(serverId, entry, filePath);
          if (inserted) {
            entriesIngested++;
          }
        }
        pendingEntries.length = 0;
      }

      if (lineNumber % BATCH_REPORT_SIZE === 0) {
        progressCallback?.({
          totalLines: lineNumber,
          processedLines: lineNumber,
          entriesIngested,
        });
      }
    }

    // Process remaining entries
    for (const { entry } of pendingEntries) {
      const inserted = await this.processEntry(serverId, entry, filePath);
      if (inserted) {
        entriesIngested++;
      }
    }

    // Flush any pending entry from processor
    const pending = processor.flush();
    if (pending) {
      const inserted = await this.processEntry(serverId, pending, filePath);
      if (inserted) {
        entriesIngested++;
      }
    }

    this.logger.log(
      `Backfill complete for ${filePath}: ${lineNumber} lines, ${pendingEntries.length} parsed, ${entriesIngested} ingested, ${parseFailures} parse failures`
    );
    return { processedLines: lineNumber, entriesIngested };
  }
}
