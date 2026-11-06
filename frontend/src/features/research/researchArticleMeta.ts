export const RESEARCH_SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://fightinggametheory.com").replace(/\/+$/, "");
export const RESEARCH_BASE_PATH = "/research";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MIN_FIGURE_WIDTH = 25;
const MAX_FIGURE_WIDTH = 60;

export interface ResearchDataInfo {
    sources: string[];
    sampleSize: string | null;
    period: string | null;
    gameVersion: string | null;
}

export interface ResearchArticleMeta {
    slug: string;
    title: string;
    description: string;
    date: string;
    updated: string | null;
    author: string | null;
    image: string | null;
    imageAlt: string | null;
    youtube: string | null;
    tags: string[];
    draft: boolean;
    data: ResearchDataInfo | null;
}

export interface ResearchHeading {
    id: string;
    text: string;
}

export interface ResearchFigurePlacement {
    path: string;
    rightWidth: number | null;
}

export class ResearchFrontmatterError extends Error {
    constructor(slug: string, message: string) {
        super(`Research article "${slug}": ${message}`);
        this.name = "ResearchFrontmatterError";
    }
}

export function isValidResearchSlug(slug: string): boolean {
    return SLUG_PATTERN.test(slug);
}

export function parseResearchFrontmatter(slug: string, raw: unknown): ResearchArticleMeta {
    if (!isValidResearchSlug(slug)) {
        throw new ResearchFrontmatterError(slug, "file name must be lowercase kebab-case (for example juri-ken-combo-routes.md)");
    }
    if (!isRecord(raw)) {
        throw new ResearchFrontmatterError(slug, "missing frontmatter block");
    }

    const fail = (message: string): never => {
        throw new ResearchFrontmatterError(slug, message);
    };

    const image = optionalString(raw, "image", fail);
    if (image && !/\.(?:png|jpe?g|webp)$/i.test(image)) {
        fail("\"image\" must be a PNG, JPG or WebP file; Reddit, Discord and X do not render SVG previews");
    }

    return {
        slug,
        title: requiredString(raw, "title", fail),
        description: requiredString(raw, "description", fail),
        date: requiredDate(raw, "date", fail),
        updated: optionalDate(raw, "updated", fail),
        author: optionalString(raw, "author", fail),
        image: image ? resolveResearchAssetPath(slug, image) : null,
        imageAlt: optionalString(raw, "imageAlt", fail),
        youtube: optionalUrl(raw, "youtube", fail),
        tags: optionalStringList(raw, "tags", fail),
        draft: optionalBoolean(raw, "draft", fail),
        data: parseDataInfo(raw.data, fail),
    };
}

// Relative asset paths in an article resolve to public/research/<slug>/, so figures live next to their article.
export function resolveResearchAssetPath(slug: string, path: string): string {
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|\/|#)/i.test(path)) {
        return path;
    }

    return `${RESEARCH_BASE_PATH}/${slug}/${path.replace(/^\.\//, "")}`;
}

// `figures/x.png#right-40` floats a figure to the right at 40% of the article column. A typo fails the build.
export function parseFigurePlacement(slug: string, src: string): ResearchFigurePlacement {
    const hashIndex = src.indexOf("#");
    if (hashIndex === -1) {
        return {path: src, rightWidth: null};
    }

    const fragment = src.slice(hashIndex + 1);
    const rightWidth = /^right-\d+$/.test(fragment) ? Number(fragment.slice("right-".length)) : null;
    if (rightWidth === null || rightWidth < MIN_FIGURE_WIDTH || rightWidth > MAX_FIGURE_WIDTH) {
        throw new ResearchFrontmatterError(slug, `"${src}": figure placement must be #right-${MIN_FIGURE_WIDTH} to #right-${MAX_FIGURE_WIDTH}`);
    }

    return {path: src.slice(0, hashIndex), rightWidth};
}

export function toAbsoluteSiteUrl(path: string): string {
    return /^https?:\/\//i.test(path) ? path : `${RESEARCH_SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

export function sortResearchArticlesNewestFirst<T extends Pick<ResearchArticleMeta, "date" | "slug">>(articles: T[]): T[] {
    return [...articles].sort((left, right) => right.date.localeCompare(left.date) || left.slug.localeCompare(right.slug));
}

export function formatResearchDate(date: string): string {
    const [year, month, day] = date.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "UTC",
    });
}

