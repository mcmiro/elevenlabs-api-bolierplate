import { useCallback, useEffect, useRef, useState } from 'react';

export interface AudioManager {
  isRecording: boolean;
  isPlaying: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  playAudio: (audioData: ArrayBuffer) => Promise<void>;
  stopAudio: () => void;
  onAudioChunk?: (chunk: ArrayBuffer) => void;
}

export const useAudioManager = (): AudioManager => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const currentAudioRef = useRef<AudioBufferSourceNode | null>(null);
  const currentHtmlAudioRef = useRef<HTMLAudioElement | null>(null);

  const onAudioChunkRef = useRef<((chunk: ArrayBuffer) => void) | undefined>(
    undefined
  );

  // Initialize audio context
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext)();

    return () => {
      if (
        audioContextRef.current &&
        audioContextRef.current.state !== 'closed'
      ) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const startRecording = useCallback(async () => {
    try {
      // Request high-quality audio settings for better compatibility with Eleven Labs
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1, // Mono
          sampleRate: 44100, // Standard sample rate that Eleven Labs supports
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      // Try different MIME types based on what the browser supports and what Eleven Labs might prefer
      const preferredMimeTypes = [
        'audio/webm;codecs=pcm', // PCM in WebM container
        'audio/webm;codecs=opus', // Opus codec (Eleven Labs supports this)
        'audio/webm', // Default WebM
        'audio/mp4', // MP4 container
        'audio/wav', // WAV (if supported)
      ];

      let selectedMimeType = 'audio/webm;codecs=opus'; // Default fallback

      for (const mimeType of preferredMimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          console.log(`Selected MIME type for recording: ${mimeType}`);
          break;
        }
      }

      if (!MediaRecorder.isTypeSupported(selectedMimeType)) {
        console.warn(
          `Selected MIME type ${selectedMimeType} not supported, using default`
        );
        selectedMimeType = ''; // Let browser choose
      }

      const options: MediaRecorderOptions = {};
      if (selectedMimeType) {
        options.mimeType = selectedMimeType;
      }

      // Set a reasonable bitrate for voice
      if ('audioBitsPerSecond' in MediaRecorder.prototype) {
        options.audioBitsPerSecond = 64000; // 64kbps should be enough for voice
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && onAudioChunkRef.current) {
          event.data.arrayBuffer().then((buffer) => {
            onAudioChunkRef.current?.(buffer);
          });
        }
      };

      mediaRecorder.start(100); // Capture audio chunks every 100ms
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw new Error('Failed to access microphone');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === 'recording'
    ) {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setIsRecording(false);
  }, []);

  const playAudio = useCallback(async (audioData: ArrayBuffer) => {
    console.log('🔊 Playing raw audio data, size:', audioData.byteLength);

    try {
      setIsPlaying(true);

      if (!audioContextRef.current) {
        throw new Error('Audio context not available');
      }

      // Eleven Labs sends raw PCM audio data (16-bit, 22050 Hz, mono)
      // Convert ArrayBuffer to AudioBuffer for raw PCM playback
      const audioContext = audioContextRef.current;
      const sampleRate = 22050; // Eleven Labs default sample rate
      const numberOfChannels = 1; // Mono
      const bytesPerSample = 2; // 16-bit = 2 bytes per sample

      const numberOfSamples = audioData.byteLength / bytesPerSample;
      const audioBuffer = audioContext.createBuffer(
        numberOfChannels,
        numberOfSamples,
        sampleRate
      );

      // Convert raw bytes to Float32Array for Web Audio API
      const int16Array = new Int16Array(audioData);
      const float32Array = audioBuffer.getChannelData(0);

      // Convert 16-bit integers to floating point values (-1.0 to 1.0)
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768.0;
      }

      // Create and play the audio source
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);

      currentAudioRef.current = source;

      source.onended = () => {
        console.log('✅ Audio playback completed');
        setIsPlaying(false);
        currentAudioRef.current = null;
      };

      source.start(0);
      console.log('✅ Raw PCM audio playback started');
    } catch (error) {
      console.error('❌ Failed to play raw audio:', error);
      setIsPlaying(false);
      currentAudioRef.current = null;
    }
  }, []);

  const stopAudio = useCallback(() => {
    // Stop HTML5 Audio element if playing
    if (currentHtmlAudioRef.current) {
      currentHtmlAudioRef.current.pause();
      currentHtmlAudioRef.current.currentTime = 0;
      currentHtmlAudioRef.current = null;
      console.log('Stopped HTML5 audio');
    }

    // Stop Web Audio API source if playing
    if (currentAudioRef.current) {
      currentAudioRef.current.stop();
      currentAudioRef.current = null;
      console.log('Stopped Web Audio API source');
    }

    setIsPlaying(false);
  }, []);

  return {
    isRecording,
    isPlaying,
    startRecording,
    stopRecording,
    playAudio,
    stopAudio,
    get onAudioChunk() {
      return onAudioChunkRef.current;
    },
    set onAudioChunk(callback) {
      onAudioChunkRef.current = callback;
    },
  };
};
