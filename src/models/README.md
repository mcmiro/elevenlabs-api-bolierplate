# Models

This folder contains all TypeScript type definitions used throughout the application.

## Structure

- **`index.ts`** - Central export file for all models
- **`agent.ts`** - Agent-related types and interfaces
- **`chat.ts`** - Chat and message-related types
- **`audio.ts`** - Audio management related types
- **`service.ts`** - Service-related callback types
- **`websocket.ts`** - WebSocket event types and message interfaces
- **`env.ts`** - Environment variable types

## Usage

Import types from the central index file:

```typescript
import type { Agent, Message, ConnectionState } from '../models';
```

Or import from specific files:

```typescript
import type { Agent } from '../models/agent';
import type { Message } from '../models/chat';
```

## Types Overview

### Agent Types (`agent.ts`)

- `RawAgentData` - Raw agent data from API
- `Agent` - Normalized agent interface
- `AgentsResponse` - API response for agents list

### Chat Types (`chat.ts`)

- `Message` - Chat message interface
- `ConnectionState` - WebSocket connection states
- `ConversationMode` - Type of conversation (text/audio)

### Audio Types (`audio.ts`)

- `AudioManager` - Audio management interface

### Service Types (`service.ts`)

- `ServiceCallbacks` - Callback functions for service events

### WebSocket Types (`websocket.ts`)

- `ConversationInitiationEvent` - Conversation initialization event
- `AgentResponseEvent` - Agent response message event
- `LLMResponseEvent` - LLM response event
- `AudioEvent` - Audio data event
- `PingEvent` - WebSocket ping event
- `UserTranscriptEvent` - User speech transcript event
- `AgentResponseCorrectionEvent` - Agent response correction event
- `WebSocketMessage` - Main WebSocket message interface

### Environment Types (`env.ts`)

- `ImportMetaEnv` - Environment variables interface
- `ImportMeta` - Vite meta interface extension
