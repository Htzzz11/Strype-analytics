// This description file is only for TS to understand our Vite env variables (in dev).
// So the descriptions MUST MATCH THE VARIABLE NAMES USED IN VITE.CONFIG.JS;
declare const __BUILD_DATE_TICKS__: number;
declare const __BUILD_GIT_HASH__ : string;

interface ImportMetaEnv {
    readonly VITE_ANALYTICS_INGEST_URL?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

