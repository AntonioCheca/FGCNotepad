import {
    DecoratorNode, SerializedLexicalNode,
    type NodeKey, $applyNodeReplacement, LexicalNode,
} from "lexical";
import React from "react";
import {LexicalMatrixEditorShell} from "@/src/features/matrix/editor";
import {deserializeMatrixPayload} from "@/src/features/matrix/serialization/deserializeMatrixPayload";
import {createDefaultMatrixPayload} from "@/src/features/matrix/serialization/serializeMatrixPayload";
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
        this.setMatrix = this.setMatrix.bind(this);
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
        div.style.display = "block";
        div.style.width = "100%";
        div.style.maxWidth = "100%";
        div.style.minWidth = "0";
        div.style.overflowX = "hidden";
        div.style.boxSizing = "border-box";
        return div;
    }

    updateDOM() {
        return false;
    }

    decorate() {
        return (
            <LexicalMatrixEditorShell
                matrix={this.__matrix}
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

    setMatrix(matrix: MatrixPayload): void {
        const self = this.getWritable();
        self.__matrix = matrix;
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
