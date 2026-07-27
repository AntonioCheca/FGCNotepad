import {AppBox} from "@/src/components/ui/AppBox";
import {AppTypography} from "@/src/components/ui/AppTypography";
import type {ComboDetailView, ComboRequirement} from "@/src/types/combo";

interface ComboReadOnlySummaryProps {
    combo: ComboDetailView;
}

const conditionLabels: Array<{key: keyof ComboRequirement; label: string}> = [
    {key: "counter_hit_required", label: "Counter Hit required"},
    {key: "punish_counter_required", label: "Punish Counter required"},
    {key: "corner_required", label: "Corner required"},
    {key: "airborne_required", label: "Opponent airborne required"},
    {key: "mid_screen_required", label: "Mid-screen required"},
    {key: "not_crouching_required", label: "Opponent not crouching"},
];

function hasValue(value: number | string): boolean {
    return value !== "-" && String(value).trim() !== "";
}

function formatResource(value: number | string, unit: "bars" | "meter"): string {
    return hasValue(value) ? `${value} ${unit}` : `0 ${unit}`;
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

    return (
        <AppBox
            sx={{
                display: "grid",
                gap: 0.75,
                px: {xs: 1.1, md: 1.35},
                py: {xs: 1, md: 1.2},
                border: "1px solid",
                borderColor: "fgc.border.default",
                borderRadius: 1.5,
                backgroundColor: "fgc.surface.base",
            }}
        >
            <AppTypography variant="h5" sx={{fontWeight: 700}}>{combo.title}</AppTypography>
            <AppBox component="ul" sx={{m: 0, pl: 2.4, display: "grid", gap: 0.45}}>
                <li>
                    <AppTypography variant="body2">Season: {combo.seasonLabels.length > 0 ? combo.seasonLabels.join(", ") : "-"}</AppTypography>
                </li>
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
