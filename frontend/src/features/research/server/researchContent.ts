import {readdir, readFile} from "node:fs/promises";
import path from "node:path";
import {parse as parseYaml} from "yaml";
import {
    type ResearchArticleMeta,
    type ResearchHeading,
    ResearchFrontmatterError,
    parseResearchFrontmatter,
    sortResearchArticlesNewestFirst,
} from "@/src/features/research/researchArticleMeta";
import {renderResearchMarkdown} from "@/src/features/research/server/renderResearchMarkdown";

export interface ResearchArticle {
    meta: ResearchArticleMeta;
    html: string;
    headings: ResearchHeading[];
}

const CONTENT_DIRECTORY = path.join(process.cwd(), "content", "research");
const FRONTMATTER_PATTERN = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/;

// Drafts are previewable with `next dev` but never part of a production build.
const includeDrafts = process.env.NODE_ENV !== "production";

export async function listResearchArticles(): Promise<ResearchArticleMeta[]> {
    const slugs = await listSlugs();
    const articles = await Promise.all(slugs.map(async (slug) => splitSource(slug, await readSource(slug)).meta));

    return sortResearchArticlesNewestFirst(articles.filter((meta) => includeDrafts || !meta.draft));
}

export async function getResearchArticle(slug: string): Promise<ResearchArticle | null> {
    if (!(await listSlugs()).includes(slug)) {
        return null;
    }

    const {meta, body} = splitSource(slug, await readSource(slug));
    if (meta.draft && !includeDrafts) {
        return null;
    }

    return {meta, ...(await renderResearchMarkdown(slug, body))};
}

async function listSlugs(): Promise<string[]> {
    const entries = await readdir(CONTENT_DIRECTORY, {withFileTypes: true}).catch(() => []);

    return entries.flatMap((entry) => entry.isFile() && entry.name.endsWith(".md") && !entry.name.startsWith("_")
        ? [entry.name.slice(0, -".md".length)]
        : []);
}

function readSource(slug: string): Promise<string> {
    return readFile(path.join(CONTENT_DIRECTORY, `${slug}.md`), "utf8");
}

function splitSource(slug: string, source: string): {meta: ResearchArticleMeta; body: string} {
    const match = FRONTMATTER_PATTERN.exec(source);
    if (!match) {
        throw new ResearchFrontmatterError(slug, "the file must start with a --- frontmatter block");
    }

    return {
        meta: parseResearchFrontmatter(slug, parseYaml(match[1])),
        body: source.slice(match[0].length),
    };
}
