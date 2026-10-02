// Penalties are capped per check so one noisy metric cannot zero a page on its own.
const capped = (count, perItem, cap) => Math.min(count * perItem, cap);

export function scorePage(metrics) {
    const tablesOutsideScroller = metrics.tables.filter((table) => !table.inScroller).length;
    const wideScrollers = metrics.horizontalScrollers.filter((scroller) => scroller.ratio > 1.5).length;
    const seriousAxe = metrics.axe.filter((violation) => violation.impact === "serious" || violation.impact === "critical").length;

    const penalties = {
        horizontalOverflow: metrics.horizontalOverflowPx > 0 ? 25 : 0,
        offscreenElements: capped(metrics.offscreenCount, 3, 15),
        tablesOutsideScroller: capped(tablesOutsideScroller, 10, 20),
        wideScrollers: capped(wideScrollers, 4, 8),
        undersizedTargets: capped(metrics.targets.undersized, 1, 12),
        zoomInputs: capped(metrics.zoomInputs.count, 2, 10),
        tinyText: metrics.text.below12Pct > 5 ? 8 : 0,
        smallText: metrics.text.below14Pct > 40 ? 5 : 0,
        tallBlocks: capped(metrics.tallBlocks.length, 4, 8),
        longPage: metrics.pageScreens > 12 ? 4 : 0,
        accessibility: capped(seriousAxe, 3, 12),
        containerOverflow: capped(metrics.boxes.containerOverflowCount, 3, 12),
        deepNesting: metrics.boxes.maxDepth >= 4 ? 6 : (metrics.boxes.maxDepth === 3 ? 3 : 0),
        crampedContent: metrics.boxes.narrowestContentPct < 60 ? 5 : 0,
    };

    const value = Math.max(0, 100 - Object.values(penalties).reduce((sum, penalty) => sum + penalty, 0));
    const hardPass = metrics.horizontalOverflowPx === 0
        && metrics.offscreenCount === 0
        && metrics.boxes.containerOverflowCount === 0
        && tablesOutsideScroller === 0
        && metrics.targets.undersized === 0
        && metrics.zoomInputs.count === 0
        && seriousAxe === 0;

    return {value, hardPass, penalties};
}
