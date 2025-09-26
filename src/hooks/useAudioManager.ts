import { useCallback, useEffect, useRef, useState } from 'react';
import { currentAudioSettings } from '../config/audioConfig';

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
      console.log('🎤 Starting audio recording...');

      // Request audio settings - use global audio configuration
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: currentAudioSettings.recording.channelCount,
          echoCancellation: currentAudioSettings.recording.echoCancellation,
          noiseSuppression: currentAudioSettings.recording.noiseSuppression,
          autoGainControl: currentAudioSettings.recording.autoGainControl,
        },
      });

      streamRef.current = stream;
      console.log('✅ Got media stream');

      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext)();
      }

      const audioContext = audioContextRef.current;

      // Resume AudioContext if suspended
      if (audioContext.state === 'suspended') {
        console.log('🔊 Resuming suspended AudioContext');
        await audioContext.resume();
      }

      console.log('🔍 AudioContext sample rate:', audioContext.sampleRate);
      console.log(
        '🔍 Stream settings:',
        stream.getAudioTracks()[0].getSettings()
      );

      console.log('🎤 Setting up audio processing with ScriptProcessor');

      // Use ScriptProcessor with configurable buffer size
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(
        currentAudioSettings.recording.bufferSize,
        1,
        1
      ); // Buffer size from config

      processor.onaudioprocess = (event) => {
        if (!isRecordingRef.current) {
          console.log('🔇 Audio processing stopped (not recording)');
          return;
        }

        if (!onAudioChunkRef.current) {
          console.log('🔇 No audio chunk handler available');
          return;
        }

        // Rate limiting: Use configurable chunk interval
        const now = Date.now();
        if (
          now - lastAudioSentRef.current <
          currentAudioSettings.recording.chunkInterval
        ) {
          return; // Skip this chunk
        }

        const inputBuffer = event.inputBuffer;
        const inputData = inputBuffer.getChannelData(0);
        const sampleRate =
          audioContextRef.current?.sampleRate ||
          currentAudioSettings.recording.sampleRate;

        if (currentAudioSettings.debug.logAudioDetails) {
          console.log(
            '🔍 Processing audio chunk - Sample rate:',
            sampleRate,
            'Buffer size:',
            inputData.length
          );
        }

        // Check if there's actual audio data (not just silence) using configurable threshold
        let hasAudio = false;
        let maxAmplitude = 0;
        for (let i = 0; i < inputData.length; i++) {
          const amplitude = Math.abs(inputData[i]);
          maxAmplitude = Math.max(maxAmplitude, amplitude);
          if (amplitude > currentAudioSettings.recording.silenceThreshold) {
            hasAudio = true;
          }
        }

        // Skip silent chunks to avoid sending unnecessary data
        if (!hasAudio) {
          if (currentAudioSettings.debug.logChunks) {
            console.log(
              '🔇 Skipping silent audio chunk (max amplitude:',
              maxAmplitude.toFixed(4),
              ')'
            );
          }
          return;
        }

        if (currentAudioSettings.debug.logChunks) {
          console.log(
            '🎤 Processing audio chunk with speech (max amplitude:',
            maxAmplitude.toFixed(4),
            ')'
          );
        }

        // Always resample to configured target rate for ElevenLabs compatibility
        const targetSampleRate =
          currentAudioSettings.elevenLabs.inputSampleRate;
        const resampleRatio = targetSampleRate / sampleRate;
        const outputLength = Math.floor(inputData.length * resampleRatio);
        const resampledData = new Float32Array(outputLength);

        if (currentAudioSettings.debug.logAudioDetails) {
          console.log(
            `🔄 Resampling from ${sampleRate}Hz to ${targetSampleRate}Hz (${inputData.length} -> ${outputLength} samples)`
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

        console.log(
          `🎤 Sending audio chunk: ${arrayBuffer.byteLength} bytes (${resampledData.length} samples at ${targetSampleRate}Hz)`
        );

        lastAudioSentRef.current = now;
        onAudioChunkRef.current(arrayBuffer);
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      // Store the processor for cleanup
      mediaRecorderRef.current = processor as unknown as MediaRecorder;

      setIsRecording(true);
      console.log(
        `✅ Started PCM audio recording at ${currentAudioSettings.elevenLabs.inputSampleRate}Hz with ScriptProcessor`
      );
    } catch (error) {
      console.error('❌ Failed to start recording:', error);
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
        console.log('✅ Disconnected audio processor');
      } catch (error) {
        console.warn('Error disconnecting audio processor:', error);
        mediaRecorderRef.current = null;
      }
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      console.log('✅ Stopped media stream');
    }

    setIsRecording(false);
    console.log('✅ Stopped PCM audio recording');
  }, []);

  const playAudio = useCallback(async (audioData: ArrayBuffer) => {
    console.log(
      '🔊 Received audio data for playback, size:',
      audioData.byteLength
    );

    try {
      setIsPlaying(true);

      if (!audioContextRef.current) {
        console.log('🔊 Creating new AudioContext');
        audioContextRef.current = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext)();
      }

      // Resume AudioContext if suspended (common after user interaction requirements)
      if (audioContextRef.current.state === 'suspended') {
        console.log('🔊 Resuming suspended AudioContext');
        await audioContextRef.current.resume();
      }

      // Use configured sample rates and playback settings
      const audioContext = audioContextRef.current;
      const numberOfChannels = 1; // Mono
      const bytesPerSample = 2; // 16-bit = 2 bytes per sample
      const numberOfSamples = audioData.byteLength / bytesPerSample;

      // Use ElevenLabs output sample rate from config
      const sampleRate = currentAudioSettings.elevenLabs.outputSampleRate;

      if (currentAudioSettings.debug.logAudioDetails) {
        console.log(
          `🔊 Audio: ${numberOfSamples} samples → using ${sampleRate}Hz (duration: ${(
            numberOfSamples / sampleRate
          ).toFixed(2)}s)`
        );
      }

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
      if (currentAudioSettings.playback.enableSpeedControl) {
        source.playbackRate.value = currentAudioSettings.playback.playbackSpeed;
      }

      // Create gain node for volume control
      const gainNode = audioContext.createGain();
      gainNode.gain.value = currentAudioSettings.playback.volume;

      // Connect: source -> gain -> destination
      source.connect(gainNode);
      gainNode.connect(audioContext.destination);

      currentAudioRef.current = source;

      source.onended = () => {
        console.log('✅ Audio playback completed');
        setIsPlaying(false);
        currentAudioRef.current = null;
      };

      source.start(0);

      const actualDuration =
        audioBuffer.duration /
        (currentAudioSettings.playback.enableSpeedControl
          ? currentAudioSettings.playback.playbackSpeed
          : 1);
      console.log(
        `✅ Started audio playback: ${actualDuration.toFixed(2)}s (${
          currentAudioSettings.playback.playbackSpeed
        }x speed, ${(currentAudioSettings.playback.volume * 100).toFixed(
          0
        )}% volume)`
      );
    } catch (error) {
      console.error('❌ Failed to play audio:', error);
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
