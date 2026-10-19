// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import type { ConfigEnv } from "vite";

const createProjectConfig = defineConfig({
  vite: {
    preview: { port: 5137, strictPort: true },
    server: {
      port: 5137,
      strictPort: true,
      proxy: {
        "/api": {
          target: process.env.VITE_API_PROXY_TARGET || "http://localhost:8080",
          changeOrigin: true,
        },
      },
    },
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});

export default async function projectConfig(env: ConfigEnv) {
  const config = await createProjectConfig(env);
  // Dev, mock, and build must not replace another running server's optimized React files.
  config.cacheDir = `node_modules/.vite/guardianwork-${env.command}-${env.mode}`;
  return config;
}
