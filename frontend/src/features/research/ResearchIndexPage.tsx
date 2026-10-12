import Image from "next/image";
import Link from "next/link";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppChip} from "@/src/components/ui/AppChip";
import {AppContainer} from "@/src/components/ui/AppContainer";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {PageShell} from "@/src/components/ui/tactical/PageShell";
import {ResearchHead} from "@/src/features/research/ResearchHead";
import {RESEARCH_BASE_PATH, type ResearchArticleMeta, formatResearchDate} from "@/src/features/research/researchArticleMeta";

const INDEX_DESCRIPTION = "Mathematical and statistical investigations into fighting games, built on replay data.";

interface ResearchIndexPageProps {
    articles: ResearchArticleMeta[];
}

export function ResearchIndexPage({articles}: ResearchIndexPageProps) {
    return (
        <AppContainer maxWidth="md" sx={{py: {xs: 2.25, md: 3.25}, px: {xs: 2, md: 3}}}>
            <ResearchHead title="Research" description={INDEX_DESCRIPTION} path={RESEARCH_BASE_PATH}/>
            <PageShell title="Research">
                {articles.length === 0 ? (
                    <AppTypography variant="body1" color="text.secondary" sx={{py: 3}}>
                        No articles published yet.
                    </AppTypography>
                ) : (
                    <AppBox component="ol" sx={{listStyle: "none", m: 0, p: 0, display: "grid"}}>
                        {articles.map((article) => <ResearchArticleRow key={article.slug} article={article}/>)}
                    </AppBox>
                )}
            </PageShell>
        </AppContainer>
    );
}

function ResearchArticleRow({article}: {article: ResearchArticleMeta}) {
    const href = `${RESEARCH_BASE_PATH}/${article.slug}`;

    return (
        <AppBox
            component="li"
            sx={{
                position: "relative",
                display: "grid",
                gridTemplateColumns: article.image ? {xs: "1fr", sm: "minmax(0, 1fr) 200px"} : "1fr",
                gap: {xs: 1.25, sm: 2.5},
                alignItems: "start",
                py: {xs: 2, md: 2.5},
                borderBottom: "1px solid",
                borderColor: "divider",
                "&:first-of-type": {pt: {xs: 1, md: 1.5}},
                "&:hover h2": {textDecoration: "underline"},
            }}
        >
            <AppBox sx={{display: "grid", gap: 0.75, minWidth: 0}}>
                <AppTypography component="p" variant="body2" color="text.secondary">
                    <time dateTime={article.date}>{formatResearchDate(article.date)}</time>
                </AppTypography>
                <AppTypography
                    component="h2"
                    variant="h5"
                    sx={{
                        fontWeight: 700,
                        lineHeight: 1.25,
                        overflowWrap: "anywhere",
                        // The ::after overlay makes the whole row clickable while keeping one link per article.
                        "& a": {color: "inherit", textDecoration: "inherit"},
                        "& a::after": {content: '""', position: "absolute", inset: 0},
                        "& a:focus-visible": {outline: "none"},
                        "& a:focus-visible::after": {outline: "2px solid", outlineColor: "fgc.focus.outline", outlineOffset: 2, borderRadius: 1.5},
                    }}
                >
                    <Link href={href}>{article.title}</Link>
                </AppTypography>
                <AppTypography variant="body1" color="text.secondary" sx={{lineHeight: 1.6}}>
                    {article.description}
                </AppTypography>
                {article.draft ? <AppChip size="small" variant="outlined" color="warning" label="Draft" sx={{justifySelf: "start"}}/> : null}
            </AppBox>
            {article.image ? (
                <AppBox
                    sx={{
                        position: "relative",
                        aspectRatio: "1200 / 630",
                        borderRadius: 1.5,
                        overflow: "hidden",
                        border: "1px solid",
                        borderColor: "divider",
                        backgroundColor: "common.white",
                        gridRow: {xs: 1, sm: "auto"},
                    }}
                >
                    <Image src={article.image} alt="" fill sizes="(max-width: 600px) 100vw, 200px" style={{objectFit: "cover"}}/>
                </AppBox>
            ) : null}
        </AppBox>
    );
}
