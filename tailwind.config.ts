import daisyUI from "daisyui";
import UITheme from "./src/utilities/theme";
import typography from "@tailwindcss/typography";
import defaultTheme from "tailwindcss/defaultTheme";
import containerQuery from "@tailwindcss/container-queries";

export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    fontFamily: {
      sans: [
        "ui-sans-serif",
        "system-ui",
        "-apple-system",
        "BlinkMacSystemFont",
        "Segoe UI,Roboto",
        "Helvetica Neue",
        "Arial",
        "Noto Sans",
        "sans-serif",
        "Apple Color Emoji",
        "Segoe UI Emoji",
        "Segoe UI Symbol",
        "Noto Color Emoji",
      ],
      logo: ["Galano Grotesque"],
      mono: ["IBM Plex Mono", ...defaultTheme.fontFamily.mono],
    },
    extend: {
      containers: {
        sm: "24rem",
        md: "28rem",
        lg: "33rem",
        third: "33vw",
        quarter: "25vw",
      },
      minWidth: {
        sm: "24rem",
        md: "28rem",
        lg: "33rem",
        third: "33vw",
        quarter: "25vw",
      },
      maxWidth: {
        sm: "24rem",
        md: "28rem",
        lg: "33rem",
        third: "33vw",
        quarter: "25vw",
      },
    },
  },
  daisyui: {
    themes: [{ base: UITheme }],
  },
  plugins: [typography, containerQuery, daisyUI],
};
