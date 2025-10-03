/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ELEVEN_LABS_API_BASE_URL: string;
  readonly VITE_BACKEND_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
