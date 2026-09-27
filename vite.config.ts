import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react/jsx-runtime", "react-dom", "react-dom/client"],
  },
  build: {
    sourcemap: false,
    target: "esnext",
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
manualChunks: {
        "react-vendor": ["react", "react-dom", "react-router"],
      },
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
  },
  optimizeDeps: {
    entries: ["index.html"],
    include: ["react", "react/jsx-runtime", "react-dom", "react-dom/client", "react-router"],
    exclude: ["motion-dom", "motion-utils"],
  },
  server: {
    port: 5173,
    hmr: { overlay: false },
  },
});
