import daisyuiPlugin from "daisyui";
import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

import getDaisyUIConfig from "./src/services/theme/daisyui.config";

const myPlugin = plugin(function ({ addVariant, e }) {
    addVariant("svg-path", [
        // @ts-ignore
        ({ modifySelectors, separator }: any) => {
            modifySelectors(({ className }: any) => {
                return `svg.${e(`svg-path${separator}${className}`)} *`;
            });
        },
    ]);
});

const config: Config = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
        "index.html",
        "node_modules/daisyui/dist/**/*.js",
        "node_modules/react-daisyui/dist/**/*.js",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                "content-background": "var(--content-background)",
                "leftmenu-background": "var(--leftmenu-background)",
            },
            fontSize: {
                xs: "11px",
                sm: "13px",
                base: "15px",
            },
        },
        container: {
            center: true,
            padding: {
                DEFAULT: "1rem",
                sm: "2rem",
                md: "3rem",
                lg: "4rem",
                xl: "5rem",
                "2xl": "6rem",
            },
        },
        fontFamily: {
            body: ["DM Sans", "sans-serif"],
        },
    },

    daisyui: getDaisyUIConfig(),
    plugins: [daisyuiPlugin, myPlugin],
};
export default config;
