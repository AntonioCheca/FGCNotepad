import React from "react";

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
    );
}
