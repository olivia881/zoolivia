import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/** Su GitHub Pages il sito è servito da /nome-repo/ */
const pagesBase =
  process.env.VITE_GITHUB_PAGES === "1" ? "/zoolivia/" : "./";

export default defineConfig({
  base: pagesBase,
  plugins: [react()],
});
