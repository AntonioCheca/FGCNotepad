// Runs inside the page via page.evaluate, so it must not reference anything outside its own body.
export function collectPageMetrics() {
    const vw = document.documentElement.clientWidth;
    const vh = window.innerHeight;
    const MIN_TARGET = 24;
    const TALL_BLOCK_SCREENS = 3;

    const isVisible = (element) => {
        const rect = element.getBoundingClientRect();
        if (rect.width < 1 || rect.height < 1) {
            return false;
        }
        const style = getComputedStyle(element);
        return style.visibility !== "hidden" && style.display !== "none" && Number(style.opacity) !== 0;
    };

    const describe = (element) => {
        const id = element.id ? `#${element.id}` : "";
        const label = element.getAttribute("aria-label") || element.textContent || "";
        const className = typeof element.className === "string" ? element.className.split(" ").filter((name) => !name.startsWith("css-")).slice(0, 2).join(".") : "";
        return `${element.tagName.toLowerCase()}${id}${className ? `.${className}` : ""} "${label.trim().replace(/\s+/g, " ").slice(0, 40)}"`;
    };

    const clipsHorizontally = (element) => {
        const overflowX = getComputedStyle(element).overflowX;
        return overflowX === "auto" || overflowX === "scroll" || overflowX === "hidden" || overflowX === "clip";
    };

    const insideHorizontalClip = (element) => {
        for (let parent = element.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
            if (clipsHorizontally(parent)) {
                return true;
            }
        }
        return false;
    };

    const main = document.querySelector("main") ?? document.body;
    const all = [...main.querySelectorAll("*")];

    const offscreen = all.filter((element) => {
        if (!isVisible(element) || insideHorizontalClip(element)) {
            return false;
        }
        const rect = element.getBoundingClientRect();
        return rect.right > vw + 1 || rect.left < -1;
    });
    const offscreenRoots = offscreen.filter((element) => !offscreen.includes(element.parentElement));

    const scrollers = all
        .filter((element) => {
            const overflowX = getComputedStyle(element).overflowX;
            // Grid editors may scroll sideways on purpose (AGENTS.md); they opt out with data-intentional-scroll.
            return (overflowX === "auto" || overflowX === "scroll") && element.scrollWidth > element.clientWidth + 4 && isVisible(element) && !element.closest("[data-intentional-scroll]");
        })
        .map((element) => ({element: describe(element), ratio: Number((element.scrollWidth / element.clientWidth).toFixed(2))}));

    const tables = [...main.querySelectorAll("table")].filter(isVisible).map((table) => ({
        element: describe(table),
        inScroller: insideHorizontalClip(table),
        columns: table.querySelector("tr")?.children.length ?? 0,
    }));

    const interactiveSelector = "a[href], button, input:not([type=hidden]), select, textarea, [role=button], [role=tab], [role=checkbox], [role=switch], [role=combobox], [role=slider], [tabindex]:not([tabindex='-1'])";
    const targets = [...document.querySelectorAll(interactiveSelector)]
        .filter((element) => isVisible(element) && !element.closest("[aria-hidden=true]") && !element.disabled)
        // Count the innermost control only (a <Link> wrapping a <button> is one target); slider inputs are covered by their thumb.
        .filter((element) => !element.querySelector(interactiveSelector) && !element.closest(".MuiSlider-thumb"))
        .map((element) => ({element, rect: element.getBoundingClientRect()}))
        .filter(({rect}) => rect.bottom > -2000);
    const centers = targets.map(({rect}) => ({x: rect.left + rect.width / 2, y: rect.top + rect.height / 2}));
    const undersized = targets.filter(({rect}, index) => {
        if (rect.width >= MIN_TARGET && rect.height >= MIN_TARGET) {
            return false;
        }
        // WCAG 2.5.8 spacing exception: a 24px circle around the target must not reach another target.
        return centers.some((center, otherIndex) => otherIndex !== index && Math.hypot(center.x - centers[index].x, center.y - centers[index].y) < MIN_TARGET);
    });
    const belowRecommended = targets.filter(({rect}) => rect.width < 44 || rect.height < 44).length;

    let totalChars = 0;
    let charsBelow14 = 0;
    let charsBelow12 = 0;
    const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const text = node.textContent.trim();
        const parent = node.parentElement;
        if (!text || !parent || !isVisible(parent)) {
            continue;
        }
        const size = parseFloat(getComputedStyle(parent).fontSize);
        totalChars += text.length;
        if (size < 14) {
            charsBelow14 += text.length;
        }
        if (size < 12) {
            charsBelow12 += text.length;
        }
    }

    const zoomInputs = [...main.querySelectorAll("input, textarea, select, [contenteditable=true]")]
        .filter((element) => isVisible(element) && !["checkbox", "radio", "range", "file", "color", "hidden"].includes(element.type))
        .filter((element) => parseFloat(getComputedStyle(element).fontSize) < 16)
        .map(describe);

    const tallBlocks = all
        .filter((element) => {
            const height = element.getBoundingClientRect().height;
            if (height < vh * TALL_BLOCK_SCREENS || !isVisible(element)) {
                return false;
            }
            return ![...element.children].some((child) => child.getBoundingClientRect().height > height * 0.8);
        })
        .map((element) => ({element: describe(element), screens: Number((element.getBoundingClientRect().height / vh).toFixed(1))}));

    // A "box" is anything drawn as a card: visible border or its own background.
    // Form controls, chips and buttons draw their own borders but are not layout cards.
    const CONTROL_SELECTOR = "input, select, textarea, button, fieldset, [role=button], [role=combobox], .MuiInputBase-root, .MuiChip-root, .MuiButtonBase-root, .MuiSlider-root";
    const isBox = (element) => {
        // Data visualisations (bars, segments) and cells of intentional scroll grids are not layout cards.
        if (element.matches(CONTROL_SELECTOR) || element.closest(".MuiInputBase-root, .MuiChip-root, .MuiButtonBase-root") || element.parentElement?.closest("[data-chart], [data-intentional-scroll]")) {
            return false;
        }
        const style = getComputedStyle(element);
        const hasBorder = parseFloat(style.borderLeftWidth) > 0 && style.borderLeftStyle !== "none";
        const hasBackground = style.backgroundColor !== "rgba(0, 0, 0, 0)" && style.backgroundColor !== "transparent";
        return (hasBorder || hasBackground) && isVisible(element) && element.getBoundingClientRect().width > 120;
    };
    const boxes = all.filter(isBox);
    const boxSet = new Set(boxes);
    const boxDepth = (element) => {
        let depth = 0;
        for (let node = element; node && node !== main; node = node.parentElement) {
            if (boxSet.has(node)) {
                depth += 1;
            }
        }
        return depth;
    };
    const maxBoxDepth = boxes.reduce((max, box) => Math.max(max, boxDepth(box)), 0);

    const containerOverflows = boxes.filter((box) => {
        const parentBox = (() => {
            for (let node = box.parentElement; node && node !== main; node = node.parentElement) {
                if (boxSet.has(node)) {
                    return node;
                }
            }
            return null;
        })();
        if (!parentBox || clipsHorizontally(parentBox)) {
            return false;
        }
        for (let node = box.parentElement; node && node !== parentBox; node = node.parentElement) {
            if (clipsHorizontally(node)) {
                return false;
            }
        }
        const rect = box.getBoundingClientRect();
        const parentRect = parentBox.getBoundingClientRect();
        return rect.right > parentRect.right + 1 || rect.left < parentRect.left - 1;
    });

    const textBoxWidths = boxes
        .filter((box) => [...box.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim()) || box.querySelector("p, span, h1, h2, h3, h4, h5, h6"))
        .map((box) => box.getBoundingClientRect().width - parseFloat(getComputedStyle(box).paddingLeft) - parseFloat(getComputedStyle(box).paddingRight));
    const narrowestBoxContentPct = textBoxWidths.length ? Math.round((Math.min(...textBoxWidths) / vw) * 100) : 100;

    const heading = main.querySelector("h1, h2");
    const headingTop = heading ? heading.getBoundingClientRect().top + window.scrollY : null;

    return {
        viewport: {width: vw, height: vh},
        horizontalOverflowPx: Math.max(0, document.documentElement.scrollWidth - vw),
        pageScreens: Number((document.documentElement.scrollHeight / vh).toFixed(1)),
        headingTopPx: headingTop === null ? null : Math.round(headingTop),
        offscreenElements: offscreenRoots.slice(0, 8).map(describe),
        offscreenCount: offscreenRoots.length,
        horizontalScrollers: scrollers,
        tables,
        targets: {total: targets.length, undersized: undersized.length, belowRecommended, undersizedExamples: undersized.slice(0, 6).map(({element}) => describe(element))},
        text: {
            totalChars,
            below14Pct: totalChars ? Number(((charsBelow14 / totalChars) * 100).toFixed(1)) : 0,
            below12Pct: totalChars ? Number(((charsBelow12 / totalChars) * 100).toFixed(1)) : 0,
        },
        zoomInputs: {count: zoomInputs.length, examples: zoomInputs.slice(0, 4)},
        tallBlocks: tallBlocks.slice(0, 4),
        boxes: {
            maxDepth: maxBoxDepth,
            containerOverflowCount: containerOverflows.length,
            containerOverflowExamples: containerOverflows.slice(0, 5).map(describe),
            narrowestContentPct: narrowestBoxContentPct,
        },
    };
}
