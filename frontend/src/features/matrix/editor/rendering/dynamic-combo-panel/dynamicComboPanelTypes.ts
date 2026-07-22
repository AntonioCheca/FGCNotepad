import type {MatrixDynamicComboData} from "@/src/features/matrix/model";

export type DynamicComboPresentation = "modal" | "inline";
export type StarterContextPreset = "normal" | "punish_counter" | "counter_hit";

export interface DynamicComboPanelProps {
    open: boolean;
    initialValue: MatrixDynamicComboData | null;
    moveLabelById: Record<string, string>;
    presentation?: DynamicComboPresentation;
    resetKey?: string;
    onClose: () => void;
    onConfirm: (value: MatrixDynamicComboData, starterLabels: Record<string, string>) => void;
}

export type DynamicComboPanelBodyProps = Omit<DynamicComboPanelProps, "open" | "resetKey">;

export interface DynamicComboCharacterOption {
    id: string;
    name: string;
}

export interface DynamicComboMoveOption {
    id: string;
    summary: string;
}

export interface DynamicComboPanelState {
    selectedCharacter: DynamicComboCharacterOption | null;
    starterQuery: string;
    starterSelections: DynamicComboMoveOption[];
    starterPreset: StarterContextPreset;
    error: string | null;
}