function parseDataInfo(raw: unknown, fail: (message: string) => never): ResearchDataInfo | null {
    if (raw === undefined || raw === null) {
        return null;
    }
    if (!isRecord(raw)) {
        return fail("\"data\" must be a mapping with source, sampleSize, period or gameVersion");
    }

    const sources = typeof raw.source === "string"
        ? [raw.source.trim()].filter(Boolean)
        : optionalStringList(raw, "source", fail);

    return {
        sources,
        sampleSize: optionalScalar(raw, "sampleSize", fail),
        period: optionalString(raw, "period", fail),
        gameVersion: optionalString(raw, "gameVersion", fail),
    };
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredString(raw: Record<string, unknown>, key: string, fail: (message: string) => never): string {
    return optionalString(raw, key, fail) ?? fail(`"${key}" is required`);
}

function optionalString(raw: Record<string, unknown>, key: string, fail: (message: string) => never): string | null {
    const value = raw[key];
    if (value === undefined || value === null) {
        return null;
    }
    if (typeof value !== "string") {
        return fail(`"${key}" must be text`);
    }

    return value.trim() || null;
}

function optionalScalar(raw: Record<string, unknown>, key: string, fail: (message: string) => never): string | null {
    const value = raw[key];
    if (typeof value === "number" && Number.isFinite(value)) {
        return value.toLocaleString("en-US");
    }

    return optionalString(raw, key, fail);
}

function optionalStringList(raw: Record<string, unknown>, key: string, fail: (message: string) => never): string[] {
    const value = raw[key];
    if (value === undefined || value === null) {
        return [];
    }
    if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
        return fail(`"${key}" must be a list of text values`);
    }

    return value.flatMap((item: string) => item.trim() || []);
}

function optionalBoolean(raw: Record<string, unknown>, key: string, fail: (message: string) => never): boolean {
    const value = raw[key];
    if (value === undefined || value === null) {
        return false;
    }
    if (typeof value !== "boolean") {
        return fail(`"${key}" must be true or false`);
    }

    return value;
}

// YAML turns unquoted 2026-10-12 into a Date, so both forms are accepted.
function requiredDate(raw: Record<string, unknown>, key: string, fail: (message: string) => never): string {
    return optionalDate(raw, key, fail) ?? fail(`"${key}" is required (YYYY-MM-DD)`);
}

function optionalDate(raw: Record<string, unknown>, key: string, fail: (message: string) => never): string | null {
    const value = raw[key];
    if (value === undefined || value === null) {
        return null;
    }
    const text = value instanceof Date && !Number.isNaN(value.getTime())
        ? value.toISOString().slice(0, 10)
        : typeof value === "string" ? value.trim() : "";

    if (!DATE_PATTERN.test(text) || Number.isNaN(Date.parse(`${text}T00:00:00Z`))) {
        return fail(`"${key}" must be a date in YYYY-MM-DD format`);
    }

    return text;
}

function optionalUrl(raw: Record<string, unknown>, key: string, fail: (message: string) => never): string | null {
    const value = optionalString(raw, key, fail);
    if (value !== null && !/^https:\/\//i.test(value)) {
        return fail(`"${key}" must be an https:// link`);
    }

    return value;
}

export type ResearchHtmlSegment = {kind: "html"; html: string} | {kind: "scenarioExplorer"; scenarioRef: string};

const SCENARIO_EXPLORER_PLACEHOLDER = /<div data-scenario-explorer="([a-z0-9-]{1,80})"><\/div>/g;

// Same normalization as the backend's scenario aliases: "Juri 214MK main oki" becomes "juri-214mk-main-oki". Public
// ids come through unchanged.
export function normalizeScenarioReference(reference: string): string {
    return reference.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

// The rendered article split around its scenario explorer placeholders, which the page fills with live components.
export function splitResearchHtml(html: string): ResearchHtmlSegment[] {
    const segments: ResearchHtmlSegment[] = [];
    let cursor = 0;
    for (const match of html.matchAll(SCENARIO_EXPLORER_PLACEHOLDER)) {
        const start = match.index ?? 0;
        if (start > cursor) {
            segments.push({kind: "html", html: html.slice(cursor, start)});
        }
        segments.push({kind: "scenarioExplorer", scenarioRef: match[1]});
        cursor = start + match[0].length;
    }
    if (cursor < html.length) {
        segments.push({kind: "html", html: html.slice(cursor)});
    }

    return segments;
}
