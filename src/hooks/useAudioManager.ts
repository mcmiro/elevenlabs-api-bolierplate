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
        // Keep microphone active continuously - let ElevenLabs handle turn-taking
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

        // Send all audio continuously - no silence detection
        // Always resample to configured target rate for ElevenLabs compatibility
        const targetSampleRate = 16000;
        const resampleRatio = targetSampleRate / sampleRate;
        const outputLength = Math.floor(inputData.length * resampleRatio);
        const resampledData = new Float32Array(outputLength);

        // Log for debugging audio input
        if (Date.now() - lastAudioSentRef.current > 5000) {
          // Log every 5 seconds
          console.log(
            `🎤 Recording audio: ${sampleRate}Hz -> ${targetSampleRate}Hz`
          );
        }

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
      console.log('🎤 Microphone recording started successfully');
    } catch {
      throw new Error('Failed to access microphone');
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
          audioContextRef.current = new (window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext })
              .webkitAudioContext)();
        }

        // Resume AudioContext if suspended
        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
        }

        const audioContext = audioContextRef.current;
        const numberOfChannels = 1; // Mono
        const bytesPerSample = 2; // 16-bit = 2 bytes per sample
        const numberOfSamples = audioData.byteLength / bytesPerSample;

        // Use ElevenLabs Conversational AI output sample rate (16kHz)
        const sampleRate = 16000;

        console.log(
          `🔊 Playing audio chunk: ${numberOfSamples} samples at ${sampleRate}Hz (${(
            numberOfSamples / sampleRate
          ).toFixed(2)}s) - Queue remaining: ${audioQueueRef.current.length}`
        );

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
            console.log('🔇 Audio chunk completed');
            currentAudioRef.current = null;
            resolve();
          };

          // Handle potential playback errors
          const timeoutId = setTimeout(() => {
            console.error('Audio playback timeout');
            currentAudioRef.current = null;
            reject(new Error('Audio playback timeout'));
          }, 10000); // 10 second timeout

          source.onended = () => {
            clearTimeout(timeoutId);
            console.log('🔇 Audio chunk completed');
            currentAudioRef.current = null;
            resolve();
          };

          source.start(0);
        });
      } catch (error) {
        console.error('Error playing audio chunk:', error);
        break;
      }
    }

    setIsPlaying(false);
    isProcessingAudioRef.current = false;
    console.log('🎵 Audio queue processing completed');
  }, []);

  const playAudio = useCallback(
    async (audioData: ArrayBuffer) => {
      try {
        // Following the official Eleven Labs SDK pattern:
        // Audio chunks should be queued and played sequentially, not discarded
        audioQueueRef.current.push(audioData);

        // If already processing audio, the queue will be handled when current audio ends
        if (isProcessingAudioRef.current) {
          console.log(
            '🎵 Audio chunk queued (current queue length:',
            audioQueueRef.current.length,
            ')'
          );
          return;
        }

        await processAudioQueue();
      } catch (error) {
        console.error('Audio playback error:', error);
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
    console.log('🛑 Audio stopped and queue cleared');
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
