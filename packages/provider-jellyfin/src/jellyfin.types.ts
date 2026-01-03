/**
 * Jellyfin API types
 * Based on Jellyfin OpenAPI specification
 */

/**
 * System information from /System/Info
 */
export interface JellyfinSystemInfo {
  readonly ServerName: string;
  readonly Version: string;
  readonly Id: string;
  readonly OperatingSystem: string;
  readonly HasPendingRestart: boolean;
  readonly HasUpdateAvailable: boolean;
  readonly SupportsLibraryMonitor: boolean;
  readonly WebSocketPortNumber: number;
  readonly LocalAddress: string;
}

/**
 * Session info from /Sessions
 */
export interface JellyfinSession {
  readonly Id: string;
  readonly UserId: string;
  readonly UserName: string;
  readonly Client: string;
  readonly DeviceId: string;
  readonly DeviceName: string;
  readonly ApplicationVersion: string;
  readonly RemoteEndPoint: string;
  readonly LastActivityDate: string;
  readonly LastPlaybackCheckIn: string;
  readonly NowPlayingItem?: JellyfinNowPlayingItem;
  readonly PlayState?: JellyfinPlayState;
  readonly TranscodingInfo?: JellyfinTranscodingInfo;
  readonly IsActive: boolean;
  readonly SupportsRemoteControl: boolean;
  readonly SupportsMediaControl: boolean;
}

/**
 * Currently playing item info
 */
export interface JellyfinNowPlayingItem {
  readonly Id: string;
  readonly Name: string;
  readonly Type: string;
  readonly SeriesName?: string;
  readonly SeasonName?: string;
  readonly IndexNumber?: number;
  readonly ParentIndexNumber?: number;
  readonly RunTimeTicks: number;
  readonly MediaType: string;
  readonly Container?: string;
  readonly VideoType?: string;
}

/**
 * Playback state
 */
export interface JellyfinPlayState {
  readonly PositionTicks: number;
  readonly CanSeek: boolean;
  readonly IsPaused: boolean;
  readonly IsMuted: boolean;
  readonly VolumeLevel: number;
  readonly AudioStreamIndex?: number;
  readonly SubtitleStreamIndex?: number;
  readonly MediaSourceId?: string;
  readonly PlayMethod: string;
  readonly RepeatMode: string;
}

/**
 * Transcoding info
 */
export interface JellyfinTranscodingInfo {
  readonly AudioCodec: string;
  readonly VideoCodec: string;
  readonly Container: string;
  readonly IsVideoDirect: boolean;
  readonly IsAudioDirect: boolean;
  readonly Bitrate: number;
  readonly Framerate?: number;
  readonly CompletionPercentage: number;
  readonly Width?: number;
  readonly Height?: number;
  readonly AudioChannels?: number;
  readonly TranscodeReasons: readonly string[];
}

/**
 * User info from /Users
 */
export interface JellyfinUser {
  readonly Id: string;
  readonly Name: string;
  readonly ServerId: string;
  readonly HasPassword: boolean;
  readonly HasConfiguredPassword: boolean;
  readonly HasConfiguredEasyPassword: boolean;
  readonly EnableAutoLogin: boolean;
  readonly LastLoginDate?: string;
  readonly LastActivityDate?: string;
  readonly Policy: JellyfinUserPolicy;
}

/**
 * User policy/permissions
 */
export interface JellyfinUserPolicy {
  readonly IsAdministrator: boolean;
  readonly IsDisabled: boolean;
  readonly EnableRemoteAccess: boolean;
}

/**
 * Activity log entry from /System/ActivityLog/Entries
 */
export interface JellyfinActivityLogEntry {
  readonly Id: number;
  readonly Name: string;
  readonly Type: string;
  readonly Overview?: string;
  readonly ShortOverview?: string;
  readonly UserId?: string;
  readonly ItemId?: string;
  readonly Date: string;
  readonly Severity: string;
}

/**
 * Query result wrapper
 */
export interface JellyfinQueryResult<T> {
  readonly Items: readonly T[];
  readonly TotalRecordCount: number;
  readonly StartIndex: number;
}

/**
 * WebSocket message types from Jellyfin
 */
export type JellyfinWebSocketMessageType =
  | 'ForceKeepAlive'
  | 'KeepAlive'
  | 'Sessions'
  | 'SessionsStart'
  | 'SessionsStop'
  | 'PlaybackStart'
  | 'PlaybackStopped'
  | 'PlaybackProgress'
  | 'UserDataChanged'
  | 'GeneralCommand';

/**
 * Base WebSocket message structure
 */
export interface JellyfinWebSocketMessage<T = unknown> {
  readonly MessageType: JellyfinWebSocketMessageType;
  readonly MessageId?: string;
  readonly Data?: T;
}

/**
 * Sessions message data (array of active sessions)
 */
export type JellyfinSessionsData = readonly JellyfinSession[];

/**
 * Playback progress message data
 */
export interface JellyfinPlaybackProgressData {
  readonly PlaySessionId: string;
  readonly ItemId: string;
  readonly MediaSourceId?: string;
  readonly PositionTicks: number;
  readonly IsPaused: boolean;
  readonly IsMuted: boolean;
  readonly VolumeLevel?: number;
  readonly PlayMethod?: string;
  readonly LiveStreamId?: string;
  readonly SessionId?: string;
}

/**
 * Playback start/stop message data
 */
export interface JellyfinPlaybackEventData {
  readonly SessionId: string;
  readonly UserId?: string;
  readonly UserName?: string;
  readonly DeviceId?: string;
  readonly DeviceName?: string;
  readonly Client?: string;
  readonly ItemId?: string;
  readonly ItemName?: string;
  readonly ItemType?: string;
  readonly PlaySessionId?: string;
  readonly PositionTicks?: number;
  readonly NowPlayingItem?: JellyfinNowPlayingItem;
  readonly PlayState?: JellyfinPlayState;
}
