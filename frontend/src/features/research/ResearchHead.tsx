import Head from "next/head";
import {toAbsoluteSiteUrl} from "@/src/features/research/researchArticleMeta";

const SITE_NAME = "Fighting Game Theory";
const FALLBACK_IMAGE = "/research/share-default.png";

interface ResearchHeadProps {
    title: string;
    description: string;
    path: string;
    image?: string | null;
    imageAlt?: string | null;
    article?: {
        publishedTime: string;
        modifiedTime: string | null;
        author: string | null;
        tags: string[];
    };
}

export function ResearchHead({title, description, path, image, imageAlt, article}: ResearchHeadProps) {
    const fullTitle = `${title} | ${SITE_NAME}`;
    const url = toAbsoluteSiteUrl(path);
    const imageUrl = toAbsoluteSiteUrl(image ?? FALLBACK_IMAGE);

    return (
        <Head>
            <title>{fullTitle}</title>
            <meta name="description" content={description}/>
            <link rel="canonical" href={url}/>
            <meta property="og:site_name" content={SITE_NAME}/>
            <meta property="og:type" content={article ? "article" : "website"}/>
            <meta property="og:title" content={title}/>
            <meta property="og:description" content={description}/>
            <meta property="og:url" content={url}/>
            <meta property="og:image" content={imageUrl}/>
            {imageAlt ? <meta property="og:image:alt" content={imageAlt}/> : null}
            <meta name="twitter:card" content={image ? "summary_large_image" : "summary"}/>
            <meta name="twitter:title" content={title}/>
            <meta name="twitter:description" content={description}/>
            <meta name="twitter:image" content={imageUrl}/>
            {article ? <meta property="article:published_time" content={article.publishedTime}/> : null}
            {article?.modifiedTime ? <meta property="article:modified_time" content={article.modifiedTime}/> : null}
            {article?.author ? <meta name="author" content={article.author}/> : null}
            {article?.tags.map((tag) => <meta key={tag} property="article:tag" content={tag}/>)}
        </Head>
    );
}
