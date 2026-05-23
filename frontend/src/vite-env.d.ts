/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly NEXT_PUBLIC_API_URL?: string;
  readonly NEXT_PUBLIC_USE_MOCK_DATA?: string;
  readonly VITE_API_URL?: string;
  readonly VITE_USE_MOCK_DATA?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
