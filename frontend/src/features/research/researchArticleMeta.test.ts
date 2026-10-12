import assert from "node:assert/strict";
import test from "node:test";

import {
    ResearchFrontmatterError,
    parseResearchFrontmatter,
    resolveResearchAssetPath,
    sortResearchArticlesNewestFirst,
} from "./researchArticleMeta";

const minimal = {title: "Combo routes", description: "How players route combos", date: "2026-10-12"};

test("minimal frontmatter fills optional fields with empty defaults", () => {
    const meta = parseResearchFrontmatter("combo-routes", minimal);

    assert.equal(meta.title, "Combo routes");
    assert.equal(meta.date, "2026-10-12");
    assert.equal(meta.draft, false);
    assert.deepEqual(meta.tags, []);
    assert.equal(meta.image, null);
    assert.equal(meta.data, null);
});

test("YAML dates parsed as Date objects become YYYY-MM-DD", () => {
    const meta = parseResearchFrontmatter("combo-routes", {...minimal, date: new Date("2026-10-12T00:00:00Z")});

    assert.equal(meta.date, "2026-10-12");
});

test("missing or malformed required fields are rejected with the slug in the message", () => {
    assert.throws(() => parseResearchFrontmatter("combo-routes", {...minimal, title: undefined}), /combo-routes.*"title" is required/);
    assert.throws(() => parseResearchFrontmatter("combo-routes", {...minimal, date: "12/10/2026"}), ResearchFrontmatterError);
    assert.throws(() => parseResearchFrontmatter("combo-routes", {...minimal, youtube: "http://youtu.be/x"}), /https/);
    assert.throws(() => parseResearchFrontmatter("Combo_Routes", minimal), /kebab-case/);
    assert.throws(() => parseResearchFrontmatter("combo-routes", null), /frontmatter/);
    assert.throws(() => parseResearchFrontmatter("combo-routes", {...minimal, image: "figures/cover.svg"}), /PNG/);
});

test("data info accepts a single source and numeric sample sizes", () => {
    const meta = parseResearchFrontmatter("combo-routes", {
        ...minimal,
        data: {source: "SF6ReplaysDb", sampleSize: 12500, period: "Season 3"},
    });

    assert.deepEqual(meta.data, {sources: ["SF6ReplaysDb"], sampleSize: "12,500", period: "Season 3", gameVersion: null});
});

test("relative asset paths resolve into the article's public folder", () => {
    assert.equal(resolveResearchAssetPath("combo-routes", "figures/rank.svg"), "/research/combo-routes/figures/rank.svg");
    assert.equal(resolveResearchAssetPath("combo-routes", "./cover.png"), "/research/combo-routes/cover.png");
    assert.equal(resolveResearchAssetPath("combo-routes", "/logos/x.svg"), "/logos/x.svg");
    assert.equal(resolveResearchAssetPath("combo-routes", "https://example.com/x.png"), "https://example.com/x.png");
    assert.equal(resolveResearchAssetPath("combo-routes", "#method"), "#method");
});

test("parsed preview images use the resolved path", () => {
    const meta = parseResearchFrontmatter("combo-routes", {...minimal, image: "figures/cover.png"});

    assert.equal(meta.image, "/research/combo-routes/figures/cover.png");
});

test("articles sort newest first with slug as tiebreaker", () => {
    const sorted = sortResearchArticlesNewestFirst([
        {slug: "b", date: "2026-01-01"},
        {slug: "c", date: "2026-05-01"},
        {slug: "a", date: "2026-01-01"},
    ]);

    assert.deepEqual(sorted.map((article) => article.slug), ["c", "a", "b"]);
});
