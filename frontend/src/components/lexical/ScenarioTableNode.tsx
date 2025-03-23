import {
    DecoratorNode, SerializedLexicalNode,
    type NodeKey, $applyNodeReplacement, LexicalNode,
} from "lexical";
import React from "react";
import ScenarioTableComponent from "@/src/components/lexical/ScenarioTableComponent";
import {array} from "yup";


export class ScenarioTableNode extends DecoratorNode<React.ReactNode> {
    rows;
    columns;
    values;
    rowFrequencies;
    columnFrequencies;
    expectedValue;

    constructor(rows, columns, values, rowFrequencies, columnFrequencies, expectedValue, key?: NodeKey) {
        super(key);
        this.rows = rows;
        this.columns = columns;
        this.values = values;
        this.rowFrequencies = rowFrequencies;
        this.columnFrequencies = columnFrequencies;
        this.expectedValue = expectedValue;

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
            node.rows,
            node.columns,
            node.values,
            node.rowFrequencies,
            node.columnFrequencies,
            node.expectedValue,
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
        return (
            <ScenarioTableComponent
                initialRows={this.rows}
                initialColumns={this.columns}
                initialValues={this.values}
                initialRowFrequencies={this.rowFrequencies}
                initialColumnFrequencies={this.columnFrequencies}
                initialExpectedValue={this.expectedValue}
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

    exportJSON(): SerializedLexicalNode {
        return {
            ...super.exportJSON(),
            version: 1,
            rows: this.rows,
            columns: this.columns,
            values: this.values,
            key: this.__key,
        };
    }

    static importJSON(serializedNode: SerializedLexicalNode) {
        return $createScenarioTableNode(
            serializedNode.rows,
            serializedNode.columns,
            serializedNode.values,
            serializedNode.rowFrequencies,
            serializedNode.columnFrequencies,
            serializedNode.expectedValue,
        ).updateFromJSON(serializedNode);
    }

    setRows(rows: array) {
        const self = this.getWritable();
        self.rows = rows;
    }

    getRows() {
        const self = this.getLatest();
        return self.rows;
    }

    setColumns(columns: array) {
        const self = this.getWritable();
        self.columns = columns;
    }

    getColumns() {
        const self = this.getLatest();
        return self.columns;
    }

    setValues(values: array) {
        const self = this.getWritable();
        self.values = values;
    }

    getValues() {
        const self = this.getLatest();
        return self.values;
    }

    getRowFrequencies() {
        return this.getLatest().rowFrequencies;
    }

    setRowFrequencies(frequencies) {
        this.getWritable().rowFrequencies = frequencies;
    }

    getColumnFrequencies() {
        return this.getLatest().columnFrequencies;
    }

    setColumnFrequencies(frequencies) {
        this.getWritable().columnFrequencies = frequencies;
    }

    getExpectedValue() {
        return this.getLatest().expectedValue;
    }

    setExpectedValue(expectedValue) {
        this.getWritable().expectedValue = expectedValue;
    }

    isInline() {
        return false; // This is a block-level element
    }

    isSelectable() {
        return true; // This makes the node selectable as a whole
    }
}

export function $createScenarioTableNode(rows, columns, values, rowFrequencies, columnFrequencies, expectedValue) {
    const tableNode = new ScenarioTableNode(rows, columns, values, rowFrequencies, columnFrequencies, expectedValue);
    return $applyNodeReplacement(tableNode);
}

export function $isScenarioTableNode(
    node: LexicalNode | null | undefined,
): node is ScenarioTableNode {
    return node instanceof ScenarioTableNode;
}
