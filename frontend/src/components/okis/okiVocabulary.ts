import type {PressureEdgeKind, PressureMarker} from "@/src/features/pressure-graph/pressureGraphTypes";
import type {OkiAction, OkiHitLevel, OkiRecovery, OkiStepType} from "@/src/types/oki";

export const OKI_ACTION_LABELS: Record<OkiAction, string> = {
    BLOCK: "Block",
    SHIMMY: "Shimmy",
    WALK_FORWARD: "Walk Forward",
    WALK_BACKWARD: "Walk Backward",
    NEUTRAL_JUMP: "Neutral Jump",
    FORWARD_JUMP: "Forward Jump",
    BACK_JUMP: "Back Jump",
    BACKDASH: "Back Dash",
};
export const OKI_ACTIONS = Object.keys(OKI_ACTION_LABELS) as OkiAction[];

export const OKI_STEP_LABELS: Record<OkiStepType, string> = {
    IMMEDIATE: "Immediate",
    DELAY: "Delay",
};
export const OKI_STEP_TYPES = Object.keys(OKI_STEP_LABELS) as OkiStepType[];

// A deliberately fake oki route is a hard read on a passive opponent, so oki arrows have no "fake" kind.
export const OKI_EDGE_KINDS: PressureEdgeKind[] = ["normal", "confirm", "read"];

export interface OkiNodeFacts {
    hitLevel: OkiHitLevel | null;
    sideSwitch: boolean;
}

export interface OkiLinkFacts {
    safeJump: boolean;
    recovery: OkiRecovery | null;
}

export function okiNodeMarkers(node: OkiNodeFacts): PressureMarker[] {
    const markers: PressureMarker[] = [];
    if (node.hitLevel) {
        markers.push(node.hitLevel === "LOW" ? "low" : "overhead");
    }
    if (node.sideSwitch) {
        markers.push("sideSwitch");
    }

    return markers;
}

export function okiLinkMarkers(link: OkiLinkFacts): PressureMarker[] {
    const markers: PressureMarker[] = [];
    if (link.safeJump) {
        markers.push("safeJump");
    }
    if (link.recovery) {
        markers.push(link.recovery === "BACKROLL" ? "backroll" : "riseInPlace");
    }

    return markers;
}

export function okiStepCaption(stepType: OkiStepType): string | null {
    return stepType === "DELAY" ? OKI_STEP_LABELS.DELAY : null;
}

// Jumping attacks are the moves whose numpad notation starts with an up direction (8 or 9); only steps into one can be safe jumps.
export function isJumpingAttack(notation: string | null | undefined): boolean {
    return /^[89]/.test(notation?.trim() ?? "");
}

// Frame data attack levels: L = low, M = overhead (must block standing), H = mid. Multi-hit levels use the first hit.
export function hitLevelFromAttackLevel(attackLevel: string | null | undefined): OkiHitLevel | null {
    const first = attackLevel?.trim().charAt(0);
    if (first === "L") {
        return "LOW";
    }

    return first === "M" ? "OVERHEAD" : null;
}
