import type {GetStaticProps} from "next";
import type {ResearchArticleMeta} from "@/src/features/research/researchArticleMeta";
import {ResearchIndexPage} from "@/src/features/research/ResearchIndexPage";
import {listResearchArticles} from "@/src/features/research/server/researchContent";

interface ResearchIndexProps {
    articles: ResearchArticleMeta[];
}

export default function ResearchIndex({articles}: ResearchIndexProps) {
    return <ResearchIndexPage articles={articles}/>;
}

export const getStaticProps: GetStaticProps<ResearchIndexProps> = async () => ({
    props: {articles: await listResearchArticles()},
});
