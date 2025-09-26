# Eleven Labs Chat Interface

A custom React-based chat interface for interacting with Eleven Labs Conversational AI agents. This application provides real-time voice and text chat capabilities with Eleven Labs AI agents.

## Features

- **Real-time Chat**: Text-based conversation with AI agents
- **Voice Integration**: Record audio messages and receive audio responses
- **Agent Selection**: Choose from available AI agents in your Eleven Labs account
- **WebSocket Connection**: Real-time bidirectional communication
- **Audio Playback**: Automatic playback of AI agent voice responses
- **Responsive Design**: Works on desktop and mobile devices

## Prerequisites

1. **Eleven Labs Account**: You need an active Eleven Labs account
2. **API Key**: Get your API key from [Eleven Labs Dashboard](https://elevenlabs.io/app)
3. **AI Agent**: Create at least one Conversational AI agent in your Eleven Labs account

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd eleven-labs
pnpm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Add your Eleven Labs API key to the `.env` file:

```env
VITE_ELEVEN_LABS_API_KEY=your_actual_api_key_here
```

**Note**: The application also supports entering the API key directly in the UI for testing purposes.

### 3. Create an AI Agent

1. Go to [Eleven Labs Dashboard](https://elevenlabs.io/app)
2. Navigate to Conversational AI → Agents
3. Create a new agent with your desired configuration
4. Note the Agent ID for connection

### 4. Run the Application

```bash
pnpm dev
```

The application will be available at `http://localhost:5173`

## Usage

### Initial Setup

1. Enter your Eleven Labs API key in the setup screen
2. Click "Initialize" to load your available agents

### Connecting to an Agent

1. Select an agent from the dropdown menu
2. Click "Connect" to establish a WebSocket connection
3. Wait for the connection status to show "connected"

### Chat Features

#### Text Chat

- Type your message in the text input
- Press Enter to send (Shift+Enter for new line)
- Receive text responses from the AI agent

#### Voice Chat

- Click the microphone button to start recording
- Speak your message
- Click the microphone button again to stop recording
- The audio will be sent to the agent automatically
- Listen to the agent's voice response

#### Audio Controls

- 🎤 Microphone button: Start/stop voice recording
- 🔊 Playing indicator: Shows when audio response is playing
- Recording indicator: Red pulsing animation during recording

## API Integration Details

This application uses the Eleven Labs Conversational AI API with the following key features:

### WebSocket Connection

- Establishes real-time connection with `wss://api.elevenlabs.io/v1/convai/conversation`
- Uses signed URLs for authentication
- Handles ping/pong for connection keepalive

### Message Types

- **Text Messages**: Direct text communication with agents
- **Audio Chunks**: Real-time audio streaming
- **Agent Responses**: Receive both text and audio responses
- **Conversation Events**: Handle interruptions, transcripts, and metadata

### Audio Processing

- Records audio at 16kHz sample rate
- Supports WebM/Opus audio format
- Automatic audio playback using Web Audio API
- Real-time audio streaming to agents

## Project Structure

```
src/
├── components/
│   ├── ChatInterface.tsx        # Main chat UI component
│   └── ChatInterface.css        # Chat interface styles
├── services/
│   └── elevenLabsService.ts     # Eleven Labs API integration
├── hooks/
│   └── useAudioManager.ts       # Audio recording/playback logic
├── App.tsx                      # Root application component
├── main.tsx                     # Application entry point
└── index.css                    # Global styles
```

## Browser Compatibility

- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest versions)
- **Requirements**: WebRTC support for audio recording
- **Permissions**: Microphone access required for voice features

## Troubleshooting

### Connection Issues

- Verify your API key is correct and active
- Check that you have created AI agents in your account
- Ensure stable internet connection for WebSocket

### Audio Issues

- Grant microphone permissions in your browser
- Test microphone access in browser settings
- Check audio device configuration

### Agent Not Available

- Verify agents exist in your Eleven Labs dashboard
- Ensure agents are properly configured and active
- Check agent permissions and settings

## Development

### Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm lint` - Run ESLint

### Dependencies

- **React 19**: UI framework
- **@elevenlabs/elevenlabs-js**: Official Eleven Labs SDK
- **WebSocket**: Real-time communication
- **Web Audio API**: Audio processing

## Security Notes

- API keys are stored securely and not exposed in client code
- WebSocket connections use signed URLs for authentication
- Audio data is processed client-side before transmission

## License

This project is for demonstration purposes. Please review Eleven Labs terms of service for commercial usage.

## Support

For issues related to:

- **Eleven Labs API**: Check [Eleven Labs Documentation](https://elevenlabs.io/docs)
- **This Application**: Create an issue in this repository
