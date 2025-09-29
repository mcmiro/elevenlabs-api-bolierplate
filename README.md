# Eleven Labs Chat Interface

A React JavaScrip## Project Structure

## Project Structure

````
src/
├── components/
│   ├── ChatInterface.jsx    # Main chat UI component
│   ├── ChatInterface.css    # Styling
│   └── siriAnimation.jsx    # Animated Siri-like component
├── services/
│   └── elevenLabsService.js # API integration service
├── hooks/
│   ├── useAudioManager.js   # Audio recording/playbook
│   └── useElevenLabsChat.js # Main chat hook
└── assets/                  # Images and icons
```mponents/
│   ├── ChatInterface.jsx    # Main chat UI component
│   ├── ChatInterface.css    # Styling
│   └── siriAnimation.jsx    # Animated Siri-like component
├── services/
│   └── elevenLabsService.js # API integration service
├── hooks/
│   ├── useAudioManager.js   # Audio recording/playback
│   └── useElevenLabsChat.js # Main chat hook
├── models/
│   ├── agent.js             # Agent-related utilities
│   ├── audio.js             # Audio management utilities
│   ├── chat.js              # Chat and message utilities
│   ├── service.js           # Service callback utilities
│   ├── websocket.js         # WebSocket event processing
│   └── index.js             # Central exports
└── assets/                  # Images and icons
``` interacting with Eleven Labs Conversational AI agents using a custom chat interface.

## Features

- 🤖 Connect to Eleven Labs conversational AI agents
- 🎤 Voice recording and audio playback
- 💬 Real-time chat interface
- 🔧 WebSocket-based communication
- 🎨 Clean, responsive UI

## Setup

1. **Install dependencies:**

   ```bash
   pnpm install
````

2. **Configure environment variables:**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your Eleven Labs API key:

   ```bash
   VITE_ELEVEN_LABS_API_KEY=sk_your_api_key_here
   ```

   Get your API key from [Eleven Labs Settings](https://elevenlabs.io/app/settings/api-keys)

3. **Start the development server:**
   ```bash
   pnpm dev
   ```

## Usage

1. The app will automatically load your API key from the `.env` file
2. Select an available agent from the dropdown
3. Click "Connect" to establish a WebSocket connection
4. Use the microphone button for voice input or type messages
5. The agent will respond with both text and audio

## Project Structure

```
src/
├── components/
│   ├── ChatInterface.tsx    # Main chat UI component
│   └── ChatInterface.css    # Styling
├── services/
│   └── elevenLabsService.ts # API integration service
├── hooks/
│   └── useAudioManager.ts   # Audio recording/playback
├── utils/
│   ├── debugApi.ts         # Debug utilities
│   └── testUtils.ts        # Testing utilities
└── config/
    └── chatConfig.ts       # Configuration interfaces
```

## React + JavaScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable additional lint rules:

```js
export default [
  { ignores: ['dist', 'public'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    settings: {
      react: { version: '18.3' },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
    },
  },
];
```
