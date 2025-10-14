import { useCallback, useEffect, useRef, useState } from 'react';
import type { AudioManager } from '../models';

export { type AudioManager } from '../models';

export const useAudioManager = (): AudioManager => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const currentAudioRef = useRef<AudioBufferSourceNode | null>(null);
  const currentHtmlAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioQueueRef = useRef<ArrayBuffer[]>([]); // Audio queue to prevent overlapping
  const isProcessingAudioRef = useRef(false); // Prevent concurrent audio processing

  // Use ref for isRecording to avoid stale closures
  const isRecordingRef = useRef(false);
  const lastAudioSentRef = useRef(0); // Rate limiting for audio chunks

  const onAudioChunkRef = useRef<((chunk: ArrayBuffer) => void) | undefined>(
    undefined
  );

  // Update the refs whenever states change
  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  // Initialize audio context with default settings for better compatibility
  useEffect(() => {
    try {
      audioContextRef.current = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();
    } catch {
      audioContextRef.current = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();
    }

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
      // Request audio with simpler constraints to avoid permission issues
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      if (!audioContextRef.current) {
        // Create AudioContext with default sample rate for better compatibility
        try {
          audioContextRef.current = new (window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext })
              .webkitAudioContext)();
        } catch {
          audioContextRef.current = new (window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext })
              .webkitAudioContext)();
        }
      }

      const audioContext = audioContextRef.current;

      // Resume AudioContext if suspended
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      // Use stable buffer size for reliable audio processing
      const source = audioContext.createMediaStreamSource(stream);

      // Add low-pass filter to prevent aliasing during downsampling
      const filter = audioContext.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 7500; // Anti-aliasing filter for 48kHz->16kHz conversion
      filter.Q.value = 0.5;

      const processor = audioContext.createScriptProcessor(1024, 1, 1); // Stable buffer size

      processor.onaudioprocess = (event) => {
        // Keep microphone active continuously - let ElevenLabs handle turn-taking
        if (!isRecordingRef.current) {
          return;
        }

        if (!onAudioChunkRef.current) {
          return;
        }

        // Rate limiting: Use stable intervals
        const now = Date.now();
        if (now - lastAudioSentRef.current < 50) {
          // 50ms intervals - stable and proven
          return; // Skip this chunk
        }

        const inputBuffer = event.inputBuffer;
        const inputData = inputBuffer.getChannelData(0);
        const contextSampleRate = audioContextRef.current?.sampleRate || 44100;

        // Send all audio continuously for reliable transcription
        // ElevenLabs expects 16kHz PCM format
        const targetSampleRate = 16000;

        // Always resample to exactly 16kHz for ElevenLabs PCM_16000 format
        let finalData = inputData;
        if (contextSampleRate !== targetSampleRate) {
          const resampleRatio = targetSampleRate / contextSampleRate;
          const outputLength = Math.floor(inputData.length * resampleRatio);
          const resampledData = new Float32Array(outputLength);

          // Use proven linear interpolation for reliable resampling
          for (let i = 0; i < outputLength; i++) {
            const sourceIndex = i / resampleRatio;
            const index = Math.floor(sourceIndex);
            const fraction = sourceIndex - index;

            if (index < inputData.length - 1) {
              // Linear interpolation - stable and reliable
              resampledData[i] =
                inputData[index] * (1 - fraction) +
                inputData[index + 1] * fraction;
            } else {
              resampledData[i] =
                inputData[Math.min(index, inputData.length - 1)];
            }
          }
          finalData = resampledData;
        }

        // Convert to exact PCM_16000 format as expected by ElevenLabs
        const arrayBuffer = new ArrayBuffer(finalData.length * 2);
        const dataView = new DataView(arrayBuffer);

        for (let i = 0; i < finalData.length; i++) {
          let sample = finalData[i];

          // Ensure exact range [-1.0, 1.0] without any dithering for cleaner signal
          sample = Math.max(-1.0, Math.min(1.0, sample));

          // Convert to signed 16-bit integer (PCM_16000 format)
          const value = Math.round(sample * 32767);
          dataView.setInt16(i * 2, value, true); // little-endian for PCM
        }

        lastAudioSentRef.current = now;
        onAudioChunkRef.current(arrayBuffer);
      };

      source.connect(filter);
      filter.connect(processor);
      processor.connect(audioContext.destination);

      // Store the processor for cleanup
      mediaRecorderRef.current = processor as unknown as MediaRecorder;

      setIsRecording(true);
    } catch (error) {
      setIsRecording(false);
      throw new Error(
        `Failed to access microphone: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }, []); // Remove isPlaying dependency - let microphone run continuously

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

  const processAudioQueue = useCallback(async () => {
    if (isProcessingAudioRef.current || audioQueueRef.current.length === 0) {
      return;
    }

    isProcessingAudioRef.current = true;
    setIsPlaying(true);

    while (audioQueueRef.current.length > 0) {
      const audioData = audioQueueRef.current.shift()!;

      try {
        if (!audioContextRef.current) {
          // Create with default settings for better compatibility
          try {
            audioContextRef.current = new (window.AudioContext ||
              (window as unknown as { webkitAudioContext: typeof AudioContext })
                .webkitAudioContext)();
          } catch {
            audioContextRef.current = new (window.AudioContext ||
              (window as unknown as { webkitAudioContext: typeof AudioContext })
                .webkitAudioContext)();
          }
        }

        // Resume AudioContext if suspended
        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
        }

        const audioContext = audioContextRef.current;
        const numberOfChannels = 1; // Mono
        const bytesPerSample = 2; // 16-bit = 2 bytes per sample
        const numberOfSamples = audioData.byteLength / bytesPerSample;

        // ElevenLabs Conversational AI output is 16kHz PCM
        const sampleRate = 16000;

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

        // Add fade-in to first few samples to prevent clicks/pops at chunk boundaries
        const fadeInSamples = Math.min(32, float32Array.length); // 2ms fade at 16kHz
        for (let i = 0; i < fadeInSamples; i++) {
          const fadeGain = i / fadeInSamples;
          float32Array[i] *= fadeGain;
        }

        // Add fade-out to last few samples
        const fadeOutSamples = Math.min(32, float32Array.length);
        const startFadeOut = float32Array.length - fadeOutSamples;
        for (let i = 0; i < fadeOutSamples; i++) {
          const fadeGain = (fadeOutSamples - i) / fadeOutSamples;
          float32Array[startFadeOut + i] *= fadeGain;
        }

        // Create and play the audio source
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.playbackRate.value = 1.0;

        // Create gain node for volume control
        const gainNode = audioContext.createGain();
        gainNode.gain.value = 1.0;

        // Connect: source -> gain -> destination
        source.connect(gainNode);
        gainNode.connect(audioContext.destination);

        currentAudioRef.current = source;

        // Wait for this chunk to finish before processing next
        await new Promise<void>((resolve, reject) => {
          source.onended = () => {
            currentAudioRef.current = null;
            resolve();
          };

          // Handle potential playback errors
          const timeoutId = setTimeout(() => {
            currentAudioRef.current = null;
            reject(new Error('Audio playback timeout'));
          }, 10000); // 10 second timeout

          source.onended = () => {
            clearTimeout(timeoutId);
            currentAudioRef.current = null;
            resolve();
          };

          source.start(0);
        });
      } catch {
        break;
      }
    }

    setIsPlaying(false);
    isProcessingAudioRef.current = false;
  }, []);

  const playAudio = useCallback(
    async (audioData: ArrayBuffer) => {
      try {
        // Following the official Eleven Labs SDK pattern:
        // Audio chunks should be queued and played sequentially, not discarded
        audioQueueRef.current.push(audioData);

        // If already processing audio, the queue will be handled when current audio ends
        if (isProcessingAudioRef.current) {
          return;
        }

        await processAudioQueue();
      } catch {
        setIsPlaying(false);
        isProcessingAudioRef.current = false;
      }
    },
    [processAudioQueue]
  );

  const stopAudio = useCallback(() => {
    // Clear the audio queue to stop all pending audio
    audioQueueRef.current = [];

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
    isProcessingAudioRef.current = false; // Reset processing flag
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
