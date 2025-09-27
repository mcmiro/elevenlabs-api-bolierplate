/**
 * Audio management related types
 */

export interface AudioManager {
  isRecording: boolean;
  isPlaying: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  playAudio: (audioData: ArrayBuffer) => Promise<void>;
  stopAudio: () => void;
  onAudioChunk?: (chunk: ArrayBuffer) => void;
}
