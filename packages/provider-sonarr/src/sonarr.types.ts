/**
 * Sonarr-specific API types
 */

import type { ArrHistoryRecordBase, ArrQueueItemBase } from '@logarr/provider-arr';

/**
 * Sonarr series object
 */
export interface SonarrSeries {
  readonly id: number;
  readonly title: string;
  readonly sortTitle: string;
  readonly status: string;
  readonly ended: boolean;
  readonly overview: string;
  readonly network: string;
  readonly airTime: string;
  readonly images: readonly { readonly coverType: string; readonly url: string }[];
  readonly seasons: readonly { readonly seasonNumber: number; readonly monitored: boolean }[];
  readonly year: number;
  readonly path: string;
  readonly qualityProfileId: number;
  readonly seasonFolder: boolean;
  readonly monitored: boolean;
  readonly useSceneNumbering: boolean;
  readonly runtime: number;
  readonly tvdbId: number;
  readonly tvRageId: number;
  readonly tvMazeId: number;
  readonly firstAired: string;
  readonly seriesType: string;
  readonly cleanTitle: string;
  readonly imdbId: string;
  readonly titleSlug: string;
  readonly certification: string;
  readonly genres: readonly string[];
  readonly tags: readonly number[];
  readonly added: string;
}

/**
 * Sonarr episode object
 */
export interface SonarrEpisode {
  readonly id: number;
  readonly seriesId: number;
  readonly tvdbId: number;
  readonly episodeFileId: number;
  readonly seasonNumber: number;
  readonly episodeNumber: number;
  readonly title: string;
  readonly airDate: string;
  readonly airDateUtc: string;
  readonly overview: string;
  readonly hasFile: boolean;
  readonly monitored: boolean;
  readonly absoluteEpisodeNumber?: number;
  readonly unverifiedSceneNumbering: boolean;
}

/**
 * Sonarr history record with series/episode info
 */
export interface SonarrHistoryRecord extends ArrHistoryRecordBase {
  readonly seriesId: number;
  readonly episodeId: number;
  readonly series?: SonarrSeries;
  readonly episode?: SonarrEpisode;
}

/**
 * Sonarr queue item with series/episode info
 */
export interface SonarrQueueItem extends ArrQueueItemBase {
  readonly seriesId: number;
  readonly episodeId: number;
  readonly seasonNumber: number;
  readonly series?: SonarrSeries;
  readonly episode?: SonarrEpisode;
}

/**
 * Sonarr event types (numeric values used by API)
 */
export const SonarrEventTypes = {
  Unknown: 0,
  Grabbed: 1,
  SeriesFolderImported: 2,
  DownloadFolderImported: 3,
  DownloadFailed: 4,
  EpisodeFileDeleted: 5,
  EpisodeFileRenamed: 6,
  ImportFailed: 7,
} as const;

/**
 * Sonarr event type string mapping
 */
export const SonarrEventTypeNames: Record<number, string> = {
  [SonarrEventTypes.Unknown]: 'unknown',
  [SonarrEventTypes.Grabbed]: 'grabbed',
  [SonarrEventTypes.SeriesFolderImported]: 'seriesFolderImported',
  [SonarrEventTypes.DownloadFolderImported]: 'downloadFolderImported',
  [SonarrEventTypes.DownloadFailed]: 'downloadFailed',
  [SonarrEventTypes.EpisodeFileDeleted]: 'episodeFileDeleted',
  [SonarrEventTypes.EpisodeFileRenamed]: 'episodeFileRenamed',
  [SonarrEventTypes.ImportFailed]: 'importFailed',
};
