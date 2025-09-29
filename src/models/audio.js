/**
 * Audio management utilities
 */

// Audio states
export const AUDIO_STATES = {
  IDLE: 'idle',
  RECORDING: 'recording',
  PLAYING: 'playing',
  PAUSED: 'paused',
};

// Audio manager factory
export const createAudioManager = (config = {}) => {
  return {
    isRecording: false,
    isPlaying: false,
    state: AUDIO_STATES.IDLE,
    onAudioChunk: config.onAudioChunk || null,

    // Methods will be implemented by the actual audio manager
    startRecording: async () => {
      throw new Error('startRecording method must be implemented');
    },

    stopRecording: () => {
      throw new Error('stopRecording method must be implemented');
    },

    playAudio: async () => {
      throw new Error('playAudio method must be implemented');
    },

    stopAudio: () => {
      throw new Error('stopAudio method must be implemented');
    },
  };
};

// Validation helpers
export const isValidAudioData = (audioData) => {
  return audioData instanceof ArrayBuffer && audioData.byteLength > 0;
};

export const isValidAudioState = (state) => {
  return Object.values(AUDIO_STATES).includes(state);
};
