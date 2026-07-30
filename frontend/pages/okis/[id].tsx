import React from "react";
import Link from "next/link";
import {useRouter} from "next/router";
import useOkis from "@/hooks/useOkis";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppCircularProgress} from "@/src/components/ui/AppCircularProgress";
import {AppContainer} from "@/src/components/ui/AppContainer";
import {AppPaper} from "@/src/components/ui/AppPaper";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {InlineNotice} from "@/src/components/ui/tactical/InlineNotice";
import {PageShell} from "@/src/components/ui/tactical/PageShell";
import {SectionCard} from "@/src/components/ui/tactical/SectionCard";
import {formatOkiLabel} from "@/src/types/oki";
import type {OkiNode, OkiNodeLink, OkiProfileDetail, OkiSetup} from "@/src/types/oki";

export default function OkiDetailPage() {
    const router = useRouter();
    const {id} = router.query;
    const {getOki} = useOkis();
    const [profile, setProfile] = React.useState<OkiProfileDetail | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (typeof id !== "string") {
            return;
        }
        let canceled = false;
        setLoading(true);
        setError(null);
        getOki(id)
            .then((result) => {
                if (!canceled) {
                    setProfile(result);
                }
            })
            .catch(() => {
                if (!canceled) {
                    setError("Could not load oki profile.");
                }
            })
            .finally(() => {
                if (!canceled) {
                    setLoading(false);
                }
            });
        return () => { canceled = true; };
    }, [getOki, id]);

    if (loading) {
        return <AppContainer sx={{py: 4, display: "grid", placeItems: "center"}}><AppCircularProgress /></AppContainer>;
    }

    if (error || !profile) {
        return <AppContainer sx={{py: 4}}><InlineNotice severity="error">{error ?? "Oki profile not found."}</InlineNotice></AppContainer>;
    }

    return (
        <AppContainer maxWidth={false} sx={{py: {xs: 2.25, md: 3.25}, px: {xs: 1.75, md: 3, xl: 4}}}>
            <PageShell title={`Ender: ${profile.move.numpadNotation}`} badgeLabel={`Frame advantage ${formatFrameAdvantage(profile.frameAdvantage)}`}>
                <AppBox sx={{display: "flex", justifyContent: "space-between", gap: 1, flexWrap: "wrap"}}>
                    <AppTypography variant="body2" color="text.secondary">{profile.move.character.name}</AppTypography>
                    <Link href={`/okis/${profile.id}/edit`} style={{textDecoration: "none"}}><AppButton type="button" variant="outlined" color="secondary">Edit oki</AppButton></Link>
                </AppBox>

                <SummaryStrip profile={profile} />

                {profile.setups.map((setup, index) => <SetupCard key={setup.id} setup={setup} index={index} />)}
            </PageShell>
        </AppContainer>
    );
}

function formatFrameAdvantage(value: number | null): string {
    if (value === null) {
        return "Unavailable";
    }

    return value > 0 ? `+${value}` : String(value);
}

function SummaryStrip({profile}: {profile: OkiProfileDetail}) {
    const summary = profile.summary;
    const facts = [
        summary.meterless ? {label: "Access", value: "Meterless"} : null,
        summary.driveRush ? {label: "Access", value: "Drive Rush"} : null,
        summary.cornerOnly ? {label: "Position", value: "Corner-only setup"} : null,
        summary.hasFakeSetups ? {label: "Warning", value: "Fake setup present", danger: true} : null,
        ...summary.optionTypes.map((type) => ({label: "Option", value: formatOkiLabel(type)})),
        ...summary.properties.map((property) => ({label: "Property", value: formatOkiLabel(property), danger: property.includes("FAKE")})),
    ].filter((fact): fact is FactItem => fact !== null);

    if (facts.length === 0) {
        return null;
    }

    return (
        <AppPaper variant="outlined" sx={{p: 1.2, borderRadius: 2.5, backgroundColor: "fgc.surface.sunken", borderColor: "fgc.border.default"}}>
            <FactRail facts={facts} />
        </AppPaper>
    );
}

