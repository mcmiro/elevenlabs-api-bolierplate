import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// ES modules compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'production'
        ? ['https://your-heroku-app.herokuapp.com'] // Replace with your actual Heroku app URL
        : ['http://localhost:5173', 'http://localhost:3000'],
  })
);
app.use(express.json());

// Serve static files from the React app build directory (for production)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
}

// Initialize Eleven Labs client
const getElevenLabsClient = () => {
  const apiKey = process.env.ELEVEN_LABS_API_KEY;
  if (!apiKey) {
    throw new Error('ELEVEN_LABS_API_KEY environment variable is required');
  }
  return new ElevenLabsClient({ apiKey });
};

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get agents endpoint
app.get('/api/agents', async (req, res) => {
  try {
    const client = getElevenLabsClient();
    const apiBaseUrl =
      process.env.ELEVEN_LABS_API_BASE_URL || 'https://api.elevenlabs.io/v1/';

    const response = await fetch(`${apiBaseUrl}convai/agents`, {
      method: 'GET',
      headers: {
        'xi-api-key': process.env.ELEVEN_LABS_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        error: `Failed to fetch agents: ${errorText}`,
      });
    }

    const data = await response.json();

    // Normalize the response format
    let agents;
    if (Array.isArray(data)) {
      agents = data.map((agent) => ({
        agentId: agent.agent_id || agent.agentId || agent.id || 'unknown',
        name: agent.name || 'Unnamed Agent',
        ...agent,
      }));
    } else if (data.agents && Array.isArray(data.agents)) {
      agents = data.agents.map((agent) => ({
        agentId: agent.agent_id || agent.agentId || agent.id || 'unknown',
        name: agent.name || 'Unnamed Agent',
        ...agent,
      }));
    } else {
      return res.status(500).json({ error: 'Unexpected response format' });
    }

    res.json(agents);
  } catch (error) {
    console.error('Error fetching agents:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get signed URL for WebSocket connection
app.post('/api/agents/:agentId/connect', async (req, res) => {
  try {
    const { agentId } = req.params;
    const client = getElevenLabsClient();

    const response = await client.conversationalAi.conversations.getSignedUrl({
      agentId,
    });

    res.json({ signedUrl: response.signedUrl });
  } catch (error) {
    console.error('Error getting signed URL:', error);
    res.status(500).json({ error: 'Failed to get connection URL' });
  }
});

// Catch-all handler: send back React's index.html file for any non-API routes
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
