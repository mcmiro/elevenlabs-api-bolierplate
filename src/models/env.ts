/**
 * Environment variable types
 */

export interface ImportMetaEnv {
  readonly VITE_ELEVEN_LABS_API_BASE_URL: string;
  readonly VITE_BACKEND_URL: string;
}

export interface ImportMeta {
  readonly env: ImportMetaEnv;
}
