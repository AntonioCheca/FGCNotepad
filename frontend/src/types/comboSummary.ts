import type {ComboExecutionMode} from "@/src/types/comboExecution";
import type {ComboSpacingOption} from "@/src/types/comboDraft";
import type {ComboMetricsApi, ComboRequirement} from "@/src/types/comboDetail";

export interface ComboRow {
    id: number;
    notation: string;
    moderationState: string;
    characterName: string;
    moves: string[];
    starter: string;
    ender: string;
    damage: number | string;
    resourceAdjustedDamage: number | string;
    driveCost: number | string;
    minimumDriveCost: number | string;
    minimumDriveCostNoBurnout: number | string;
    driveGain: number | string;
    superCost: number | string;
    superGain: number | string;
    season: string;
    spacing: string;
    spacingCode: string | null;
    isUsable: boolean;
    isFullyAudited: boolean;
    needsTechnicalReview: boolean;
    requirements: ComboRequirement | null;
}

interface ComboMoveSummary {
    name?: string;
}

interface ComboStepSummary {
    child_sequence_name?: string | null;
    child_sequence_notation?: string | null;
}

export interface ComboSeasonSummary {
    name?: string;
}

export interface ComboApiSummary {
    id: number;
    name?: string;
    moderationState?: string;
    executionMode?: ComboExecutionMode;
    executionNotation?: string | null;
    character?: { name?: string };
    moves?: ComboMoveSummary[];
    steps?: ComboStepSummary[];
    comboMetrics?: ComboMetricsApi;
    spacing?: ComboSpacingOption | null;
    season?: ComboSeasonSummary[];
    is_usable?: boolean;
    is_fully_audited?: boolean;
    needs_technical_review?: boolean;
    comboRequirement?: ComboRequirement | null;
}

const RAW_DRIVE_RUSH_NOTATIONS = new Set(["dr", "drive rush", "raw drive rush"]);

// Move names are "<Character> - <notation>" (e.g. "Ryu - DR"); bare notations are accepted too.
function moveNotation(moveName: string): string {
    const separatorIndex = moveName.indexOf(" - ");
    return (separatorIndex >= 0 ? moveName.slice(separatorIndex + 3) : moveName).trim();
}

function isRawDriveRush(moveName: string | undefined): boolean {
    return RAW_DRIVE_RUSH_NOTATIONS.has(moveNotation(moveName ?? "").toLowerCase());
}

/**
 * Drive Rush cannot hit, so a combo opening with Raw Drive Rush is started by the
 * next move, in Drive Rush context ("DR > 5HK"). The move sequence itself is unchanged.
 */
export function deriveComboStarter(moves: string[]): string {
    const first = moves[0];
    if (first === undefined) {
        return "-";
    }
    const next = moves[1];
    if (isRawDriveRush(first) && next !== undefined) {
        return `DR > ${moveNotation(next)}`;
    }
    return moveNotation(first);
}

/** Combo names embed Classic notation, so Modern views title the combo by its notation in that mode instead. */
export function comboDisplayTitle(combo: {name?: string; executionMode?: ComboExecutionMode; executionNotation?: string | null}): string {
    if (combo.executionMode !== undefined && combo.executionMode !== "classic" && combo.executionNotation) {
        return combo.executionNotation;
    }

    return combo.name ?? "-";
}

// Resource-adjusted damage is stored as a float (2013.6000000000004); damage is shown in whole points.
export function wholeDamage(value: number | string): number | string {
    const numeric = typeof value === "number" ? value : Number(value);

    return value !== "" && Number.isFinite(numeric) ? Math.round(numeric) : value;
}

export interface ComboSearchPage {
    items: ComboApiSummary[];
    total: number;
    page: number;
    pageSize: number;
}

export function mapComboToRow(combo: ComboApiSummary): ComboRow {
    const moveNamesFromLegacyField = combo.moves?.map((move) => move.name ?? "-") ?? [];
    const moveNamesFromSteps: string[] = [];
    for (const step of combo.steps ?? []) {
        const name = step.child_sequence_notation ?? step.child_sequence_name ?? "";
        if (name.trim() !== "") {
            moveNamesFromSteps.push(name);
        }
    }

    const moves = moveNamesFromLegacyField.length > 0 ? moveNamesFromLegacyField : moveNamesFromSteps;

    return {
        id: combo.id,
        notation: combo.executionNotation ?? comboDisplayTitle(combo),
        moderationState: combo.moderationState ?? "approved",
        characterName: combo.character?.name ?? "-",
        moves,
        starter: deriveComboStarter(moves),
        ender: moves.length > 0 ? moveNotation(moves[moves.length - 1]) : "-",
        damage: combo.comboMetrics?.damage ?? "-",
        resourceAdjustedDamage: wholeDamage(combo.comboMetrics?.resourceAdjustedDamage ?? combo.comboMetrics?.damage ?? "-"),
        driveCost: combo.comboMetrics?.driveCost ?? "-",
        minimumDriveCost: combo.comboMetrics?.minimumDriveCost ?? "-",
        minimumDriveCostNoBurnout: combo.comboMetrics?.minimumDriveCostNoBurnout ?? "-",
        driveGain: combo.comboMetrics?.driveGain ?? "-",
        superCost: combo.comboMetrics?.superCost ?? "-",
        superGain: combo.comboMetrics?.superGain ?? "-",
        season: Array.isArray(combo.season)
            ? combo.season.map((season) => season.name ?? "-").join(", ")
            : "-",
        spacing: combo.spacing?.name ?? "Unclassified",
        spacingCode: combo.spacing?.code ?? null,
        isUsable: combo.is_usable ?? true,
        isFullyAudited: combo.is_fully_audited ?? true,
        needsTechnicalReview: combo.needs_technical_review ?? false,
        requirements: combo.comboRequirement ?? null,
    };
}
