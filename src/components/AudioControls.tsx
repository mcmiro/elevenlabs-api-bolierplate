import React, { useState } from 'react';
import {
  currentAudioSettings,
  defaultAudioSettings,
  fastSpeechSettings,
  highQualitySettings,
  lowCpuSettings,
  setPlaybackSpeed,
  setVolume,
  slowSpeechSettings,
  updateAudioSettings,
} from '../config/audioConfig';
import './AudioControls.css';

export const AudioControls: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    console.log(`🔧 Playback speed changed to ${speed}x`);
  };

  const handleVolumeChange = (volume: number) => {
    setVolume(volume);
    console.log(`🔧 Volume changed to ${Math.round(volume * 100)}%`);
  };

  const applyPreset = (preset: typeof currentAudioSettings, name: string) => {
    updateAudioSettings(preset);
    console.log(`🔧 Applied ${name} preset`);
  };

  return (
    <div className="audio-controls">
      <button
        className="audio-controls-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        🎚️ Audio Settings {isExpanded ? '▲' : '▼'}
      </button>

      {isExpanded && (
        <div className="audio-controls-panel">
          <div className="control-section">
            <h4>🎯 Quick Presets</h4>
            <div className="preset-buttons">
              <button
                onClick={() =>
                  applyPreset(slowSpeechSettings, 'Slow Speech (60%)')
                }
              >
                🐌 Slow (60%)
              </button>
              <button
                onClick={() =>
                  applyPreset(defaultAudioSettings, 'Normal Speech (80%)')
                }
              >
                ⚡ Normal (80%)
              </button>
              <button
                onClick={() =>
                  applyPreset(fastSpeechSettings, 'Fast Speech (130%)')
                }
              >
                🚀 Fast (130%)
              </button>
            </div>
          </div>

          <div className="control-section">
            <h4>⚡ Speed Control</h4>
            <div className="slider-container">
              <label>
                Playback Speed: {currentAudioSettings.playback.playbackSpeed}x
                <input
                  type="range"
                  min="0.3"
                  max="2.0"
                  step="0.1"
                  value={currentAudioSettings.playback.playbackSpeed}
                  onChange={(e) =>
                    handleSpeedChange(parseFloat(e.target.value))
                  }
                  className="speed-slider"
                />
              </label>
              <div className="slider-labels">
                <span>0.3x (Very Slow)</span>
                <span>1.0x (Normal)</span>
                <span>2.0x (Fast)</span>
              </div>
            </div>
          </div>

          <div className="control-section">
            <h4>🔊 Volume Control</h4>
            <div className="slider-container">
              <label>
                Volume: {Math.round(currentAudioSettings.playback.volume * 100)}
                %
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={currentAudioSettings.playback.volume}
                  onChange={(e) =>
                    handleVolumeChange(parseFloat(e.target.value))
                  }
                  className="volume-slider"
                />
              </label>
            </div>
          </div>

          <div className="control-section">
            <h4>⚙️ Quality Presets</h4>
            <div className="preset-buttons">
              <button
                onClick={() => applyPreset(highQualitySettings, 'High Quality')}
              >
                💎 High Quality
              </button>
              <button onClick={() => applyPreset(lowCpuSettings, 'Low CPU')}>
                🔋 Low CPU
              </button>
            </div>
          </div>

          <div className="control-section">
            <h4>📊 Current Settings</h4>
            <div className="settings-display">
              <div>Speed: {currentAudioSettings.playback.playbackSpeed}x</div>
              <div>
                Volume: {Math.round(currentAudioSettings.playback.volume * 100)}
                %
              </div>
              <div>
                Input Rate: {currentAudioSettings.elevenLabs.inputSampleRate}Hz
              </div>
              <div>
                Output Rate: {currentAudioSettings.elevenLabs.outputSampleRate}
                Hz
              </div>
              <div>Buffer: {currentAudioSettings.recording.bufferSize}</div>
              <div>
                Chunk Interval: {currentAudioSettings.recording.chunkInterval}ms
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioControls;
