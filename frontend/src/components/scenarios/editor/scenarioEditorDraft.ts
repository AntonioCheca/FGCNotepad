import {ScenarioCharacterStatusPayload, ScenarioPositionLock, ScenarioType} from "@/hooks/useScenarios";
import {createDefaultMatrixPayload} from "@/src/features/matrix/serialization/serializeMatrixPayload";
import type {MatrixPayload} from "@/src/types/matrixPayload";
import type {MoveOption, ScenarioEditorState, ScenarioFormDraft} from "./scenarioEditorTypes";

export const DEFAULT_COMBO_CONTEXT = {
    positionLock: "viewer_default_midscreen",
    characterStatuses: [],
} satisfies ScenarioEditorState["comboContext"];

export function createInitialScenarioEditorState(initialValue?: Partial<ScenarioEditorState>): ScenarioEditorState {
    return {
        name: initialValue?.name ?? "",
        scenarioType: initialValue?.scenarioType ?? "oki",
        defenderCharacterId: initialValue?.defenderCharacterId ?? "",
        attackerCharacterId: initialValue?.attackerCharacterId ?? "",
        triggerMove: initialValue?.triggerMove ?? null,
        triggerMoveQuery: initialValue?.triggerMoveQuery ?? "",
        matrix: initialValue?.matrix ?? createDefaultMatrixPayload(),
        comboContext: initialValue?.comboContext ?? DEFAULT_COMBO_CONTEXT,
    };
}

export function getScenarioDraftStorageKey(currentScenarioId: string | null): string {
    return `scenarioDraft:${currentScenarioId ?? "new"}`;
}

function isScenarioType(value: unknown): value is ScenarioType {
    return value === "oki" || value === "blockstun" || value === "aggregated_oki";
}

function isMoveOption(value: unknown): value is MoveOption {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return false;
    }

    const record = value as Record<string, unknown>;
    return typeof record.id === "string" && typeof record.summary === "string" && typeof record.characterId === "string";
}

function isMatrixPayload(value: unknown): value is MatrixPayload {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return false;
    }

    const record = value as Record<string, unknown>;
    const axes = record.axes as {rows?: unknown} | undefined;

    return record.kind === "matrix-editor" && Array.isArray(axes?.rows) && Array.isArray(record.cells);
}

function isPositionLock(value: unknown): value is ScenarioPositionLock {
    return value === "viewer_default_midscreen" || value === "corner" || value === "midscreen";
}

export function parseComboContext(value: unknown): ScenarioEditorState["comboContext"] {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return DEFAULT_COMBO_CONTEXT;
    }

    const record = value as Record<string, unknown>;
    const statuses = Array.isArray(record.characterStatuses)
        ? record.characterStatuses
            .map((status) => {
                if (!status || typeof status !== "object" || Array.isArray(status)) {
                    return null;
                }

                const statusRecord = status as Record<string, unknown>;
                const objectName = statusRecord.object_name;
                const statusRequired = statusRecord.status_required;
                if (typeof objectName !== "string" || (typeof statusRequired !== "string" && typeof statusRequired !== "number" && typeof statusRequired !== "boolean")) {
                    return null;
                }

                return {object_name: objectName, status_required: statusRequired} satisfies ScenarioCharacterStatusPayload;
            })
            .filter((status): status is ScenarioCharacterStatusPayload => status !== null)
        : [];

    return {
        positionLock: isPositionLock(record.positionLock) ? record.positionLock : "viewer_default_midscreen",
        characterStatuses: statuses,
    };
}

export function parseScenarioFormDraft(value: string | null): ScenarioFormDraft | null {
    if (!value) {
        return null;
    }

    try {
        const parsed = JSON.parse(value) as Record<string, unknown>;
        if (!isScenarioType(parsed.scenarioType) || !isMatrixPayload(parsed.matrix)) {
            return null;
        }

        return {
            name: typeof parsed.name === "string" ? parsed.name : "",
            scenarioType: parsed.scenarioType,
            defenderCharacterId: typeof parsed.defenderCharacterId === "string" ? parsed.defenderCharacterId : "",
            attackerCharacterId: typeof parsed.attackerCharacterId === "string" ? parsed.attackerCharacterId : "",
            triggerMove: isMoveOption(parsed.triggerMove) ? parsed.triggerMove : null,
            triggerMoveQuery: typeof parsed.triggerMoveQuery === "string" ? parsed.triggerMoveQuery : "",
            matrix: parsed.matrix,
            comboContext: parseComboContext(parsed.comboContext),
        };
    } catch {
        return null;
    }
}

export function serializeScenarioFormDraft(state: ScenarioEditorState): string {
    return JSON.stringify(state satisfies ScenarioFormDraft);
}
