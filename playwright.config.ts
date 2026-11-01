import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  retries: 0,
  use: { baseURL: process.env.BASE_URL || "http://127.0.0.1:3000", browserName: "chromium", screenshot: "only-on-failure" },
  reporter: "list",
  webServer: process.env.CI ? {
    command: "npm start -- --port 3000",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: false,
    timeout: 60000,
  } : undefined,
});
