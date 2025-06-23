import React from "react";
import { useScenarioTableState } from "@/hooks/useScenarioTableState";
import { useScenarioTableEditor } from "@/hooks/useScenarioTableEditor";
import { ScenarioTableService } from "@/services/ScenarioTableService";
import { GameSolverService } from "@/services/GameSolverService";
import useSolverGames from "@/hooks/useSolverGame";
import { ScenarioTableLayout } from "@/src/components/lexical/ScenarioTable/ScenarioTableLayout";
import { ScenarioTableControls } from "@/src/components/lexical/ScenarioTable/ScenarioTableControls";
import { ScenarioTable } from "@/src/components/lexical/ScenarioTable/ScenarioTable";

interface ScenarioTableComponentProps {
    initialRows: string[];
    initialColumns: string[];
    initialValues: number[][];
    initialRowFrequencies?: (number | string)[];
    initialColumnFrequencies?: (number | string)[];
    initialExpectedValue?: number;
    updateRows: (rows: string[]) => void;
    updateColumns: (columns: string[]) => void;
    updateValues: (values: number[][]) => void;
    updateRowFrequencies: (frequencies: (number | string)[]) => void;
    updateColumnFrequencies: (frequencies: (number | string)[]) => void;
    updateExpectedValue: (value: number) => void;
    nodeKey: string;
}

function ScenarioTableComponent(props: ScenarioTableComponentProps) {
    const [state, actions] = useScenarioTableState(props);
    const { handleDelete, handleBottomAreaClick } = useScenarioTableEditor(props.nodeKey);
    const { solveGame } = useSolverGames();

    // Create service instances
    const tableService = new ScenarioTableService(state, actions);
    const gameSolverService = new GameSolverService(state, actions, solveGame);

    return (
        <ScenarioTableLayout onBottomAreaClick={handleBottomAreaClick}>
            <ScenarioTableControls
                onDelete={handleDelete}
                onSolveGame={() => gameSolverService.solveOptimalStrategy()}
            />
            <ScenarioTable
                state={state}
                tableService={tableService}
            />
        </ScenarioTableLayout>
    );
}

export default ScenarioTableComponent;
