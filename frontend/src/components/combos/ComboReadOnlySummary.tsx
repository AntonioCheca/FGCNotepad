import {AppBox} from "@/src/components/ui/AppBox";
import {AppChip} from "@/src/components/ui/AppChip";
import {AppTypography} from "@/src/components/ui/AppTypography";
import type {ComboDetailView, ComboRequirement} from "@/src/types/combo";

interface ComboReadOnlySummaryProps {
    combo: ComboDetailView;
}

const conditionLabels: Array<{key: keyof ComboRequirement; label: string}> = [
    {key: "counter_hit_required", label: "Counter Hit required"},
    {key: "punish_counter_required", label: "Punish Counter required"},
    {key: "perfect_parry_required", label: "Perfect Parry starter"},
    {key: "corner_required", label: "Corner required"},
    {key: "airborne_required", label: "Opponent airborne required"},
    {key: "not_crouching_required", label: "Opponent not crouching"},
    {key: "side_switches_required", label: "Side switches required"},
];

function hasValue(value: number | string): boolean {
    return value !== "-" && String(value).trim() !== "";
}

function formatResource(value: number | string, unit: "bars" | "meter"): string {
    return hasValue(value) ? `${value} ${unit}` : `0 ${unit}`;
}

function formatOptionalDrive(value: number | string): string {
    return hasValue(value) ? `${value} bars` : "-";
}

function getComboNotation(combo: ComboDetailView): string {
    return combo.steps
        .map((step) => step.child_sequence_notation ?? step.child_sequence_name ?? "")
        .map((notation) => notation.trim())
        .filter((notation) => notation.length > 0)
        .join(" > ");
}

function getConditionLines(requirements: ComboRequirement | null): string[] {
    if (!requirements) {
        return [];
    }

    const lines = conditionLabels
        .filter(({key}) => Boolean(requirements[key]))
        .map(({label}) => label);

    const objectStates = requirements.combo_object_states ?? (requirements.requirement_specific_character ? [requirements.requirement_specific_character] : []);
    for (const objectState of objectStates) {
        if (!objectState.object_name) {
            continue;
        }

        const parts = [];
        if (objectState.status_required !== undefined && objectState.status_required !== null) {
            parts.push(`requires ${String(objectState.status_required)}`);
        }
        if (objectState.consumed) {
            parts.push("consumes");
        }
        if (objectState.added_relative !== undefined && objectState.added_relative !== null) {
            parts.push(`adds +${String(objectState.added_relative)}`);
        }
        if (objectState.added_absolute !== undefined && objectState.added_absolute !== null) {
            parts.push(`ends at ${String(objectState.added_absolute)}`);
        }

        lines.push(`${objectState.object_name}${parts.length > 0 ? `: ${parts.join(", ")}` : ""}`);
    }

    return lines;
}

