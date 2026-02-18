import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import fs from "fs";
import { defineConfig } from "vite";
/**
 * Vite plugin that emits /version.json with a unique build ID
 * and injects window.__APP_VERSION__ into index.html at build time.
 */
function versionPlugin() {
    var buildId = "".concat(Date.now(), "-").concat(Math.random().toString(36).slice(2, 8));
    var pkgVersion = "0.0.0";
    return {
        name: "version-plugin",
        configResolved: function () {
            // Read version from package.json at build time
            try {
                var pkg = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), "package.json"), "utf-8"));
                pkgVersion = pkg.version || "0.0.0";
            }
            catch (_a) {
                // fallback to 0.0.0
            }
        },
        generateBundle: function () {
            // Emit version.json into the build output
            this.emitFile({
                type: "asset",
                fileName: "version.json",
                source: JSON.stringify({
                    version: pkgVersion,
                    buildId: buildId,
                    buildTime: new Date().toISOString(),
                }),
            });
        },
        transformIndexHtml: function () {
            // Inject window.__APP_VERSION__ into index.html
            return [
                {
                    tag: "script",
                    attrs: { type: "text/javascript" },
                    children: "window.__APP_VERSION__=\"".concat(buildId, "\";"),
                    injectTo: "head-prepend",
                },
            ];
        },
    };
}
// https://vite.dev/config/
export default defineConfig({
    plugins: [tailwindcss(), react(), versionPlugin()],
    define: {
        __APP_PKG_VERSION__: JSON.stringify(process.env.npm_package_version || "0.0.0"),
    },
    resolve: {
        alias: {
            "@": path.resolve(path.resolve(), "src"),
        },
    },
    server: {
        headers: {
            // Security headers for development server
            "X-Frame-Options": "DENY",
            "X-Content-Type-Options": "nosniff",
            "X-XSS-Protection": "1; mode=block",
            "Referrer-Policy": "strict-origin-when-cross-origin",
            "Permissions-Policy": "geolocation=(), microphone=(), camera=(), payment=(), usb=()",
        },
    },
    preview: {
        headers: {
            // Security headers for preview server
            "X-Frame-Options": "DENY",
            "X-Content-Type-Options": "nosniff",
            "X-XSS-Protection": "1; mode=block",
            "Referrer-Policy": "strict-origin-when-cross-origin",
            "Permissions-Policy": "geolocation=(), microphone=(), camera=(), payment=(), usb=()",
        },
    },
});
