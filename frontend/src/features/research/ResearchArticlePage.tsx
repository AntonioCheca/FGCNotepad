import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppChip} from "@/src/components/ui/AppChip";
import {AppContainer} from "@/src/components/ui/AppContainer";
import {OndemandVideoOutlinedIcon} from "@/src/components/ui/AppIcons";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {ResearchArticleBody} from "@/src/features/research/ResearchArticleBody";
import {ResearchHead} from "@/src/features/research/ResearchHead";
import {
    RESEARCH_BASE_PATH,
    type ResearchArticleMeta,
    type ResearchDataInfo,
    type ResearchHeading,
    formatResearchDate,
} from "@/src/features/research/researchArticleMeta";

const MIN_HEADINGS_FOR_CONTENTS = 3;

interface ResearchArticlePageProps {
    meta: ResearchArticleMeta;
    html: string;
    headings: ResearchHeading[];
}

export function ResearchArticlePage({meta, html, headings}: ResearchArticlePageProps) {
    return (
        <AppContainer maxWidth={false} sx={{py: {xs: 2.25, md: 4}, px: {xs: 2, md: 3}}}>
            <ResearchHead
                title={meta.title}
                description={meta.description}
                path={`${RESEARCH_BASE_PATH}/${meta.slug}`}
                image={meta.image}
                imageAlt={meta.imageAlt}
                article={{publishedTime: meta.date, modifiedTime: meta.updated, author: meta.author, tags: meta.tags}}
            />
            <AppBox component="article" sx={{maxWidth: 760, mx: "auto", minWidth: 0, display: "grid", gap: {xs: 2.5, md: 3}}}>
                <ArticleHeader meta={meta}/>
                {meta.data ? <ArticleDataInfo data={meta.data}/> : null}
                {headings.length >= MIN_HEADINGS_FOR_CONTENTS ? <ArticleContents headings={headings}/> : null}
                <ResearchArticleBody html={html}/>
            </AppBox>
        </AppContainer>
    );
}

function ArticleHeader({meta}: {meta: ResearchArticleMeta}) {
    const byline = [
        meta.author,
        formatResearchDate(meta.date),
        meta.updated ? `Updated ${formatResearchDate(meta.updated)}` : null,
    ].filter(Boolean).join(" · ");

    return (
        <AppBox component="header" sx={{display: "grid", gap: 1.25, pb: {xs: 2, md: 2.5}, borderBottom: "1px solid", borderColor: "divider"}}>
            {meta.draft ? <AppChip size="small" variant="outlined" color="warning" label="Draft" sx={{justifySelf: "start"}}/> : null}
            <AppTypography component="h1" variant="h3" sx={{fontSize: {xs: "clamp(1.6rem, 7vw, 2rem)", md: "2.25rem"}, lineHeight: 1.15, overflowWrap: "anywhere"}}>
                {meta.title}
            </AppTypography>
            <AppTypography variant="body1" color="text.secondary" sx={{fontSize: {xs: "1.05rem", md: "1.15rem"}, lineHeight: 1.55}}>
                {meta.description}
            </AppTypography>
            <AppBox sx={{display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5, flexWrap: "wrap"}}>
                <AppTypography component="p" variant="body2" color="text.secondary">
                    <time dateTime={meta.updated ?? meta.date}>{byline}</time>
                </AppTypography>
                {meta.youtube ? (
                    <AppButton
                        type="button"
                        variant="outlined"
                        href={meta.youtube}
                        target="_blank"
                        rel="noopener noreferrer"
                        startIcon={<OndemandVideoOutlinedIcon/>}
                        sx={{minHeight: 40}}
                    >
                        Watch the video
                    </AppButton>
                ) : null}
            </AppBox>
        </AppBox>
    );
}

function ArticleDataInfo({data}: {data: ResearchDataInfo}) {
    const rows = [
        {label: data.sources.length > 1 ? "Sources" : "Source", value: data.sources.join(", ")},
        {label: "Sample", value: data.sampleSize},
        {label: "Period", value: data.period},
        {label: "Game version", value: data.gameVersion},
    ].filter((row): row is {label: string; value: string} => Boolean(row.value));

    if (rows.length === 0) {
        return null;
    }

    return (
        <AppBox
            component="dl"
            sx={{
                m: 0,
                px: {xs: 1.5, md: 2},
                py: 1.25,
                display: "grid",
                gridTemplateColumns: "max-content minmax(0, 1fr)",
                columnGap: 2,
                rowGap: 0.5,
                borderRadius: 1.5,
                backgroundColor: "fgc.surface.sunken",
                fontSize: "0.9rem",
                "& dt": {color: "text.secondary", fontWeight: 600},
                "& dd": {m: 0, color: "text.primary", overflowWrap: "anywhere"},
            }}
        >
            {rows.map((row) => (
                <AppBox key={row.label} sx={{display: "contents"}}>
                    <dt>{row.label}</dt>
                    <dd>{row.value}</dd>
                </AppBox>
            ))}
        </AppBox>
    );
}

function ArticleContents({headings}: {headings: ResearchHeading[]}) {
    return (
        <AppBox component="nav" aria-labelledby="research-contents-heading" sx={{display: "grid", gap: 0.75}}>
            <AppTypography id="research-contents-heading" component="h2" variant="overline" color="text.secondary" sx={{lineHeight: 1.5}}>
                Contents
            </AppTypography>
            <AppBox
                component="ol"
                sx={{
                    m: 0,
                    pl: 2.5,
                    display: "grid",
                    gap: 0.5,
                    "& a": {color: "fgc.action.primaryText", fontWeight: 600, textDecoration: "none", "&:hover": {textDecoration: "underline"}},
                    "& a:focus-visible": {outline: "2px solid", outlineColor: "fgc.focus.outline", outlineOffset: 2},
                }}
            >
                {headings.map((heading) => (
                    <li key={heading.id}>
                        <a href={`#${heading.id}`}>{heading.text}</a>
                    </li>
                ))}
            </AppBox>
        </AppBox>
    );
}
