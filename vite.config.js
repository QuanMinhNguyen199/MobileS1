import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // Relative URLs work on GitHub project Pages and when serving dist elsewhere.
  base: "./",
  plugins: [react(), tailwindcss()],
});
