# Eleven Labs Chat Interface

A React TypeScript application for interacting with Eleven Labs Conversational AI agents using a custom chat interface.

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
   ```

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

## React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x';
import reactDom from 'eslint-plugin-react-dom';

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```
