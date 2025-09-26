// AudioWorklet processor for real-time PCM audio conversion
class AudioProcessor extends AudioWorkletProcessor {
  process(inputs, outputs, parameters) {
    const input = inputs[0];

    if (input.length > 0) {
      const inputChannel = input[0];

      if (inputChannel.length > 0) {
        // Convert Float32Array to Int16Array (PCM 16-bit)
        const pcmBuffer = new Int16Array(inputChannel.length);

        for (let i = 0; i < inputChannel.length; i++) {
          // Convert -1.0 to 1.0 range to -32768 to 32767 range
          const sample = Math.max(-1, Math.min(1, inputChannel[i]));
          pcmBuffer[i] = sample * 0x7fff;
        }

        // Send PCM data back to main thread
        this.port.postMessage({
          type: 'audio-chunk',
          data: pcmBuffer.buffer,
        });
      }
    }

    return true; // Keep processor alive
  }
}

registerProcessor('audio-processor', AudioProcessor);
