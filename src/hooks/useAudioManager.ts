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
    console.log('🔊 Attempting to play audio, size:', audioData.byteLength);

    try {
      setIsPlaying(true);

      // Create a simple blob and audio element
      const blob = new Blob([audioData], { type: 'audio/mp3' });
      const audioUrl = URL.createObjectURL(blob);
      const audioElement = new Audio(audioUrl);

      // Store reference for stopping
      currentHtmlAudioRef.current = audioElement;

      // Set up event handlers
      audioElement.onended = () => {
        console.log('✅ Audio playback completed');
        setIsPlaying(false);
        currentHtmlAudioRef.current = null;
        URL.revokeObjectURL(audioUrl);
      };

      audioElement.onerror = (e) => {
        console.error('❌ Audio playback failed:', e);
        console.error('Audio error details:', audioElement.error);
        setIsPlaying(false);
        currentHtmlAudioRef.current = null;
        URL.revokeObjectURL(audioUrl);
      };

      // Play the audio
      console.log('▶️ Starting audio playback...');
      await audioElement.play();
      console.log('✅ Audio play() succeeded');

    } catch (error) {
      console.error('❌ Failed to play audio:', error);
      setIsPlaying(false);
      currentHtmlAudioRef.current = null;
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
