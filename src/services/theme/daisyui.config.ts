import theme from "daisyui/src/theming/themes";

const getDaisyUIConfig = () => {
  return {
    themes: [
      {
        light: {
          ...theme.light,
          primary: "#167BFF",
          "primary-content": "#FDFEFF",
          secondary: "#9C5DE8",
          // neutral: "#e1e6ec",
          // "neutral-content": "#1e2328",

          info: "#14B4FF",
          "info-content": "#FDFEFF",
          success: "#17C964",
          "success-content": "#FDFEFF",
          warning: "#F5A524",
          error: "#F31260",
          "error-content": "#FDFEFF",

          "base-100": "#FDFEFF",
          "base-200": "#f5f7ff",
          "base-300": "#e1e6fc",
          "base-content": "#1e2328",

          "--rounded-box": "1.25rem",
          "--rounded-btn": "1.25rem",
          "--padding-card": "20px",
          "--content-background": "#f2f5f8",
          "--leftmenu-background": "#FDFEFF",
        },
        dark: {
          ...theme.dark,
          primary: "#167BFF",
          "primary-content": "#FDFEFF",
          secondary: "#9C5DE8",
          // neutral: "#282d32",
          info: "#14B4FF",
          success: "#17C964",
          "success-content": "#FDFEFF",
          warning: "#F5A524",
          error: "#F31260",
          "error-content": "#FDFEFF",

          "base-100": "#191e23",
          "base-200": "#252b32",
          "base-300": "#424b57",

          "base-content": "#dcebfa",
          "--rounded-box": "1.25rem",
          "--rounded-btn": "1.25rem",

          "--content-background": "#14181c",
          "--leftmenu-background": "#1e2328",
        },
      },
    ],
  };
};

export default getDaisyUIConfig;
