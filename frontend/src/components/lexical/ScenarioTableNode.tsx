import {
    DecoratorNode, SerializedLexicalNode,
    type NodeKey, $applyNodeReplacement, LexicalNode,
} from "lexical";
import React from "react";
import ScenarioTableComponent from "@/src/components/lexical/ScenarioTableComponent";
import {deserializeMatrixPayload, toEditorState} from "@/src/features/matrix/serialization/deserializeMatrixPayload";
import {createDefaultMatrixPayload, serializeMatrixPayload} from "@/src/features/matrix/serialization/serializeMatrixPayload";
import {MatrixPayload} from "@/src/types/matrixPayload";

interface SerializedScenarioTableNode extends SerializedLexicalNode {
    type: "scenario-table";
    version: 1;
    matrix: unknown;
}

export class ScenarioTableNode extends DecoratorNode<React.ReactNode> {
    __matrix: MatrixPayload;

    constructor(matrix: MatrixPayload, key?: NodeKey) {
        super(key);
        this.__matrix = matrix;

        this.setRows = this.setRows.bind(this);
        this.setColumns = this.setColumns.bind(this);
        this.setValues = this.setValues.bind(this);
        this.setRowFrequencies = this.setRowFrequencies.bind(this);
        this.setColumnFrequencies = this.setColumnFrequencies.bind(this);
        this.setExpectedValue = this.setExpectedValue.bind(this);
    }

    static getType() {
        return "scenario-table";
    }

    static clone(node) {
        return new ScenarioTableNode(
            node.__matrix,
            node.__key);
    }

    createDOM() {
        const div = document.createElement("div");
        div.className = "scenario-table";
        div.setAttribute('contenteditable', 'false');
        return div;
    }

    updateDOM() {
        return false;
    }

    decorate() {
        const editorState = toEditorState(this.__matrix);

        return (
            <ScenarioTableComponent
                initialRows={editorState.rows}
                initialColumns={editorState.columns}
                initialValues={editorState.values}
                initialRowFrequencies={editorState.rowFrequencies}
                initialColumnFrequencies={editorState.columnFrequencies}
                initialExpectedValue={editorState.expectedValue}
                updateRows={this.setRows}
                updateColumns={this.setColumns}
                updateValues={this.setValues}
                updateRowFrequencies={this.setRowFrequencies}
                updateColumnFrequencies={this.setColumnFrequencies}
                updateExpectedValue={this.setExpectedValue}
                nodeKey={this.__key}
            />
        );
    }

    exportJSON(): SerializedScenarioTableNode {
        return {
            ...super.exportJSON(),
            version: 1,
            matrix: this.__matrix,
            type: "scenario-table",
        };
    }

    static importJSON(serializedNode: SerializedScenarioTableNode) {
        const result = deserializeMatrixPayload(serializedNode.matrix);
        return $createScenarioTableNode(result.payload).updateFromJSON(serializedNode);
    }

    private updateMatrixFromEditorState(nextState: {
        rows?: string[];
        columns?: string[];
        values?: Array<Array<number | string | null | undefined>>;
        rowFrequencies?: Array<number | string | null | undefined>;
        columnFrequencies?: Array<number | string | null | undefined>;
        expectedValue?: number | string | null;
    }): void {
        const currentMatrix = this.getLatest().__matrix;
        const currentEditorState = toEditorState(currentMatrix);

        const nextPayload = serializeMatrixPayload({
            rows: nextState.rows ?? currentEditorState.rows,
            columns: nextState.columns ?? currentEditorState.columns,
            values: nextState.values ?? currentEditorState.values,
            rowFrequencies: nextState.rowFrequencies ?? currentEditorState.rowFrequencies,
            columnFrequencies: nextState.columnFrequencies ?? currentEditorState.columnFrequencies,
            expectedValue: nextState.expectedValue ?? currentEditorState.expectedValue,
            metadata: currentMatrix.metadata,
            extensions: currentMatrix.extensions,
        });

        const self = this.getWritable();
        self.__matrix = nextPayload;
    }

    setRows(rows: string[]) {
        this.updateMatrixFromEditorState({rows});
    }

    getRows() {
        return this.getLatest().__matrix.axes.rows;
    }

    setColumns(columns: string[]) {
        this.updateMatrixFromEditorState({columns});
    }

    getColumns() {
        return this.getLatest().__matrix.axes.columns;
    }

    setValues(values: Array<Array<number | string | null | undefined>>) {
        this.updateMatrixFromEditorState({values});
    }

    getValues() {
        return toEditorState(this.getLatest().__matrix).values;
    }

    getRowFrequencies() {
        return toEditorState(this.getLatest().__matrix).rowFrequencies;
    }

    setRowFrequencies(frequencies: Array<number | string | null | undefined>) {
        this.updateMatrixFromEditorState({rowFrequencies: frequencies});
    }

    getColumnFrequencies() {
        return toEditorState(this.getLatest().__matrix).columnFrequencies;
    }

    setColumnFrequencies(frequencies: Array<number | string | null | undefined>) {
        this.updateMatrixFromEditorState({columnFrequencies: frequencies});
    }

    getExpectedValue() {
        return toEditorState(this.getLatest().__matrix).expectedValue;
    }

    setExpectedValue(expectedValue: number | string | null) {
        this.updateMatrixFromEditorState({expectedValue});
    }

    isInline() {
        return false; // This is a block-level element
    }

    isSelectable() {
        return true; // This makes the node selectable as a whole
    }
}

export function $createScenarioTableNode(matrix?: MatrixPayload) {
    const tableNode = new ScenarioTableNode(matrix ?? createDefaultMatrixPayload());
    return $applyNodeReplacement(tableNode);
}

export function $isScenarioTableNode(
    node: LexicalNode | null | undefined,
): node is ScenarioTableNode {
    return node instanceof ScenarioTableNode;
}
