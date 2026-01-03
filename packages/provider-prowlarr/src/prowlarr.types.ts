/**
 * Prowlarr-specific types
 *
 * Prowlarr is an indexer manager for *arr apps. It has a different
 * history structure focused on indexer/search activities rather than
 * media downloads.
 */

import type { ArrHistoryRecordBase } from '@logarr/provider-arr';

/**
 * Prowlarr indexer information
 */
export interface ProwlarrIndexer {
  readonly id: number;
  readonly name: string;
  readonly enableRss: boolean;
  readonly enableAutomaticSearch: boolean;
  readonly enableInteractiveSearch: boolean;
  readonly protocol: 'torrent' | 'usenet';
  readonly priority: number;
  readonly fields?: readonly { name: string; value: unknown }[];
}

/**
 * Prowlarr application (synced *arr app) information
 */
export interface ProwlarrApplication {
  readonly id: number;
  readonly name: string;
  readonly syncLevel: 'disabled' | 'addOnly' | 'fullSync';
  readonly implementation: string;
  readonly tags?: readonly number[];
}

/**
 * Prowlarr history record extends the base with indexer-specific data
 */
export interface ProwlarrHistoryRecord extends ArrHistoryRecordBase {
  readonly indexerId: number;
  readonly indexer?: ProwlarrIndexer;
  readonly successful?: boolean;
  readonly elapsedTime?: number;
  readonly query?: string;
  readonly categories?: readonly number[];
}

/**
 * Prowlarr search results
 */
export interface ProwlarrSearchResult {
  readonly guid: string;
  readonly indexerId: number;
  readonly indexer: string;
  readonly title: string;
  readonly size: number;
  readonly publishDate: string;
  readonly categories: readonly { id: number; name: string }[];
  readonly downloadUrl?: string;
  readonly infoUrl?: string;
  readonly seeders?: number;
  readonly leechers?: number;
  readonly protocol: 'torrent' | 'usenet';
}

/**
 * Prowlarr event types
 */
export const ProwlarrEventTypes = {
  IndexerQuery: 1,
  ReleaseGrabbed: 2,
  IndexerRss: 3,
  IndexerAuth: 4,
} as const;

export type ProwlarrEventType = (typeof ProwlarrEventTypes)[keyof typeof ProwlarrEventTypes];

/**
 * Human-readable event type names
 */
export const ProwlarrEventTypeNames: Record<number, string> = {
  [ProwlarrEventTypes.IndexerQuery]: 'Query',
  [ProwlarrEventTypes.ReleaseGrabbed]: 'Grabbed',
  [ProwlarrEventTypes.IndexerRss]: 'RSS Sync',
  [ProwlarrEventTypes.IndexerAuth]: 'Auth',
};
