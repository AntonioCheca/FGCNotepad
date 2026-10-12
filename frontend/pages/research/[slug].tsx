import type {GetStaticPaths, GetStaticProps} from "next";
import {ResearchArticlePage} from "@/src/features/research/ResearchArticlePage";
import {type ResearchArticle, getResearchArticle, listResearchArticles} from "@/src/features/research/server/researchContent";

export default function ResearchArticleRoute({meta, html, headings}: ResearchArticle) {
    return <ResearchArticlePage meta={meta} html={html} headings={headings}/>;
}

export const getStaticPaths: GetStaticPaths = async () => ({
    paths: (await listResearchArticles()).map((article) => ({params: {slug: article.slug}})),
    fallback: false,
});

export const getStaticProps: GetStaticProps<ResearchArticle, {slug: string}> = async ({params}) => {
    const article = params ? await getResearchArticle(params.slug) : null;

    return article ? {props: article} : {notFound: true};
};
