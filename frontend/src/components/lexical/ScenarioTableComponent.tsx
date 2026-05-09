import React from "react";
import {type ScenarioTableValue, useScenarioTableState} from "@/hooks/useScenarioTableState";
import {ScenarioTableService} from "@/services/ScenarioTableService";
import {GameSolverService} from "@/services/GameSolverService";
import useSolverGames from "@/hooks/useSolverGame";
import {ScenarioTableLayout} from "@/src/components/lexical/ScenarioTable/ScenarioTableLayout";
import {ScenarioTableControls} from "@/src/components/lexical/ScenarioTable/ScenarioTableControls";
import {ScenarioTable} from "@/src/components/lexical/ScenarioTable/ScenarioTable";

interface ScenarioTableComponentProps {
    initialRows: string[];
    initialColumns: string[];
    initialValues: ScenarioTableValue[][];
    initialRowFrequencies?: (number | string)[];
    initialColumnFrequencies?: (number | string)[];
    initialExpectedValue?: number;
    attackerCharacterName?: string | null;
    defenderCharacterName?: string | null;
    updateRows: (rows: string[]) => void;
    updateColumns: (columns: string[]) => void;
    updateValues: (values: ScenarioTableValue[][]) => void;
    updateRowFrequencies: (frequencies: (number | string)[]) => void;
    updateColumnFrequencies: (frequencies: (number | string)[]) => void;
    updateExpectedValue: (value: number) => void;
    onDelete?: () => void;
    onBottomAreaClick?: () => void;
}


function ScenarioTableComponent(props: ScenarioTableComponentProps) {
    const [state, actions] = useScenarioTableState(props);
    const {solveGame} = useSolverGames();

    // Create service instances
    const tableService = new ScenarioTableService(state, actions);
    const gameSolverService = new GameSolverService(state, actions, solveGame);

    return (
        <ScenarioTableLayout onBottomAreaClick={props.onBottomAreaClick}>
            <ScenarioTableControls
                onDelete={props.onDelete}
                onSolveGame={() => gameSolverService.solveOptimalStrategy()}
            />
            <ScenarioTable
                state={state}
                tableService={tableService}
                attackerCharacterName={props.attackerCharacterName}
                defenderCharacterName={props.defenderCharacterName}
            />
        </ScenarioTableLayout>
    );
}

export default ScenarioTableComponent;
