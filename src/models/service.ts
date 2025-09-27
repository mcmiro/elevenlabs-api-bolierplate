/**
 * Service-related callback types
 */

import type { ConnectionState } from './chat';

export interface ServiceCallbacks {
  onMessage?: (message: string) => void;
  onAudio?: (audioData: ArrayBuffer) => void;
  onError?: (error: Error) => void;
  onConnectionStateChange?: (state: ConnectionState) => void;
  onUserTranscript?: (transcript: string) => void;
}
