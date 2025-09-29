/**
 * Service-related callback utilities
 */

// Default callback implementations
export const createServiceCallbacks = (callbacks = {}) => ({
  onMessage: callbacks.onMessage || (() => {}),
  onAudio: callbacks.onAudio || (() => {}),
  onError: callbacks.onError || (() => {}),
  onConnectionStateChange: callbacks.onConnectionStateChange || (() => {}),
  onUserTranscript: callbacks.onUserTranscript || (() => {}),
});

// Validation helpers
export const isValidCallback = (callback) => {
  return typeof callback === 'function';
};

export const validateServiceCallbacks = (callbacks) => {
  const validCallbacks = {};

  if (callbacks.onMessage && isValidCallback(callbacks.onMessage)) {
    validCallbacks.onMessage = callbacks.onMessage;
  }

  if (callbacks.onAudio && isValidCallback(callbacks.onAudio)) {
    validCallbacks.onAudio = callbacks.onAudio;
  }

  if (callbacks.onError && isValidCallback(callbacks.onError)) {
    validCallbacks.onError = callbacks.onError;
  }

  if (
    callbacks.onConnectionStateChange &&
    isValidCallback(callbacks.onConnectionStateChange)
  ) {
    validCallbacks.onConnectionStateChange = callbacks.onConnectionStateChange;
  }

  if (
    callbacks.onUserTranscript &&
    isValidCallback(callbacks.onUserTranscript)
  ) {
    validCallbacks.onUserTranscript = callbacks.onUserTranscript;
  }

  return validCallbacks;
};
