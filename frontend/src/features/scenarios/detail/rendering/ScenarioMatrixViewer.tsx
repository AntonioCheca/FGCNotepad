import React from "react";

import {AppBox} from "@/src/components/ui/AppBox";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {MatrixEditorShell} from "@/src/features/matrix/editor";
import type {MatrixLinkedCellResolution} from "@/src/features/matrix/model";
import type {MatrixPayload} from "@/src/types/matrixPayload";
import type {ScenarioDetail, ScenarioLayerSolveSnapshot, ScenarioResourceContextPayload} from "@/hooks/useScenarios";

interface ScenarioMatrixViewerProps {
    scenario: ScenarioDetail;
    scenarioId: string;
    columnVisibilityByLabel: Record<string, boolean> | null;
    layerSolveSnapshots: Record<number, ScenarioLayerSolveSnapshot>;
    linkedCellResolutions: Record<string, MatrixLinkedCellResolution>;
    scenarioResources: ScenarioResourceContextPayload;
    onRefreshDynamicCells: () => Promise<MatrixPayload>;
}

export function ScenarioMatrixViewer({
    scenario,
    scenarioId,
    columnVisibilityByLabel,
    layerSolveSnapshots,
    linkedCellResolutions,
    scenarioResources,
    onRefreshDynamicCells,
}: ScenarioMatrixViewerProps) {
    return (
        <AppBox sx={{display: "grid", gap: 0.75, minWidth: 0}}>
            <AppBox sx={{display: {xs: "block", md: "none"}}}>
                <AppTypography variant="caption" color="text.secondary">Scroll the matrix sideways to review every option.</AppTypography>
            </AppBox>
            <AppBox sx={{overflowX: "auto", maxWidth: "100%", minWidth: 0}}>
                <MatrixEditorShell
                    matrix={scenario.matrix}
                    attackerCharacterName={scenario.attackerCharacterName}
                    defenderCharacterName={scenario.defenderCharacterName}
                    editable={false}
                    displayFrequenciesAsPercent
                    columnVisibilityByLabel={columnVisibilityByLabel}
                    onMatrixChange={() => {
                    }}
                    onRefreshDynamicCells={onRefreshDynamicCells}
                    layerSolveSnapshots={layerSolveSnapshots}
                    currentScenarioId={scenarioId}
                    linkedCellResolutions={linkedCellResolutions}
                    resourceContext={scenarioResources}
                />
            </AppBox>
        </AppBox>
    );
}
