import { defineConfig } from "@playwright/test";

const externalBaseUrl = process.env.UI_BASE_URL;
export default defineConfig({
  testDir: "./tests/ui",
  timeout: 30000,
  expect: { timeout: 7000 },
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: externalBaseUrl || "http://localhost:5137",
    browserName: "chromium",
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {},
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 1000 } } },
    {
      name: "mobile",
      use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
    },
  ],
  webServer: externalBaseUrl
    ? undefined
    : [
        {
          command: "npm run dev:mock",
          url: "http://localhost:5137/login",
          reuseExistingServer: true,
          timeout: 90000,
        },
        {
          command: "npm run dev:staff:mock",
          url: "http://localhost:5138/login",
          reuseExistingServer: true,
          timeout: 90000,
        },
      ],
});
