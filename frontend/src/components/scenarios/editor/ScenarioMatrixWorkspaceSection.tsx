import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppChip} from "@/src/components/ui/AppChip";
import {ActionBar} from "@/src/components/ui/tactical/ActionBar";
import {SectionCard} from "@/src/components/ui/tactical/SectionCard";
import {MatrixEditorShell} from "@/src/features/matrix/editor";
import type {MatrixLinkedCellResolution} from "@/src/features/matrix/model";
import type {MatrixDynamicComboPayload, MatrixPayload} from "@/src/types/matrixPayload";
import type {ScenarioType} from "@/hooks/useScenarios";

interface ScenarioMatrixWorkspaceSectionProps {
    scenarioType: ScenarioType;
    matrix: MatrixPayload;
    selectedAttackerName: string | null;
    selectedDefenderName: string | null;
    resolvingDynamicCells: boolean;
    submitting: boolean;
    currentScenarioId: string | null;
    linkedCellResolutions?: Record<string, MatrixLinkedCellResolution>;
    onMatrixChange: (matrix: MatrixPayload) => void;
    onResolveDynamicCells?: () => Promise<MatrixPayload>;
    onResolveDynamicComboCell?: (dynamicCombo: MatrixDynamicComboPayload) => Promise<number | null>;
    onRefreshDynamicCellsClick: () => Promise<void>;
}

export function ScenarioMatrixWorkspaceSection({
    scenarioType,
    matrix,
    selectedAttackerName,
    selectedDefenderName,
    resolvingDynamicCells,
    submitting,
    currentScenarioId,
    linkedCellResolutions,
    onMatrixChange,
    onResolveDynamicCells,
    onResolveDynamicComboCell,
    onRefreshDynamicCellsClick,
}: ScenarioMatrixWorkspaceSectionProps) {
    return (
        <SectionCard
            title="Matrix Workspace"
            tone="raised"
            variant="review"
        >
            <ActionBar>
                <AppChip size="small" variant="outlined" label={scenarioType === "aggregated_oki" ? "Aggregated columns locked" : "Standard matrix editing"} />
                <AppButton type="button" variant="outlined" color="secondary" disabled={!onResolveDynamicCells || resolvingDynamicCells || submitting} onClick={() => void onRefreshDynamicCellsClick()}>
                    {onResolveDynamicCells
                        ? (resolvingDynamicCells ? "Refreshing Dynamic Combos..." : "Refresh Dynamic Combos")
                        : "Refresh Dynamic Combos (Save First)"}
                </AppButton>
            </ActionBar>

            <AppBox sx={{p: {xs: 0.75, md: 0.9}, borderRadius: 1.5, border: "1px solid", borderColor: "fgc.border.default", backgroundColor: "fgc.surface.sunken"}}>
                <MatrixEditorShell
                    matrix={matrix}
                    attackerCharacterName={selectedAttackerName}
                    defenderCharacterName={selectedDefenderName}
                    onMatrixChange={onMatrixChange}
                    editable={true}
                    allowColumnStructureEdit={scenarioType !== "aggregated_oki"}
                    allowColumnAxisLabelEdit={scenarioType !== "aggregated_oki"}
                    allowColumnLayerEdit={scenarioType !== "aggregated_oki"}
                    onRefreshDynamicCells={onResolveDynamicCells}
                    onResolveDynamicComboCell={onResolveDynamicComboCell}
                    displayFrequenciesAsPercent
                    currentScenarioId={currentScenarioId}
                    linkedCellResolutions={linkedCellResolutions}
                />
            </AppBox>
        </SectionCard>
    );
}
