// Global Audio Configuration for ElevenLabs Chat
// Adjust these settings to control audio quality and playback speed

export interface AudioSettings {
  // Recording settings
  recording: {
    sampleRate: number; // Hz - Input sample rate from microphone
    channelCount: number; // 1 = mono, 2 = stereo
    echoCancellation: boolean; // Reduce echo during recording
    noiseSuppression: boolean; // Reduce background noise
    autoGainControl: boolean; // Automatic volume adjustment
    bufferSize: number; // Audio processing buffer size (smaller = more responsive)
    chunkInterval: number; // ms - How often to send audio chunks
    silenceThreshold: number; // Minimum amplitude to consider as speech
  };

  // Playback settings
  playback: {
    targetSampleRate: number; // Hz - Sample rate for audio processing
    playbackSpeed: number; // Playback speed multiplier (0.5 = half speed, 2.0 = double speed)
    volume: number; // Volume level (0.0 to 1.0)
    enableSpeedControl: boolean; // Whether to apply playback speed adjustment
  };

  // ElevenLabs specific settings
  elevenLabs: {
    inputSampleRate: number; // Hz - Sample rate to send to ElevenLabs API
    outputSampleRate: number; // Hz - Expected sample rate from ElevenLabs
  };

  // Debug settings
  debug: {
    logAudioDetails: boolean; // Log detailed audio processing info
    logChunks: boolean; // Log individual audio chunks
  };
}

// Default settings - MODIFY THESE TO CHANGE BEHAVIOR
export const defaultAudioSettings: AudioSettings = {
  recording: {
    sampleRate: 48000, // Let browser choose optimal rate
    channelCount: 1, // Mono recording
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    bufferSize: 2048, // Smaller buffer = more responsive (256, 512, 1024, 2048, 4096)
    chunkInterval: 100, // Send chunks every 100ms
    silenceThreshold: 0.01, // Minimum amplitude to consider as speech
  },

  playback: {
    targetSampleRate: 22050, // ElevenLabs standard rate
    playbackSpeed: 0.8, // 🔧 SLOW DOWN SPEECH TO 80% SPEED (make it slower to understand)
    volume: 1.0, // Full volume
    enableSpeedControl: true, // Enable speed adjustment
  },

  elevenLabs: {
    inputSampleRate: 16000, // ElevenLabs expects 16kHz input
    outputSampleRate: 22050, // ElevenLabs sends 22.05kHz output
  },

  debug: {
    logAudioDetails: true, // Enable detailed logging
    logChunks: false, // Disable chunk logging (can be noisy)
  },
};

// 🎯 QUICK PRESETS FOR DIFFERENT NEEDS

// Slower speech for better understanding
export const slowSpeechSettings: AudioSettings = {
  ...defaultAudioSettings,
  playback: {
    ...defaultAudioSettings.playback,
    playbackSpeed: 0.6, // 60% speed - much slower
  },
};

// Faster speech for quick responses
export const fastSpeechSettings: AudioSettings = {
  ...defaultAudioSettings,
  playback: {
    ...defaultAudioSettings.playback,
    playbackSpeed: 1.3, // 130% speed - faster
  },
};

// High quality settings (more responsive but more CPU intensive)
export const highQualitySettings: AudioSettings = {
  ...defaultAudioSettings,
  recording: {
    ...defaultAudioSettings.recording,
    bufferSize: 1024, // Smaller buffer for more responsiveness
    chunkInterval: 50, // Send chunks more frequently
    silenceThreshold: 0.005, // More sensitive to quiet speech
  },
};

// Low CPU usage settings
export const lowCpuSettings: AudioSettings = {
  ...defaultAudioSettings,
  recording: {
    ...defaultAudioSettings.recording,
    bufferSize: 4096, // Larger buffer for less CPU usage
    chunkInterval: 200, // Send chunks less frequently
  },
  debug: {
    logAudioDetails: false, // Disable logging to save CPU
    logChunks: false,
  },
};

// Current active settings - change this to switch presets
export let currentAudioSettings: AudioSettings = slowSpeechSettings; // 🔧 START WITH SLOW SPEECH

// Function to update audio settings at runtime
export const updateAudioSettings = (newSettings: Partial<AudioSettings>) => {
  currentAudioSettings = {
    ...currentAudioSettings,
    ...newSettings,
    recording: {
      ...currentAudioSettings.recording,
      ...(newSettings.recording || {}),
    },
    playback: {
      ...currentAudioSettings.playback,
      ...(newSettings.playback || {}),
    },
    elevenLabs: {
      ...currentAudioSettings.elevenLabs,
      ...(newSettings.elevenLabs || {}),
    },
    debug: {
      ...currentAudioSettings.debug,
      ...(newSettings.debug || {}),
    },
  };
  console.log('🔧 Updated audio settings:', currentAudioSettings);
};

// Utility functions to quickly change common settings
export const setPlaybackSpeed = (speed: number) => {
  updateAudioSettings({
    playback: { ...currentAudioSettings.playback, playbackSpeed: speed },
  });
};

export const setVolume = (volume: number) => {
  updateAudioSettings({
    playback: {
      ...currentAudioSettings.playback,
      volume: Math.max(0, Math.min(1, volume)),
    },
  });
};

export const enableDebugLogging = (enabled: boolean) => {
  updateAudioSettings({
    debug: { ...currentAudioSettings.debug, logAudioDetails: enabled },
  });
};
