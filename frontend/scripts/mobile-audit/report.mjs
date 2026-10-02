const ISSUE_LABELS = {
    horizontalOverflow: "page scrolls sideways",
    offscreenElements: "content past screen edge",
    tablesOutsideScroller: "desktop table",
    wideScrollers: "wide sideways scroller",
    undersizedTargets: "tap targets < 24px",
    zoomInputs: "inputs < 16px (iOS zoom)",
    tinyText: "text < 12px",
    smallText: "mostly text < 14px",
    tallBlocks: "section > 3 screens",
    longPage: "page > 12 screens",
    accessibility: "axe serious/critical",
    containerOverflow: "content sticks out of its card",
    deepNesting: "cards nested 3+ deep",
    crampedContent: "card content < 60% of screen width",
};

const average = (values) => (values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0);

export function renderMarkdownReport(results, viewports) {
    // Desktop-only routes are listed but excluded from site-level numbers.
    const measured = results.filter((result) => !result.error && !result.desktopOnly);
    const routes = [...new Set(results.filter((result) => !result.desktopOnly).map((result) => result.route))];
    const allRoutes = [...new Set(results.map((result) => result.route))];
    const byRoute = (route, viewport) => results.find((result) => result.route === route && result.viewport === viewport);
    const passingRoutes = routes.filter((route) => viewports.every((viewport) => byRoute(route, viewport.name)?.score?.hardPass));

    const lines = [
        `# Mobile audit — ${new Date().toISOString().slice(0, 10)}`,
        "",
        `| Metric | Value |`,
        `| --- | --- |`,
        ...viewports.map((viewport) => `| Average score @${viewport.name}px | ${average(measured.filter((result) => result.viewport === viewport.name).map((result) => result.score.value))} / 100 |`),
        `| Strict-pass coverage (all phone widths) | ${passingRoutes.length} / ${routes.length} routes (${Math.round((passingRoutes.length / Math.max(routes.length, 1)) * 100)}%) |`,
        `| Routes scrolling sideways | ${routes.filter((route) => viewports.some((viewport) => (byRoute(route, viewport.name)?.metrics?.horizontalOverflowPx ?? 0) > 0)).length} |`,
        `| Undersized tap targets (sum @${viewports[0].name}px) | ${measured.filter((result) => result.viewport === viewports[0].name).reduce((sum, result) => sum + result.metrics.targets.undersized, 0)} |`,
        `| Inputs that trigger iOS zoom (sum @${viewports[0].name}px) | ${measured.filter((result) => result.viewport === viewports[0].name).reduce((sum, result) => sum + result.metrics.zoomInputs.count, 0)} |`,
        "",
        `| Area | Route | ${viewports.map((viewport) => `@${viewport.name}`).join(" | ")} | Screens | Main issues |`,
        `| --- | --- | ${viewports.map(() => "---").join(" | ")} | --- | --- |`,
    ];

    for (const route of allRoutes) {
        const cells = viewports.map((viewport) => {
            const result = byRoute(route, viewport.name);
            if (!result) {
                return "–";
            }
            if (result.error) {
                return "err";
            }
            return `${result.score.value}${result.score.hardPass ? " ✓" : ""}`;
        });
        const reference = byRoute(route, viewports[0].name);
        const issues = reference?.score
            ? Object.entries(reference.score.penalties).filter(([, penalty]) => penalty > 0).sort(([, a], [, b]) => b - a).map(([key]) => ISSUE_LABELS[key]).join(", ")
            : (reference?.error ?? "");
        const routeLabel = reference?.desktopOnly ? `\`${route}\` (desktop-only)` : `\`${route}\``;
        lines.push(`| ${reference?.area ?? ""} | ${routeLabel} | ${cells.join(" | ")} | ${reference?.metrics?.pageScreens ?? "–"} | ${issues || "—"} |`);
    }

    lines.push("", "✓ = strict pass: no sideways scroll, nothing past the screen edge or out of its card, no desktop table, no tap target under 24px, no input under 16px, no serious axe violation.", "");
    return `${lines.join("\n")}\n`;
}