function SetupCard({setup, index}: {setup: OkiSetup; index: number}) {
    const nodeById = new Map(setup.nodes.map((node) => [node.id, node]));
    const roots = setup.nodes.filter((node) => !setup.links.some((link) => link.toNodeId === node.id));
    const finalNodes = setup.nodes.filter((node) => node.optionType);
    const defaultRoute = buildRoute(roots[0] ?? setup.nodes[0], setup.links, nodeById, true);
    const adaptationNodes = [];
    for (const node of setup.nodes) {
        if (node.routeExplanation && !node.isDefaultRoute) {
            adaptationNodes.push(node);
        }
    }

    return (
        <SectionCard title={`Setup ${index + 1}`} tone="raised" variant={setup.fakeNoBackroll || setup.fakeBackroll ? "finalize" : "review"}>
            <FactRail facts={[
                {label: "Access", value: setup.usesDriveRush ? "Drive Rush required" : "Meterless"},
                {label: "Timing", value: setup.autoTimed ? "Auto-timed" : "Manual"},
                setup.cornerOnly ? {label: "Position", value: "Corner only"} : null,
            ].filter((fact): fact is FactItem => fact !== null)} compact />

            <RecoveryWarnings setup={setup} />

            <RouteBlock title="Primary sequence" route={defaultRoute} />

            <AppBox sx={{display: "grid", gap: 1}}>
                <AppTypography variant="subtitle2" sx={{fontWeight: 800}}>Options available</AppTypography>
                {finalNodes.map((node) => <OptionPanel key={node.id} node={node} />)}
            </AppBox>

            <AppBox sx={{display: "grid", gap: 1}}>
                {adaptationNodes.map((node) => (
                    <RouteBlock key={node.id} title={`Adaptation: ${node.routeExplanation}`} route={buildRoute(node, setup.links, nodeById, false)} />
                ))}
            </AppBox>
        </SectionCard>
    );
}

function RecoveryWarnings({setup}: {setup: OkiSetup}) {
    const warnings = [
        !setup.worksNoBackroll ? "Does not work without backroll" : null,
        setup.fakeNoBackroll ? "Fake without backroll" : null,
        !setup.worksBackroll ? "Does not work with backroll" : null,
        setup.fakeBackroll ? "Fake with backroll" : null,
    ].filter((warning): warning is string => warning !== null);

    if (warnings.length === 0) {
        return null;
    }

    return (
        <AppPaper variant="outlined" sx={{p: 1, borderRadius: 2, backgroundColor: "fgc.highlight.surface", borderColor: "fgc.feedback.error", display: "grid", gap: 0.35}}>
            {warnings.map((warning) => (
                <AppTypography key={warning} variant="body2" sx={{fontWeight: 900, color: "fgc.feedback.error", textTransform: "uppercase", letterSpacing: 0.25}}>{warning}</AppTypography>
            ))}
        </AppPaper>
    );
}

function RouteBlock({title, route}: {title: string; route: Array<{node: OkiNode; link?: OkiNodeLink}>}) {
    if (route.length === 0) {
        return null;
    }
    return (
        <AppPaper variant="outlined" sx={{p: {xs: 1, md: 1.15}, borderRadius: 2, backgroundColor: "fgc.surface.sunken", borderColor: "fgc.border.default", display: "grid", gap: 0.9}}>
            <AppTypography variant="subtitle2" sx={{fontWeight: 850}}>{title}</AppTypography>
            <AppBox sx={{display: {xs: "grid", md: "flex"}, alignItems: {md: "stretch"}, gap: {xs: 0.65, md: 0}, overflowX: {md: "auto"}, pb: {md: 0.25}}}>
                {route.map(({node, link}, index) => (
                    <React.Fragment key={node.id}>
                        {index > 0 ? <RouteConnector link={link} /> : null}
                        <RouteStep node={node} index={index} />
                    </React.Fragment>
                ))}
            </AppBox>
        </AppPaper>
    );
}

function OptionPanel({node}: {node: OkiNode}) {
    const grouped = {
        WINS: node.interactions.filter((interaction) => interaction.result === "WINS"),
        LOSES: node.interactions.filter((interaction) => interaction.result === "LOSES"),
        NEUTRAL: node.interactions.filter((interaction) => interaction.result === "NEUTRAL"),
        TRADES: node.interactions.filter((interaction) => interaction.result === "TRADES"),
    };
    return (
        <AppPaper variant="outlined" sx={{p: 1, borderRadius: 2, display: "grid", gap: 0.8, backgroundColor: "fgc.surface.base"}}>
            <AppBox sx={{display: "grid", gap: 0.35}}>
                <AppTypography variant="subtitle2" sx={{fontWeight: 850}}>{node.optionType ? formatOkiLabel(node.optionType) : node.move.numpadNotation}</AppTypography>
                {node.properties.length > 0 ? <PropertyLine properties={node.properties.map(formatOkiLabel)} /> : null}
            </AppBox>
            <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", md: "repeat(4, 1fr)"}, gap: 1}}>
                <InteractionList title="Wins against" items={grouped.WINS} />
                <InteractionList title="Loses against" items={grouped.LOSES} danger />
                <InteractionList title="Neutral against" items={grouped.NEUTRAL} />
                <InteractionList title="Trades with" items={grouped.TRADES} />
            </AppBox>
        </AppPaper>
    );
}

type FactItem = {label: string; value: string; danger?: boolean};

