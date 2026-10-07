// Mobile layout audit: measures every route at phone widths and writes JSON + Markdown scorecards.
// Usage and thresholds: docs/mobile-audit.md
import {mkdir, writeFile} from "node:fs/promises";
import {join} from "node:path";
import {chromium} from "playwright";
import {AxeBuilder} from "@axe-core/playwright";
import {createApiSession, requireEnv} from "./session.mjs";
import {collectPageMetrics} from "./metrics.mjs";
import {scorePage} from "./scoring.mjs";
import {renderMarkdownReport} from "./report.mjs";

const APP_URL = requireEnv("AUDIT_APP_URL");
const API_URL = requireEnv("AUDIT_API_URL");
const OUTPUT_DIR = process.env.AUDIT_OUTPUT_DIR ?? "mobile-audit-results";
const SCREENSHOTS = process.env.AUDIT_SCREENSHOTS === "1";
const ONLY = process.env.AUDIT_ONLY ? new RegExp(process.env.AUDIT_ONLY) : null;

export const VIEWPORTS = [
    {name: "360", width: 360, height: 780},
    {name: "390", width: 390, height: 844},
];

const api = await createApiSession(API_URL, requireEnv("AUDIT_LOGIN_URL"));
const routes = await resolveRoutes(api);

const browser = await chromium.launch();
const results = [];

for (const viewport of VIEWPORTS) {
    const context = await browser.newContext({
        viewport: {width: viewport.width, height: viewport.height},
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
    });
    await context.addCookies(api.cookies().map((cookie) => ({...cookie, url: APP_URL})));
    await context.addCookies(api.cookies().map((cookie) => ({...cookie, url: API_URL})));

    for (const route of routes) {
        if (ONLY && !ONLY.test(route.path)) {
            continue;
        }
        const page = await context.newPage();
        const result = await auditRoute(page, route, viewport);
        results.push(result);
        console.log(`${viewport.name} ${route.path} -> ${result.error ?? `score ${result.score.value}${result.score.hardPass ? " (pass)" : ""}`}`);
        await page.close();
    }
    await context.close();
}

await browser.close();

await mkdir(OUTPUT_DIR, {recursive: true});
const stamp = new Date().toISOString().slice(0, 10);
await writeFile(join(OUTPUT_DIR, `mobile-audit-${stamp}.json`), JSON.stringify({generatedAt: new Date().toISOString(), viewports: VIEWPORTS, results}, null, 2));
await writeFile(join(OUTPUT_DIR, `mobile-audit-${stamp}.md`), renderMarkdownReport(results, VIEWPORTS));
console.log(`Wrote ${OUTPUT_DIR}/mobile-audit-${stamp}.{json,md}`);

async function auditRoute(page, route, viewport) {
    const base = {route: route.path, label: route.label, area: route.area, desktopOnly: route.desktopOnly, viewport: viewport.name};
    try {
        await page.goto(`${APP_URL}${route.path}`, {waitUntil: "domcontentloaded", timeout: 90_000});
        await page.waitForLoadState("networkidle", {timeout: 20_000}).catch(() => undefined);
        await page.waitForTimeout(600);

        const finalPath = new URL(page.url()).pathname;
        if (finalPath !== new URL(route.path, APP_URL).pathname) {
            return {...base, error: `redirected to ${finalPath}`};
        }

        const metrics = await page.evaluate(collectPageMetrics);
        const axe = await new AxeBuilder({page})
            .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
            .analyze();
        metrics.axe = axe.violations.map((violation) => ({id: violation.id, impact: violation.impact, nodes: violation.nodes.length}));

        if (SCREENSHOTS) {
            const file = `${viewport.name}${route.path.replaceAll("/", "_") || "_home"}.png`;
            await mkdir(join(OUTPUT_DIR, "screenshots"), {recursive: true});
            await page.screenshot({path: join(OUTPUT_DIR, "screenshots", file), fullPage: true});
        }

        return {...base, metrics, score: scorePage(metrics)};
    } catch (error) {
        return {...base, error: String(error).split("\n")[0]};
    }
}

async function resolveRoutes(session) {
    const ids = await resolveDynamicIds(session);
    const route = (path, label, area, desktopOnly = false) => ({path, label, area, desktopOnly});
    const list = [
        route("/", "Home", "Core"),
        route("/combos", "Search Combos", "Combos"),
        route("/combos/new", "Create Combo", "Combos"),
        ids.combo && route(`/combos/${ids.combo}`, "Combo Detail", "Combos"),
        route("/okis", "Search Okis", "Okis"),
        route("/okis/new", "Create Oki", "Okis"),
        ids.oki && route(`/okis/${ids.oki}`, "Oki Detail", "Okis"),
        ids.oki && route(`/okis/${ids.oki}/edit`, "Edit Oki", "Okis"),
        route("/blockstrings", "Blockstrings", "Blockstrings"),
        route("/blockstrings/new", "Create Blockstring", "Blockstrings"),
        ids.blockstring && route(`/blockstrings/${ids.blockstring}`, "Blockstring Detail", "Blockstrings"),
        route("/scenarios", "Search Scenarios", "Scenarios"),
        route("/scenarios/new", "Create Scenario", "Scenarios"),
        ids.scenario && route(`/scenarios/${ids.scenario}`, "Scenario Detail", "Scenarios"),
        ids.scenario && route(`/scenarios/${ids.scenario}/edit`, "Edit Scenario", "Scenarios"),
        route("/neutral-stats", "Neutral Stats (empty)", "Stats"),
        ids.character && route(`/neutral-stats?character=${ids.character}`, "Neutral Stats", "Stats"),
        route("/guides", "Beginners Guides", "Guides"),
        route("/guides/turns", "Turns Guide", "Guides"),
        route("/replay-lab", "Replay Lab", "Replay Lab"),
        route("/replay-lab/upload", "Replay Upload", "Replay Lab"),
        route("/replay-lab/local", "Replay Local", "Replay Lab"),
        route("/replay-lab/practice-tasks", "Practice Tasks", "Replay Lab"),
        route("/replay-lab/study-deck", "Study Deck", "Replay Lab"),
        route("/profile", "Profile", "Account"),
        route("/about/aboutUs", "About", "Account"),
        route("/moderation/queue", "Moderation Queue", "Moderation"),
        route("/moderation/frame-data", "Frame Data", "Moderation"),
        route("/moderation/resources", "Resources", "Moderation"),
        route("/admin/situations", "Situations", "Moderation"),
        route("/admin/users", "User Management", "Admin", true),
        route("/admin/replay-combo-imports", "Replay Import", "Admin", true),
    ];
    return list.filter(Boolean);
}

async function resolveDynamicIds(session) {
    const first = async (path, pick) => {
        try {
            return pick(await session.get(path));
        } catch {
            return null;
        }
    };
    return {
        combo: await first("/combo-sequences?size=1", (items) => items[0]?.id)
            ?? await first("/moderation/queue", (queue) => findQueuedId(queue, "combo")),
        oki: await first("/okis?size=1", (items) => items[0]?.id),
        blockstring: await first("/blockstrings?size=1", (items) => items[0]?.id),
        scenario: await first("/scenarios?size=1", (items) => items[0]?.id)
            ?? await first("/moderation/queue", (queue) => findQueuedId(queue, "scenario")),
        character: await first("/characters", (items) => items.find((character) => character.name === "Ryu")?.id ?? items[0]?.id),
    };
}

function findQueuedId(queue, type) {
    const items = Array.isArray(queue) ? queue : (queue?.data ?? []);
    return items.find((item) => item.contentType === type)?.contentId ?? null;
}
