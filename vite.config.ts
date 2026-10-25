// The Lovable config owns React, TanStack Start, Tailwind, Nitro and env injection.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { loadEnv, type ConfigEnv } from "vite";

export default async function projectConfig(env: ConfigEnv) {
  const staff = env.mode === "staff" || env.mode === "staff-mock";
  const localEnv = loadEnv(env.mode, process.cwd(), "");
  const portKey = staff ? "STAFF_FRONTEND_PORT" : "PUBLIC_FRONTEND_PORT";
  const port = Number(process.env[portKey] || localEnv[portKey] || (staff ? 5138 : 5137));
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error(`${portKey} must be an integer between 1 and 65535.`);
  const config = await defineConfig({
    vite: {
      preview: { port, strictPort: true },
      server: {
        port,
        strictPort: true,
        proxy: {
          "/api": {
            target:
              process.env.API_PROXY_TARGET || localEnv.API_PROXY_TARGET || "http://localhost:8080",
            changeOrigin: true,
            // Server-owned routing context; a production gateway must overwrite this too.
            // Backend authorization must still verify the signed token and STAFF role.
            headers: { "X-Guardian-Portal": staff ? "staff" : "public" },
          },
        },
      },
    },
    nitro: staff
      ? {
          output: {
            dir: ".output-staff",
            publicDir: ".output-staff/public",
            serverDir: ".output-staff/server",
          },
        }
      : undefined,
    tanstackStart: { server: { entry: "server" } },
  })(env);
  // Separate optimizer caches keep both Vite processes from replacing each other's React files.
  config.cacheDir = `node_modules/.vite/guardianwork-${env.command}-${env.mode}`;
  return config;
}
