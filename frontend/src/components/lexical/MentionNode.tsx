/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {Chip} from "@mui/material";
import React, {ReactNode} from "react";
import {
    $applyNodeReplacement, DecoratorNode,
    type DOMConversionMap,
    type DOMConversionOutput,
    type DOMExportOutput,
    type EditorConfig,
    type LexicalNode,
    type NodeKey,
    type SerializedTextNode,
    type Spread,
    TextNode,
} from "lexical";

export type SerializedMentionNode = Spread<{
    mentionName: string;
},
    SerializedTextNode>;

function $convertMentionElement(domNode: HTMLElement): DOMConversionOutput | null {
    const textContent = domNode.textContent;
    const mentionName = domNode.getAttribute("data-lexical-mention-name");

    if (textContent !== null) {
        const node = $createMentionNode(
            typeof mentionName === "string" ? mentionName : textContent,
            textContent
        );
        return {node};
    }

    return null;
}

export class MentionNode extends DecoratorNode<ReactNode> {
    __mention: string;
    __text: string | undefined;

    static getType(): string {
        return "custom_mention";
    }

    static clone(node: MentionNode): MentionNode {
        return new MentionNode(node.__mention, node.__text, node.__key);
    }

    static importJSON(serializedNode: SerializedMentionNode): MentionNode {
        return $createMentionNode(serializedNode.mentionName).updateFromJSON(serializedNode);
    }

    constructor(mentionName: string, text?: string, key?: NodeKey) {
        console.log("Creating the Mention!");
        super(key); // Ensure text and key are properly passed
        console.log("Created?? the Mention!");
        this.__mention = mentionName;
        this.__text = text;
    }

    exportJSON(): SerializedMentionNode {
        return {
            ...super.exportJSON(),
            mentionName: this.__mention,
        };
    }

    createDOM(config: EditorConfig): HTMLElement {
        console.log("Create DOM");
        const dom = document.createElement("span");
        dom.className = "mention";

        // Create MUI Chip inside the span
        const chipContainer = document.createElement("span");
        chipContainer.innerHTML = `<span id="mention-chip-${this.__key}"></span>`;
        dom.appendChild(chipContainer);

        return dom;
    }

    updateDOM(): false {
        return false;
    }

    exportDOM(): DOMExportOutput {
        console.log("Export DOM");
        const element = document.createElement("span");
        element.setAttribute("data-lexical-mention", "true");
        if (this.__text !== this.__mention) {
            element.setAttribute("data-lexical-mention-name", this.__mention);
        }
        element.textContent = `@${this.__mention}`;
        return {element};
    }

    static importDOM(): DOMConversionMap | null {
        return {
            span: (domNode: HTMLElement) => {
                if (!domNode.hasAttribute("data-lexical-mention")) {
                    return null;
                }
                return {
                    conversion: $convertMentionElement,
                    priority: 1,
                };
            },
        };
    }

    decorate() {
        return (
            <Chip
                label={`${this.__mention}`}
                size="small"
                variant="outlined"
                color="primary"
                data-lexical-mention="true"
            />
        );
    }
}

export function $createMentionNode(mentionName: string, textContent?: string): MentionNode {
    const mentionNode = new MentionNode(mentionName, textContent ?? mentionName);

    return $applyNodeReplacement(mentionNode);
}

export function $isMentionNode(node: LexicalNode | null | undefined): node is MentionNode {
    return node instanceof MentionNode;
}
