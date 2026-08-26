import {AxeBuilder} from "@axe-core/playwright";
import {expect, test} from "@playwright/test";

const routes = [
    "/auth/login",
    "/auth/register",
    "/combos",
    "/combos/new",
    "/replay-lab",
    "/replay-lab/upload",
    "/replay-lab/practice-tasks",
    "/replay-lab/study-deck",
    "/scenarios",
];

test.describe("responsive smoke", () => {
    for (const route of routes) {
        test(`${route} does not overflow horizontally`, async ({page}) => {
            await page.goto(route);
            await page.waitForLoadState("networkidle").catch(() => undefined);

            const overflow = await page.evaluate(() => ({
                scrollWidth: document.documentElement.scrollWidth,
                clientWidth: document.documentElement.clientWidth,
            }));

            expect(overflow.scrollWidth, `${route} horizontal overflow`).toBeLessThanOrEqual(overflow.clientWidth + 1);
        });
    }

    test("mobile navigation starts closed and can be opened", async ({page}, testInfo) => {
        test.skip(Number(testInfo.project.name) >= 768, "Persistent navigation is expected at tablet and desktop widths.");

        await page.setExtraHTTPHeaders({"x-playwright-auth-bypass": "1"});
        await page.route("**/me", async (route) => {
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    user: {id: 1, username: "mobile-smoke", roles: ["ROLE_USER"]},
                    csrfToken: "mobile-smoke-csrf",
                }),
            });
        });

        await page.goto("/about/aboutUs");

        await expect(page.getByRole("navigation", {name: "Primary navigation"})).not.toBeInViewport();
        await page.getByRole("button", {name: "Open navigation"}).click();
        await expect(page.getByRole("navigation", {name: "Primary navigation"})).toBeInViewport();
        await page.getByRole("button", {name: "Close navigation"}).click();
        await expect(page.getByRole("navigation", {name: "Primary navigation"})).not.toBeInViewport();
    });

    test("login page has no serious accessibility violations", async ({page}) => {
        await page.goto("/auth/login");

        const results = await new AxeBuilder({page})
            .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
            .analyze();

        const seriousViolations = results.violations.filter((violation) => ["serious", "critical"].includes(violation.impact ?? ""));
        expect(seriousViolations).toEqual([]);
    });
});
