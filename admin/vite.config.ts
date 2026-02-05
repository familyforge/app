import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  root: "admin",
  resolve: {
    alias: {
      "@admin": path.resolve(__dirname, "src"),
      "@shared": path.resolve(__dirname, "../shared"),
      "@assets": path.resolve(__dirname, "../assets"),
    },
  },
  build: {
    outDir: "../dist/admin",
    emptyOutDir: true,
  },
  server: {
    port: 3001,
    fs: {
      allow: [path.resolve(__dirname, "..")],
    },
  },
});
