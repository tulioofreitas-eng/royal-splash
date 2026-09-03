import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: false,
  workers: 1,
  reporter: "list",

  use: {
    baseURL: process.env.SC_R16_BASE_URL ?? "http://127.0.0.1:4321",
    browserName: "chromium",
    headless: true,
  },

  webServer: process.env.SC_R16_BASE_URL ? undefined : {
    command:
      "VERCEL_ENV=preview pnpm exec astro dev --host 127.0.0.1 --port 4321",
    url: "http://127.0.0.1:4321/sobre",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
