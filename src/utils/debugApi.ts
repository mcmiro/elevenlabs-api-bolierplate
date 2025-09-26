// Debug utility to test API key manually
export const testApiKeyManually = async (apiKey: string) => {
  // Test 1: Try to get agents with raw fetch
  try {
    const response = await fetch('https://api.elevenlabs.io/v1/convai/agents', {
      method: 'GET',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    console.log('Raw agents request status:', response.status);
    console.log('Raw agents request headers sent:', {
      'xi-api-key': apiKey.substring(0, 8) + '...',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Raw agents request failed:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('Raw agents response:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Raw API test failed:', error);
    return { success: false, error };
  }
};

// Test 2: Try to get signed URL with raw fetch
export const testSignedUrlManually = async (
  apiKey: string,
  agentId: string
) => {
  console.log('Testing signed URL manually...');

  try {
    const url = `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${agentId}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    console.log('Raw signed URL request status:', response.status);
    console.log('Raw signed URL request headers sent:', {
      'xi-api-key': apiKey.substring(0, 8) + '...',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Raw signed URL request failed:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('Raw signed URL response:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Raw signed URL test failed:', error);
    return { success: false, error };
  }
};
