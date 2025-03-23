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

    constructor(rows, columns, values, key?: NodeKey) {
        super(key);
        this.rows = rows;
        this.columns = columns;
        this.values = values;
        this.setRows = this.setRows.bind(this);
        this.setColumns = this.setColumns.bind(this);
        this.setValues = this.setValues.bind(this);
    }

    static getType() {
        return "scenario-table";
    }

    static clone(node) {
        return new ScenarioTableNode(node.rows, node.columns, node.values, node.__key);
    }

    createDOM() {
        const div = document.createElement("div");
        div.className = "lexical-scenario-table";
        return div;
    }

    updateDOM() {
        return false;
    }

    decorate() {

        console.log("_VALUES");
        console.log(Object.getOwnPropertyDescriptor(this, "values"));
        return (
            <ScenarioTableComponent
                initialRows={this.rows}
                initialColumns={this.columns}
                initialValues={this.values}
                updateRows={this.setRows}
                updateColumns={this.setColumns}
                updateValues={this.setValues}
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
            key: this.__key
        };
    }

    static importJSON(serializedNode: SerializedLexicalNode) {
        console.log("AQUI ES DONDE SE LIA?");
        return $createScenarioTableNode(
            serializedNode.rows,
            serializedNode.columns,
            serializedNode.values
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
    
    isInline() {
        return false; // This is a block-level element
    }

    isSelectable() {
        return true; // This makes the node selectable as a whole
    }
}

export function $createScenarioTableNode(rows, columns, values) {
    const tableNode = new ScenarioTableNode(rows, columns, values);
    return $applyNodeReplacement(tableNode);
}

export function $isScenarioTableNode(
    node: LexicalNode | null | undefined,
): node is ScenarioTableNode {
    return node instanceof ScenarioTableNode;
}