function FactRail({facts, compact = false}: {facts: FactItem[]; compact?: boolean}) {
    return (
        <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", sm: compact ? "repeat(3, minmax(0, 1fr))" : "repeat(auto-fit, minmax(150px, 1fr))"}, gap: compact ? 0.65 : 0.85}}>
            {facts.map((fact) => (
                <AppBox key={`${fact.label}-${fact.value}`} sx={{display: "grid", gap: 0.1, minWidth: 0}}>
                    <AppTypography variant="body2" sx={{fontWeight: 850, color: "text.secondary", letterSpacing: 0.25, textTransform: "uppercase", lineHeight: 1.15}}>{fact.label}</AppTypography>
                    <AppTypography variant="body2" sx={{fontWeight: 760, color: fact.danger ? "fgc.feedback.error" : "text.primary", lineHeight: 1.25}}>{fact.value}</AppTypography>
                </AppBox>
            ))}
        </AppBox>
    );
}

function RouteStep({node, index}: {node: OkiNode; index: number}) {
    const isFinal = Boolean(node.optionType);

    return (
        <AppBox
            component="span"
            sx={{
                display: "grid",
                alignContent: "center",
                gap: 0.2,
                minWidth: {xs: "100%", md: isFinal ? 150 : 126},
                px: 1,
                py: 0.8,
                borderRadius: 1.5,
                border: "1px solid",
                borderColor: isFinal ? "fgc.accent.selected" : "fgc.border.default",
                backgroundColor: isFinal ? "fgc.surface.raised" : "fgc.surface.base",
                boxShadow: isFinal ? "0 0 0 1px rgba(0,0,0,0.02)" : "none",
            }}
        >
            <AppTypography variant="body2" sx={{fontWeight: 850, color: "text.secondary", letterSpacing: 0.25}}>STEP {index + 1}</AppTypography>
            <AppTypography variant="h6" sx={{fontWeight: 880, lineHeight: 1.12}}>{node.move.numpadNotation}</AppTypography>
            {node.optionType ? <AppTypography variant="body2" sx={{fontWeight: 780, color: "fgc.accent.selected", lineHeight: 1.15}}>{formatOkiLabel(node.optionType)}</AppTypography> : null}
        </AppBox>
    );
}

function RouteConnector({link}: {link?: OkiNodeLink}) {
    const hasTiming = Boolean(link && link.stepType !== "IMMEDIATE");
    const label = hasTiming && link ? `${formatOkiLabel(link.stepType)} ${link.minFrames}-${link.maxFrames}f` : "then";

    return (
        <AppBox sx={{display: "grid", alignItems: "center", justifyItems: "center", px: {xs: 0, md: 0.65}, minWidth: {md: hasTiming ? 112 : 44}}}>
            <AppTypography variant="body2" sx={{fontWeight: hasTiming ? 820 : 700, color: hasTiming ? "text.primary" : "text.secondary", lineHeight: 1.05, textAlign: "center"}}>{label}</AppTypography>
            <AppBox sx={{display: {xs: "none", md: "block"}, width: "100%", borderTop: "1px solid", borderColor: "fgc.border.strong", mt: 0.35}} />
        </AppBox>
    );
}

function PropertyLine({properties}: {properties: string[]}) {
    return (
        <AppTypography variant="body2" sx={{color: "text.secondary", fontWeight: 650}}>
            Properties: <AppBox component="span" sx={{color: "text.primary", fontWeight: 760}}>{properties.join(" · ")}</AppBox>
        </AppTypography>
    );
}

function InteractionList({title, items, danger}: {title: string; items: OkiNode["interactions"]; danger?: boolean}) {
    if (items.length === 0) {
        return null;
    }

    return (
        <AppBox sx={{display: "grid", alignContent: "start", gap: 0.35}}>
            <AppTypography variant="body2" sx={{fontWeight: 820, color: danger ? "fgc.feedback.error" : "text.secondary"}}>{title}</AppTypography>
            {items.map((item) => <AppTypography key={item.id} variant="body2">{item.character ? `${item.character.name}: ` : ""}{item.defensiveMove.numpadNotation}</AppTypography>)}
        </AppBox>
    );
}

function buildRoute(start: OkiNode | undefined, links: OkiNodeLink[], nodeById: Map<number, OkiNode>, preferDefault: boolean): Array<{node: OkiNode; link?: OkiNodeLink}> {
    if (!start) {
        return [];
    }
    const route: Array<{node: OkiNode; link?: OkiNodeLink}> = [{node: start}];
    let current = start;
    const visited = new Set<number>([start.id]);
    while (true) {
        const outgoing = links.filter((link) => link.fromNodeId === current.id);
        const nextLink = preferDefault
            ? outgoing.find((link) => nodeById.get(link.toNodeId)?.isDefaultRoute) ?? outgoing[0]
            : outgoing[0];
        if (!nextLink) {
            break;
        }
        const nextNode = nodeById.get(nextLink.toNodeId);
        if (!nextNode || visited.has(nextNode.id)) {
            break;
        }
        route.push({node: nextNode, link: nextLink});
        visited.add(nextNode.id);
        current = nextNode;
    }
    return route;
}
