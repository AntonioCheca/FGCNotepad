import {defineConfig, devices} from "@playwright/test";

export default defineConfig({
    testDir: "./tests/mobile",
    outputDir: process.env.PLAYWRIGHT_OUTPUT_DIR ?? "test-results",
    timeout: 30_000,
    expect: {
        timeout: 5_000,
    },
    fullyParallel: true,
    reporter: "list",
    use: {
        baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000",
        trace: "retain-on-failure",
    },
    projects: [
        {name: "320", use: {...devices["Desktop Chrome"], viewport: {width: 320, height: 740}}},
        {name: "360", use: {...devices["Desktop Chrome"], viewport: {width: 360, height: 780}}},
        {name: "390", use: {...devices["Desktop Chrome"], viewport: {width: 390, height: 844}}},
        {name: "430", use: {...devices["Desktop Chrome"], viewport: {width: 430, height: 932}}},
        {name: "768", use: {...devices["Desktop Chrome"], viewport: {width: 768, height: 1024}}},
        {name: "1024", use: {...devices["Desktop Chrome"], viewport: {width: 1024, height: 768}}},
    ],
    webServer: process.env.PLAYWRIGHT_BASE_URL
        ? undefined
        : {
            command: "npm run dev",
            env: {
                ...process.env,
                PLAYWRIGHT_AUTH_BYPASS: "1",
            },
            url: "http://127.0.0.1:3000",
            reuseExistingServer: true,
            timeout: 240_000,
        },
});
