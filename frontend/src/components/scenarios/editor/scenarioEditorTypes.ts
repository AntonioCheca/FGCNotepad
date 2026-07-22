import type {
    ScenarioCharacterStatusPayload,
    ScenarioComboContextPayload,
    ScenarioPositionLock,
    ScenarioSavePayload,
    ScenarioType,
} from "@/hooks/useScenarios";
import type {MatrixLinkedCellResolution} from "@/src/features/matrix/model";
import type {MatrixDynamicComboPayload, MatrixPayload} from "@/src/types/matrixPayload";

export interface MoveOption {
    id: string;
    summary: string;
    characterId: string;
}

export interface CharacterOption {
    id: string;
    name: string;
}

export interface ScenarioStatusDefinition {
    name: string;
    status_type: "integer" | "boolean";
    max_status: number | null;
}

export interface ScenarioEditorFormProps {
    initialValue?: Partial<ScenarioSavePayload> & {triggerMoveLabel?: string | null};
    submitLabel: string;
    onSubmit: (payload: ScenarioSavePayload) => Promise<void>;
    onResolveDynamicCells?: () => Promise<MatrixPayload>;
    onResolveDynamicComboCell?: (dynamicCombo: MatrixDynamicComboPayload) => Promise<number | null>;
    currentScenarioId?: string | null;
    linkedCellResolutions?: Record<string, MatrixLinkedCellResolution>;
}

export interface ScenarioEditorState {
    name: string;
    scenarioType: ScenarioType;
    defenderCharacterId: string;
    attackerCharacterId: string;
    triggerMove: MoveOption | null;
    triggerMoveQuery: string;
    matrix: MatrixPayload;
    comboContext: ScenarioComboContextPayload;
}

export type ScenarioFormDraft = ScenarioEditorState;

export type ScenarioComboContextStatus = ScenarioCharacterStatusPayload;
export type ScenarioComboPositionLock = ScenarioPositionLock;
