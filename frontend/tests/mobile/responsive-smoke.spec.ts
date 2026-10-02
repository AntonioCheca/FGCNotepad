import {AxeBuilder} from "@axe-core/playwright";
import {expect, test} from "@playwright/test";

const routes = [
    "/",
    "/auth/login",
    "/auth/register",
    "/combos",
    "/combos/new",
    "/replay-lab",
    "/replay-lab/upload",
    "/replay-lab/practice-tasks",
    "/replay-lab/study-deck",
    "/scenarios",
    "/neutral-stats",
    "/profile",
    "/profile/recommend-combo",
    "/admin/users",
    "/admin/replay-combo-imports",
    "/admin/situations",
    "/moderation/queue",
    "/moderation/frame-data",
    "/blockstrings/offense",
    "/blockstrings/defense",
    "/blockstrings/new",
    "/okis",
    "/okis/new",
    "/okis/reversals",
    "/about/aboutUs",
];

test.describe("responsive smoke", () => {
    test.beforeEach(async ({page}) => {
        await page.setExtraHTTPHeaders({"x-playwright-auth-bypass": "1"});
        await page.route("**/me", async (route) => {
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    user: {id: 1, username: "mobile-smoke", roles: ["ROLE_ADMIN", "ROLE_MODERATOR", "ROLE_USER"]},
                    csrfToken: "mobile-smoke-csrf",
                }),
            });
        });
    });

    for (const route of routes) {
        test(`${route} does not overflow horizontally`, async ({page}) => {
            await page.goto(route, {waitUntil: "domcontentloaded"});
            await page.waitForLoadState("networkidle").catch(() => undefined);

            expect(new URL(page.url()).pathname, `${route} should render directly`).toBe(route);

            const overflow = await page.evaluate(() => ({
                scrollWidth: document.documentElement.scrollWidth,
                clientWidth: document.documentElement.clientWidth,
            }));

            expect(overflow.scrollWidth, `${route} horizontal overflow`).toBeLessThanOrEqual(overflow.clientWidth + 1);
        });
    }

    test("phones use the bottom navigation and its More sheet", async ({page}, testInfo) => {
        test.skip(Number(testInfo.project.name) >= 900, "Desktop widths use the sidebar.");

        await page.goto("/about/aboutUs");

        const navigation = page.getByRole("navigation", {name: "Primary navigation"});
        await expect(navigation).toBeInViewport();
        await expect(navigation.getByRole("link", {name: "Combos"})).toBeVisible();

        await navigation.getByRole("button", {name: "More"}).click();
        const sheet = page.getByRole("dialog");
        await expect(sheet.getByRole("link", {name: "About Us"})).toBeVisible();
        await expect(sheet.getByRole("link", {name: "Search Combos"})).toHaveCount(0);

        await page.keyboard.press("Escape");
        await expect(sheet).toBeHidden();
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
