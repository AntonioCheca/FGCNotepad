import { useState, useCallback } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

export interface ScenarioTableState {
    rows: string[];
    columns: string[];
    values: number[][];
    rowFrequencies: (number | string)[];
    columnFrequencies: (number | string)[];
    expectedValue: number;
}

export interface ScenarioTableActions {
    setAndUpdateRows: (rows: string[]) => void;
    setAndUpdateColumns: (columns: string[]) => void;
    setAndUpdateValues: (values: number[][]) => void;
    setAndUpdateRowFrequencies: (frequencies: (number | string)[]) => void;
    setAndUpdateColumnFrequencies: (frequencies: (number | string)[]) => void;
    setAndUpdateExpectedValue: (value: number) => void;
}

interface UseScenarioTableStateProps {
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

    const setAndUpdateValues = useCallback((values: number[][]) => {
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

    const state: ScenarioTableState = {
        rows,
        columns,
        values,
        rowFrequencies,
        columnFrequencies,
        expectedValue
    };

    const actions: ScenarioTableActions = {
        setAndUpdateRows,
        setAndUpdateColumns,
        setAndUpdateValues,
        setAndUpdateRowFrequencies,
        setAndUpdateColumnFrequencies,
        setAndUpdateExpectedValue
    };

    return [state, actions];
}
