/**
 * Radarr-specific API types
 */

import type { ArrHistoryRecordBase, ArrQueueItemBase } from '@logarr/provider-arr';

/**
 * Radarr movie object
 */
export interface RadarrMovie {
  readonly id: number;
  readonly title: string;
  readonly sortTitle: string;
  readonly sizeOnDisk: number;
  readonly status: string;
  readonly overview: string;
  readonly inCinemas?: string;
  readonly physicalRelease?: string;
  readonly digitalRelease?: string;
  readonly images: readonly { readonly coverType: string; readonly url: string }[];
  readonly website: string;
  readonly year: number;
  readonly hasFile: boolean;
  readonly youTubeTrailerId: string;
  readonly studio: string;
  readonly path: string;
  readonly qualityProfileId: number;
  readonly monitored: boolean;
  readonly minimumAvailability: string;
  readonly isAvailable: boolean;
  readonly folderName: string;
  readonly runtime: number;
  readonly cleanTitle: string;
  readonly imdbId: string;
  readonly tmdbId: number;
  readonly titleSlug: string;
  readonly certification: string;
  readonly genres: readonly string[];
  readonly tags: readonly number[];
  readonly added: string;
  readonly ratings: {
    readonly imdb?: { readonly votes: number; readonly value: number; readonly type: string };
    readonly tmdb?: { readonly votes: number; readonly value: number; readonly type: string };
  };
  readonly movieFile?: {
    readonly id: number;
    readonly movieId: number;
    readonly relativePath: string;
    readonly path: string;
    readonly size: number;
    readonly dateAdded: string;
  };
}

/**
 * Radarr history record with movie info
 */
export interface RadarrHistoryRecord extends ArrHistoryRecordBase {
  readonly movieId: number;
  readonly movie?: RadarrMovie;
}

/**
 * Radarr queue item with movie info
 */
export interface RadarrQueueItem extends ArrQueueItemBase {
  readonly movieId: number;
  readonly movie?: RadarrMovie;
}

/**
 * Radarr event types (numeric values used by API)
 */
export const RadarrEventTypes = {
  Unknown: 0,
  Grabbed: 1,
  // Note: 2 is skipped (was SeriesFolderImported in Sonarr)
  DownloadFolderImported: 3,
  DownloadFailed: 4,
  // Note: 5 is skipped
  MovieFileDeleted: 6,
  // Note: 7 is skipped
  MovieFileRenamed: 8,
  MovieFolderImported: 9,
  Ignored: 10,
} as const;

/**
 * Radarr event type string mapping
 */
export const RadarrEventTypeNames: Record<number, string> = {
  [RadarrEventTypes.Unknown]: 'unknown',
  [RadarrEventTypes.Grabbed]: 'grabbed',
  [RadarrEventTypes.DownloadFolderImported]: 'downloadFolderImported',
  [RadarrEventTypes.DownloadFailed]: 'downloadFailed',
  [RadarrEventTypes.MovieFileDeleted]: 'movieFileDeleted',
  [RadarrEventTypes.MovieFileRenamed]: 'movieFileRenamed',
  [RadarrEventTypes.MovieFolderImported]: 'movieFolderImported',
  [RadarrEventTypes.Ignored]: 'ignored',
};
