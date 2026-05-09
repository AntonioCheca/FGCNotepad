import {useState, useCallback} from 'react';
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';

export type ScenarioTableValue = number | string;

export interface ScenarioTableState {
    rows: string[];
    columns: string[];
    values: ScenarioTableValue[][];
    rowFrequencies: (number | string)[];
    columnFrequencies: (number | string)[];
    expectedValue: number;
    derivedMetrics?: Record<string, unknown>;
    attackerCharacterName?: string | null;
    defenderCharacterName?: string | null;
}

export interface ScenarioTableActions {
    setAndUpdateRows: (rows: string[]) => void;
    setAndUpdateColumns: (columns: string[]) => void;
    setAndUpdateValues: (values: ScenarioTableValue[][]) => void;
    setAndUpdateRowFrequencies: (frequencies: (number | string)[]) => void;
    setAndUpdateColumnFrequencies: (frequencies: (number | string)[]) => void;
    setAndUpdateExpectedValue: (value: number) => void;
    setDerivedMetrics: (metrics: Record<string, unknown>) => void;
}

interface UseScenarioTableStateProps {
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
}

export function useScenarioTableState(props: UseScenarioTableStateProps): [ScenarioTableState, ScenarioTableActions] {
    const [editor] = useLexicalComposerContext();

    const [rows, setRows] = useState(props.initialRows);
    const [columns, setColumns] = useState(props.initialColumns);
    const [values, setValues] = useState(props.initialValues);
    const [rowFrequencies, setRowFrequencies] = useState(
        props.initialRowFrequencies || Array(props.initialRows.length).fill(1 / props.initialRows.length)
    );
    const [columnFrequencies, setColumnFrequencies] = useState(
        props.initialColumnFrequencies || Array(props.initialColumns.length).fill(1 / props.initialColumns.length)
    );
    const [expectedValue, setExpectedValue] = useState(props.initialExpectedValue || 0);
    const [derivedMetrics, setDerivedMetricsState] = useState<Record<string, unknown>>({});
    const attackerCharacterName = props.attackerCharacterName ?? null;
    const defenderCharacterName = props.defenderCharacterName ?? null;

    const setAndUpdateRows = useCallback((rows: string[]) => {
        editor.update(() => {
            setRows(rows);
            props.updateRows(rows);
        });
    }, [editor, props.updateRows]);

    const setAndUpdateColumns = useCallback((columns: string[]) => {
        editor.update(() => {
            setColumns(columns);
            props.updateColumns(columns);
        });
    }, [editor, props.updateColumns]);

    const setAndUpdateValues = useCallback((values: ScenarioTableValue[][]) => {
        editor.update(() => {
            setValues(values);
            props.updateValues(values);
        });
    }, [editor, props.updateValues]);

    const setAndUpdateRowFrequencies = useCallback((rowFrequencies: (number | string)[]) => {
        editor.update(() => {
            setRowFrequencies(rowFrequencies);
            props.updateRowFrequencies(rowFrequencies);
        });
    }, [editor, props.updateRowFrequencies]);

    const setAndUpdateColumnFrequencies = useCallback((columnFrequencies: (number | string)[]) => {
        editor.update(() => {
            setColumnFrequencies(columnFrequencies);
            props.updateColumnFrequencies(columnFrequencies);
        });
    }, [editor, props.updateColumnFrequencies]);

    const setAndUpdateExpectedValue = useCallback((expectedValue: number) => {
        editor.update(() => {
            setExpectedValue(expectedValue);
            props.updateExpectedValue(expectedValue);
        });
    }, [editor, props.updateExpectedValue]);

    const setDerivedMetrics = useCallback((metrics: Record<string, unknown>) => {
        editor.update(() => {
            setDerivedMetricsState(metrics);
        });
    }, [editor]);

    const state: ScenarioTableState = {
        rows,
        columns,
        values,
        rowFrequencies,
        columnFrequencies,
        expectedValue,
        derivedMetrics,
        attackerCharacterName,
        defenderCharacterName
    };

    const actions: ScenarioTableActions = {
        setAndUpdateRows,
        setAndUpdateColumns,
        setAndUpdateValues,
        setAndUpdateRowFrequencies,
        setAndUpdateColumnFrequencies,
        setAndUpdateExpectedValue,
        setDerivedMetrics
    };

    return [state, actions];
}
