/// <reference types="vite/client" />

/** Package version from package.json, injected at build time via Vite define */
declare const __APP_PKG_VERSION__: string;

/** Unique build ID injected into index.html by versionPlugin */
interface Window {
    __APP_VERSION__?: string;
}
