import type React from "react";

import {AppBox} from "@/src/components/ui/AppBox";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {HelpTip} from "@/src/components/ui/tactical/HelpTip";
import type {ComboDetailView} from "@/src/types/combo";
import {buildComboConditions, conditionsNotInTitle} from "./requirements/comboConditions";
import {ComboConditionText} from "./requirements/ComboConditionText";
import {DriveGainGauge, SuperGainGauge} from "./resources/ResourceGainGauges";
import {parseGaugeValue} from "./resources/resourceGauge";

// Every combo needs at least 0.1 Drive to avoid burnout, so that value says nothing about this combo.
const SAFE_DRIVE_BASELINE = 0.1;

interface ComboReadOnlySummaryProps {
    combo: ComboDetailView;
}

function aboveBaseline(value: number | string, baseline: number): number | null {
    const parsed = parseGaugeValue(value);
    return parsed !== null && parsed > baseline ? parsed : null;
}

function getComboNotation(combo: ComboDetailView): string {
    return combo.steps
        .map((step) => step.child_sequence_notation ?? step.child_sequence_name ?? "")
        .map((notation) => notation.trim())
        .filter((notation) => notation.length > 0)
        .join(" > ");
}

function bars(value: number): string {
    return `${value} ${value === 1 ? "bar" : "bars"}`;
}

function joinParts(parts: Array<string | null>): string | null {
    const present = parts.filter((part): part is string => part !== null);
    return present.length > 0 ? present.join(", ") : null;
}

export function ComboReadOnlySummary({combo}: ComboReadOnlySummaryProps) {
    const conditions = conditionsNotInTitle(buildComboConditions(combo.requirements), combo.displayTitle);
    const comboNotation = getComboNotation(combo);
    const driveUsed = aboveBaseline(combo.driveCost, 0);
    const superUsed = aboveBaseline(combo.superCost, 0);
    const minimumDrive = aboveBaseline(combo.minimumDriveCost, 0);
    const safeDrive = aboveBaseline(combo.minimumDriveCostNoBurnout, SAFE_DRIVE_BASELINE);
    const resourcesUsed = joinParts([driveUsed !== null ? `Drive ${bars(driveUsed)}` : null, superUsed !== null ? `Super ${bars(superUsed)}` : null]);
    const driveRequirements = joinParts([minimumDrive !== null ? `Min ${bars(minimumDrive)}` : null, safeDrive !== null ? `Safe ${bars(safeDrive)}` : null]);

    return (
        <AppBox sx={{display: "grid", gap: 1.25, minWidth: 0}}>
            <AppBox sx={{display: "grid", gap: 0.35, minWidth: 0}}>
                <AppTypography variant="h5" sx={{fontWeight: 700, overflowWrap: "anywhere"}}>{combo.displayTitle}</AppTypography>
                {conditions.length > 0 ? (
                    <AppBox sx={{typography: "body2", color: "text.secondary", fontWeight: 600}}>
                        <ComboConditionText conditions={conditions} />
                    </AppBox>
                ) : null}
            </AppBox>

            <AppBox component="dl" sx={{display: "grid", gridTemplateColumns: {xs: "minmax(84px, auto) minmax(0, 1fr)", md: "150px minmax(0, 1fr)"}, columnGap: 1.5, rowGap: 0.75, m: 0, alignItems: "center"}}>
                {comboNotation ? <SummaryRow label="Notation"><AppBox component="span" sx={{fontFamily: "'IBM Plex Mono', 'Consolas', monospace", fontWeight: 700, overflowWrap: "anywhere"}}>{comboNotation}</AppBox></SummaryRow> : null}
                <SummaryRow label="Spacing">
                    <AppBox component="span" sx={{display: "inline-flex", alignItems: "center", gap: 0.5}}>
                        {combo.spacing?.name ?? "Unclassified"}
                        {combo.spacing?.code === "punish_tip" ? <HelpTip text="The starter connects because the punished move has an extended hurtbox, farther than the starter's normal tip range." /> : null}
                    </AppBox>
                </SummaryRow>
                <SummaryRow label="Damage">{combo.damage}</SummaryRow>
                {resourcesUsed ? <SummaryRow label="Resources used">{resourcesUsed}</SummaryRow> : null}
                {driveRequirements ? <SummaryRow label="Drive needed">{driveRequirements}</SummaryRow> : null}
                <SummaryRow label="Drive gain"><DriveGainGauge value={parseGaugeValue(combo.driveGain) ?? 0} /></SummaryRow>
                <SummaryRow label="Super gain"><SuperGainGauge value={parseGaugeValue(combo.superGain) ?? 0} /></SummaryRow>
                {combo.seasonLabels.length > 0 ? <SummaryRow label="Season">{combo.seasonLabels.join(", ")}</SummaryRow> : null}
            </AppBox>
        </AppBox>
    );
}

function SummaryRow({label, children}: {label: string; children: React.ReactNode}) {
    return (
        <>
            <AppBox component="dt" sx={{typography: "body2", color: "text.secondary", fontWeight: 700}}>{label}</AppBox>
            <AppBox component="dd" sx={{typography: "body2", m: 0, minWidth: 0}}>{children}</AppBox>
        </>
    );
}
