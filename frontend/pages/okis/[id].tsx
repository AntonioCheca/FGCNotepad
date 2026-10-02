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
import type {OkiMoveRef, OkiNode, OkiProfileDetail, OkiSetup} from "@/src/types/oki";
import {okiSetupToGraph} from "@/src/components/okis/okiEditorTypes";
import {PressureGraphView} from "@/src/features/pressure-graph/PressureGraphView";

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
                <AppBox sx={{display: "flex", flexDirection: {xs: "column", sm: "row"}, justifyContent: "space-between", gap: 1}}>
                    <AppTypography variant="body2" color="text.secondary">{profile.move.character.name}</AppTypography>
                    <Link href={`/okis/${profile.id}/edit`} style={{textDecoration: "none"}}><AppButton type="button" variant="outlined" color="secondary" sx={{width: {xs: "100%", sm: "auto"}}}>Edit oki</AppButton></Link>
                </AppBox>

                <SummaryStrip profile={profile} />

                {profile.setups.map((setup, index) => <SetupCard key={setup.id} setup={setup} index={index} ender={profile.move} />)}
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

function SetupCard({setup, index, ender}: {setup: OkiSetup; index: number; ender: OkiMoveRef}) {
    const finalNodes = setup.nodes.filter((node) => node.optionType);
    const graph = React.useMemo(() => okiSetupToGraph(setup, ender), [ender, setup]);

    return (
        <SectionCard title={`Setup ${index + 1}`} tone="raised" variant={setup.fakeNoBackroll || setup.fakeBackroll ? "finalize" : "review"}>
            <FactRail facts={[
                {label: "Access", value: setup.usesDriveRush ? "Drive Rush required" : "Meterless"},
                {label: "Timing", value: setup.autoTimed ? "Auto-timed" : "Manual"},
                setup.cornerOnly ? {label: "Position", value: "Corner only"} : null,
            ].filter((fact): fact is FactItem => fact !== null)} compact />

            {setup.moderationState !== "approved" ? (
                <InlineNotice severity={setup.moderationState === "pending_review" ? "info" : "warning"}>
                    {setup.moderationState === "pending_review" ? "Pending moderation. Only you and moderators can see this setup." : `${setup.moderationState === "rejected" ? "Rejected" : "Hidden"}${setup.moderationReason ? `: ${setup.moderationReason}` : "."}`}
                </InlineNotice>
            ) : null}

            <RecoveryWarnings setup={setup} />

            <PressureGraphView graph={graph} ariaLabel={`Setup ${index + 1} graph`} />

            {finalNodes.length > 0 ? (
                <AppBox sx={{display: "grid", gap: 1}}>
                    <AppTypography variant="subtitle2" sx={{fontWeight: 800}}>Options available</AppTypography>
                    {finalNodes.map((node) => <OptionPanel key={node.id} node={node} />)}
                </AppBox>
            ) : null}
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
                <AppTypography key={warning} variant="body2" sx={{fontWeight: 900, color: "fgc.feedback.errorText", textTransform: "uppercase", letterSpacing: 0.25}}>{warning}</AppTypography>
            ))}
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
                    <AppTypography variant="body2" sx={{fontWeight: 760, color: fact.danger ? "fgc.feedback.errorText" : "text.primary", lineHeight: 1.25}}>{fact.value}</AppTypography>
                </AppBox>
            ))}
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
            <AppTypography variant="body2" sx={{fontWeight: 820, color: danger ? "fgc.feedback.errorText" : "text.secondary"}}>{title}</AppTypography>
            {items.map((item) => <AppTypography key={item.id} variant="body2">{item.character ? `${item.character.name}: ` : ""}{item.defensiveMove.numpadNotation}</AppTypography>)}
        </AppBox>
    );
}
