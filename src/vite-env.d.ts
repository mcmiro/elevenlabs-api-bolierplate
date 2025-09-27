/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ELEVEN_LABS_API_KEY: string;
  readonly VITE_ELEVEN_LABS_API_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
