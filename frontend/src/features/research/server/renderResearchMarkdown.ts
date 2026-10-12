import type {Element, ElementContent, Root, RootContent} from "hast";
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import {unified} from "unified";
import {
    type ResearchHeading,
    ResearchFrontmatterError,
    resolveResearchAssetPath,
} from "@/src/features/research/researchArticleMeta";

export interface RenderedResearchMarkdown {
    html: string;
    headings: ResearchHeading[];
}

const GFM_FOOTNOTES_HEADING_ID = "footnote-label";

export async function renderResearchMarkdown(slug: string, markdown: string): Promise<RenderedResearchMarkdown> {
    const headings: ResearchHeading[] = [];
    const file = await unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkMath)
        .use(remarkRehype)
        .use(rehypeSlug)
        .use(rehypeKatex)
        .use(() => (tree: Root) => enhanceArticleTree(slug, tree, headings))
        .use(rehypeStringify)
        .process(markdown);

    return {html: String(file), headings};
}

function enhanceArticleTree(slug: string, tree: Root, headings: ResearchHeading[]): void {
    tree.children = tree.children.map((node) => enhanceNode(slug, node, headings));
}

function enhanceNode<T extends RootContent | ElementContent>(slug: string, node: T, headings: ResearchHeading[]): T | Element {
    if (node.type !== "element") {
        return node;
    }
    if (node.tagName === "h1") {
        throw new ResearchFrontmatterError(slug, "use ## for sections; the article title comes from the frontmatter");
    }
    if (node.tagName === "h2" && typeof node.properties.id === "string" && node.properties.id !== GFM_FOOTNOTES_HEADING_ID) {
        headings.push({id: node.properties.id, text: textContent(node)});
    }

    const figureImage = node.tagName === "p" ? singleImage(node) : null;
    if (figureImage) {
        return toFigure(slug, figureImage);
    }

    if (node.tagName === "img") {
        prepareImage(slug, node);
    } else if (node.tagName === "a") {
        prepareLink(node);
    } else if (node.tagName === "pre" || hasClass(node, "katex-display")) {
        // Code and display math scroll sideways on phones, so keyboard users must be able to focus them.
        node.properties.tabIndex = 0;
    }

    node.children = node.children.map((child) => enhanceNode(slug, child, headings));

    return node.tagName === "table" ? wrapScrollableTable(node) : node;
}

// A paragraph holding only an image is a figure; the Markdown image title becomes its caption.
function singleImage(paragraph: Element): Element | null {
    const meaningful = paragraph.children.filter((child) => !(child.type === "text" && child.value.trim() === ""));
    const [only] = meaningful;

    return meaningful.length === 1 && only.type === "element" && only.tagName === "img" ? only : null;
}

function toFigure(slug: string, image: Element): Element {
    const caption = typeof image.properties.title === "string" ? image.properties.title.trim() : "";
    delete image.properties.title;
    prepareImage(slug, image);

    const children: ElementContent[] = [image];
    if (caption) {
        children.push({type: "element", tagName: "figcaption", properties: {}, children: [{type: "text", value: caption}]});
    }

    return {type: "element", tagName: "figure", properties: {}, children};
}

function prepareImage(slug: string, image: Element): void {
    if (typeof image.properties.src === "string") {
        image.properties.src = resolveResearchAssetPath(slug, image.properties.src);
    }
    image.properties.loading = "lazy";
    image.properties.decoding = "async";
}

function prepareLink(link: Element): void {
    if (typeof link.properties.href === "string" && /^https?:\/\//i.test(link.properties.href)) {
        link.properties.target = "_blank";
        link.properties.rel = ["noopener", "noreferrer"];
    }
}

function wrapScrollableTable(table: Element): Element {
    return {
        type: "element",
        tagName: "div",
        properties: {className: ["research-table-scroll"], tabIndex: 0, role: "region", ariaLabel: "Data table", dataIntentionalScroll: ""},
        children: [table],
    };
}

function hasClass(node: Element, className: string): boolean {
    const classes = node.properties.className;

    return Array.isArray(classes) && classes.includes(className);
}

function textContent(node: ElementContent): string {
    if (node.type === "text") {
        return node.value;
    }

    return node.type === "element" ? node.children.map(textContent).join("") : "";
}
