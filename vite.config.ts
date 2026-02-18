import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import fs, { existsSync, readFileSync } from "fs";
import { defineConfig, Plugin } from "vite";

const pkg = JSON.parse(
    fs.readFileSync(path.resolve(process.cwd(), "package.json"), "utf-8"),
);

/**
 * Vite plugin that emits /version.json with a unique build ID,
 * package version, release timestamp, and release notes.
 * Injects window.__APP_VERSION__ and window.__APP_PKG_VERSION_EMBEDDED__ into index.html.
 */
function appVersionPlugin(): Plugin {
    const buildId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const releasedAt = new Date().toISOString();
    const releaseNotesPath = path.resolve(path.resolve(), "scripts", "release-notes.txt");
    const releaseNotes = existsSync(releaseNotesPath)
        ? readFileSync(releaseNotesPath, "utf-8").trim()
        : `What's new in v${pkg.version}`;

    return {
        name: "app-version",
        apply: "build",
        generateBundle() {
            this.emitFile({
                type: "asset",
                fileName: "version.json",
                source: JSON.stringify({
                    version: buildId,
                    packageVersion: pkg.version,
                    releasedAt,
                    releaseNotes,
                }),
            });
        },
        transformIndexHtml() {
            return [
                {
                    tag: "script",
                    children: `window.__APP_VERSION__ = "${buildId}"; window.__APP_PKG_VERSION_EMBEDDED__ = "${pkg.version}";`,
                    injectTo: "head",
                },
            ];
        },
    };
}

// https://vite.dev/config/
export default defineConfig({
    plugins: [tailwindcss(), react(), appVersionPlugin()],
    define: {
        __APP_PKG_VERSION__: JSON.stringify(
            process.env.npm_package_version || "0.0.0",
        ),
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
            "Permissions-Policy":
                "geolocation=(), microphone=(), camera=(), payment=(), usb=()",
        },
    },
    preview: {
        headers: {
            // Security headers for preview server
            "X-Frame-Options": "DENY",
            "X-Content-Type-Options": "nosniff",
            "X-XSS-Protection": "1; mode=block",
            "Referrer-Policy": "strict-origin-when-cross-origin",
            "Permissions-Policy":
                "geolocation=(), microphone=(), camera=(), payment=(), usb=()",
        },
    },
});
