// Simple microphone test utility
export const testMicrophone = async () => {
  console.log('🎤 Testing microphone access...');

  try {
    // Request microphone access
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: 16000,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    console.log('✅ Microphone access granted');
    console.log(
      '📊 Stream tracks:',
      stream.getTracks().map((t) => ({
        kind: t.kind,
        enabled: t.enabled,
        readyState: t.readyState,
        settings: t.getSettings?.(),
      }))
    );

    // Create audio context and test processing
    const audioContext = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext)();

    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;

    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    // Test for 5 seconds
    const testDuration = 5000;
    const startTime = Date.now();
    let audioDetected = false;

    const checkAudio = () => {
      analyser.getByteFrequencyData(dataArray);

      // Check if there's significant audio activity
      const average =
        dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;

      if (average > 10) {
        // Threshold for detecting audio
        console.log('🔊 Audio detected! Average level:', average);
        audioDetected = true;
      }

      if (Date.now() - startTime < testDuration) {
        requestAnimationFrame(checkAudio);
      } else {
        // Test complete
        stream.getTracks().forEach((track) => track.stop());
        audioContext.close();

        if (audioDetected) {
          console.log('✅ Microphone test PASSED - Audio was detected');
        } else {
          console.log('❌ Microphone test FAILED - No audio detected');
          console.log(
            '💡 Try speaking into the microphone or checking volume levels'
          );
        }
      }
    };

    console.log('🎤 Starting 5-second audio detection test...');
    console.log('💬 Please speak into the microphone now!');
    checkAudio();
  } catch (error) {
    console.error('❌ Microphone test failed:', error);

    if (error instanceof Error && error.name === 'NotAllowedError') {
      console.log(
        '🚫 Microphone permission denied. Please allow microphone access.'
      );
    } else if (error instanceof Error && error.name === 'NotFoundError') {
      console.log('🔍 No microphone found. Please check your audio devices.');
    }
  }
};
