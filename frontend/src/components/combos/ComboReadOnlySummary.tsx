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

    const specificRequirement = requirements.requirement_specific_character;
    if (specificRequirement?.object_name) {
        const status = specificRequirement.status_required;
        lines.push(`${specificRequirement.object_name}${status !== undefined ? ` = ${String(status)}` : ""}`);
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
