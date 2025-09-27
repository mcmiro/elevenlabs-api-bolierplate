/**
 * Environment variable types
 */

export interface ImportMetaEnv {
  readonly VITE_ELEVEN_LABS_API_KEY: string;
  readonly VITE_ELEVEN_LABS_API_BASE_URL: string;
}

export interface ImportMeta {
  readonly env: ImportMetaEnv;
}
