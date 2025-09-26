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

  // Use ref for isRecording to avoid stale closures
  const isRecordingRef = useRef(false);
  const lastAudioSentRef = useRef(0); // Rate limiting for audio chunks

  const onAudioChunkRef = useRef<((chunk: ArrayBuffer) => void) | undefined>(
    undefined
  );

  // Update the ref whenever isRecording changes
  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

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
      // Request audio settings - use global audio configuration
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      streamRef.current = stream;

      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext)();
      }

      const audioContext = audioContextRef.current;

      // Resume AudioContext if suspended
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      // Use ScriptProcessor with configurable buffer size
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1); // Buffer size from config

      processor.onaudioprocess = (event) => {
        if (!isRecordingRef.current) {
          return;
        }

        if (!onAudioChunkRef.current) {
          return;
        }

        // Rate limiting: Use configurable chunk interval
        const now = Date.now();
        if (now - lastAudioSentRef.current < 100) {
          return; // Skip this chunk
        }

        const inputBuffer = event.inputBuffer;
        const inputData = inputBuffer.getChannelData(0);
        const sampleRate = audioContextRef.current?.sampleRate || 44100;

        // Check if there's actual audio data (not just silence) using configurable threshold
        let hasAudio = false;
        let maxAmplitude = 0;
        for (let i = 0; i < inputData.length; i++) {
          const amplitude = Math.abs(inputData[i]);
          maxAmplitude = Math.max(maxAmplitude, amplitude);
          if (amplitude > 0.01) {
            hasAudio = true;
          }
        }

        // Skip silent chunks to avoid sending unnecessary data
        if (!hasAudio) {
          return;
        }

        // Always resample to configured target rate for ElevenLabs compatibility
        const targetSampleRate = 16000;
        const resampleRatio = targetSampleRate / sampleRate;
        const outputLength = Math.floor(inputData.length * resampleRatio);
        const resampledData = new Float32Array(outputLength);

        // High-quality resampling with linear interpolation
        for (let i = 0; i < outputLength; i++) {
          const sourceIndex = i / resampleRatio;
          const index = Math.floor(sourceIndex);
          const fraction = sourceIndex - index;

          if (index < inputData.length - 1) {
            // Linear interpolation between samples
            resampledData[i] =
              inputData[index] * (1 - fraction) +
              inputData[index + 1] * fraction;
          } else {
            resampledData[i] = inputData[Math.min(index, inputData.length - 1)];
          }
        }

        // Convert to 16-bit PCM format (signed integers)
        const arrayBuffer = new ArrayBuffer(resampledData.length * 2);
        const dataView = new DataView(arrayBuffer);

        for (let i = 0; i < resampledData.length; i++) {
          // Clamp to [-1, 1] and convert to 16-bit signed integer
          const sample = Math.max(-1, Math.min(1, resampledData[i]));
          const value = Math.round(sample * 32767);
          dataView.setInt16(i * 2, value, true); // true = little-endian
        }

        lastAudioSentRef.current = now;
        onAudioChunkRef.current(arrayBuffer);
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      // Store the processor for cleanup
      mediaRecorderRef.current = processor as unknown as MediaRecorder;

      setIsRecording(true);
    } catch {
      throw new Error('Failed to access microphone');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      // Disconnect the audio processor (either AudioWorkletNode or ScriptProcessorNode)
      try {
        const processor = mediaRecorderRef.current as unknown as AudioNode;
        processor.disconnect();
        mediaRecorderRef.current = null;
      } catch {
        mediaRecorderRef.current = null;
      }
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setIsRecording(false);
  }, []);

  const playAudio = useCallback(async (audioData: ArrayBuffer) => {
    try {
      setIsPlaying(true);

      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext)();
      }

      // Resume AudioContext if suspended (common after user interaction requirements)
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      // Use configured sample rates and playback settings
      const audioContext = audioContextRef.current;
      const numberOfChannels = 1; // Mono
      const bytesPerSample = 2; // 16-bit = 2 bytes per sample
      const numberOfSamples = audioData.byteLength / bytesPerSample;

      // Use ElevenLabs output sample rate from config
      const sampleRate = 24000;

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

      // Create and play the audio source with speed and volume control
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;

      // Apply playback speed control if enabled
      source.playbackRate.value = 1.0;

      // Create gain node for volume control
      const gainNode = audioContext.createGain();
      gainNode.gain.value = 1.0;

      // Connect: source -> gain -> destination
      source.connect(gainNode);
      gainNode.connect(audioContext.destination);

      currentAudioRef.current = source;

      source.onended = () => {
        setIsPlaying(false);
        currentAudioRef.current = null;
      };

      source.start(0);
    } catch {
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
    }

    // Stop Web Audio API source if playing
    if (currentAudioRef.current) {
      currentAudioRef.current.stop();
      currentAudioRef.current = null;
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