export function ComboReadOnlySummary({combo}: ComboReadOnlySummaryProps) {
    const conditionLines = getConditionLines(combo.requirements);
    const comboNotation = getComboNotation(combo);

    return (
        <AppBox
            sx={{
                display: "grid",
                gap: {xs: 0.85, md: 0.75},
                px: {xs: 1.1, md: 1.35},
                py: {xs: 1, md: 1.2},
                border: "1px solid",
                borderColor: "fgc.border.default",
                borderRadius: 1.5,
                backgroundColor: "fgc.surface.base",
                minWidth: 0,
            }}
        >
            <AppTypography variant="h5" sx={{fontWeight: 700, overflowWrap: "anywhere"}}>{combo.title}</AppTypography>
            <AppBox sx={{display: {xs: "grid", md: "none"}, gap: 0.75, minWidth: 0}}>
                {comboNotation ? (
                    <AppTypography variant="body2" sx={{fontFamily: "'IBM Plex Mono', 'Consolas', monospace", fontWeight: 700, overflowWrap: "anywhere"}}>
                        {comboNotation}
                    </AppTypography>
                ) : null}
                <AppBox sx={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0.65}}>
                    <MobileFact label="Damage" value={combo.damage} />
                    <MobileFact label="Spacing" value={combo.spacing?.name ?? "Unclassified"} />
                    <MobileFact label="Drive Used" value={formatResource(combo.driveCost, "bars")} />
                    <MobileFact label="Super Used" value={formatResource(combo.superCost, "meter")} />
                    <MobileFact label="Min Drive" value={formatOptionalDrive(combo.minimumDriveCost)} />
                    <MobileFact label="Safe Drive" value={formatOptionalDrive(combo.minimumDriveCostNoBurnout)} />
                </AppBox>
                <AppBox sx={{display: "flex", gap: 0.45, flexWrap: "wrap"}}>
                    <AppChip size="small" variant="outlined" label={`Season ${combo.seasonLabels.length > 0 ? combo.seasonLabels.join(", ") : "-"}`} />
                    <AppChip size="small" variant="outlined" label={`Gain D ${formatResource(combo.driveGain, "bars")}`} />
                    <AppChip size="small" variant="outlined" label={`Gain S ${formatResource(combo.superGain, "meter")}`} />
                    {conditionLines.length > 0 ? <AppChip size="small" color="info" variant="outlined" label={`${conditionLines.length} condition${conditionLines.length === 1 ? "" : "s"}`} /> : null}
                </AppBox>
                {combo.spacing?.code === "punish_tip" ? (
                    <AppTypography variant="caption" color="text.secondary">
                        Punish tip: extended hurtbox punishment, farther than normal tip range.
                    </AppTypography>
                ) : null}
                {conditionLines.length > 0 ? (
                    <AppBox sx={{display: "grid", gap: 0.35, p: 0.8, borderRadius: 1.25, backgroundColor: "fgc.surface.sunken"}}>
                        {conditionLines.map((line) => (
                            <AppTypography key={line} variant="caption" sx={{overflowWrap: "anywhere"}}>{line}</AppTypography>
                        ))}
                    </AppBox>
                ) : null}
                {combo.description.trim() ? <AppTypography variant="body2" color="text.secondary" sx={{overflowWrap: "anywhere"}}>{combo.description}</AppTypography> : null}
            </AppBox>
            <AppBox component="ul" sx={{m: 0, pl: 2.4, display: {xs: "none", md: "grid"}, gap: 0.45}}>
                <li>
                    <AppTypography variant="body2">Season: {combo.seasonLabels.length > 0 ? combo.seasonLabels.join(", ") : "-"}</AppTypography>
                </li>
                {comboNotation ? (
                    <li>
                        <AppTypography variant="body2">Notation: {comboNotation}</AppTypography>
                    </li>
                ) : null}
                <li>
                    <AppTypography variant="body2">Spacing: {combo.spacing?.name ?? "Unclassified"}</AppTypography>
                </li>
                {combo.spacing?.code === "punish_tip" ? (
                    <li>
                        <AppTypography variant="body2" color="text.secondary">
                            The starter connects because the punished move has an extended hurtbox. This is farther than the starter&apos;s normal tip range.
                        </AppTypography>
                    </li>
                ) : null}
                {conditionLines.map((line) => (
                    <li key={line}>
                        <AppTypography variant="body2">{line}</AppTypography>
                    </li>
                ))}
                <li>
                    <AppTypography variant="body2">Damage: {combo.damage}</AppTypography>
                </li>
                <li>
                    <AppTypography variant="body2">
                        Resources used: Drive: {formatResource(combo.driveCost, "bars")}, Super: {formatResource(combo.superCost, "meter")}
                    </AppTypography>
                </li>
                <li>
                    <AppTypography variant="body2">
                        Drive requirements: Min: {formatOptionalDrive(combo.minimumDriveCost)}, Safe: {formatOptionalDrive(combo.minimumDriveCostNoBurnout)}
                    </AppTypography>
                </li>
                <li>
                    <AppTypography variant="body2">
                        Resources gained: Drive: {formatResource(combo.driveGain, "bars")}, Super: {formatResource(combo.superGain, "meter")}
                    </AppTypography>
                </li>
                {combo.description.trim() ? (
                    <li>
                        <AppTypography variant="body2">Description: {combo.description}</AppTypography>
                    </li>
                ) : null}
            </AppBox>
        </AppBox>
    );
}

function MobileFact({label, value}: {label: string; value: string | number}) {
    return (
        <AppBox sx={{display: "grid", gap: 0.1, minWidth: 0}}>
            <AppTypography variant="caption" color="text.secondary" sx={{fontWeight: 700}}>{label}</AppTypography>
            <AppTypography variant="body2" sx={{fontWeight: 750, overflowWrap: "anywhere"}}>{value}</AppTypography>
        </AppBox>
    );
}
