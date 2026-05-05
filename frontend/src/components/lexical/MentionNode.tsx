import React, {ReactNode} from "react";
import {
    $applyNodeReplacement, DecoratorNode,
    type DOMConversionMap,
    type DOMConversionOutput,
    type DOMExportOutput,
    type NodeKey,
    type SerializedLexicalNode,
    type Spread,
} from "lexical";
import MentionCardPopup from "@/src/components/lexical/MentionCardPopup";

export type SerializedMentionNode = Spread<{
    mentionName: string;
    idForComponent: string;
    text: string;
    detailsText: string;
},
    SerializedLexicalNode>;

function $convertMentionElement(domNode: HTMLElement): DOMConversionOutput | null {
    const mentionName = domNode.getAttribute("data-lexical-mention-name");
    const idForMove = domNode.getAttribute("data-lexical-mention-move-id");
    const text = domNode.getAttribute("data-lexical-mention-text");
    const details = domNode.getAttribute("data-lexical-mention-details");

    if (idForMove !== null && mentionName !== null) {
        const node = $createMentionNode(
            mentionName,
            idForMove,
            details ?? "",
            text ?? undefined
        );
        return {node};
    }

    return null;
}

export class MentionNode extends DecoratorNode<ReactNode> {
    __mention: string;
    __id_for_component: string;
    __text: string;
    __detailsText: string;

    static getType(): string {
        return "custom_mention";
    }

    static clone(node: MentionNode): MentionNode {
        return new MentionNode(node.__mention, node.__id_for_component, node.__text, node.__detailsText, node.__key);
    }

    static importJSON(serializedNode: SerializedMentionNode): MentionNode {
        return $createMentionNode(serializedNode.mentionName, serializedNode.idForComponent, serializedNode.text, serializedNode.detailsText).updateFromJSON(serializedNode);
    }

    constructor(mentionName: string, idForComponent: string, text?: string, detailsText?: string, key?: NodeKey) {
        super(key); // Ensure text and key are properly passed
        this.__mention = mentionName;
        this.__id_for_component = idForComponent;
        this.__text = text || "";
        this.__detailsText = detailsText || ""; // Optional details text
    }

    exportJSON(): SerializedMentionNode {
        return {
            ...super.exportJSON(),
            mentionName: this.__mention,
            idForComponent: this.__id_for_component,
            text: this.__text,
            detailsText: this.__detailsText
        };
    }

    createDOM(): HTMLElement {
        const dom = document.createElement("span");
        dom.className = "mention";
        return dom;
    }

    updateDOM(): false {
        return false;
    }

    exportDOM(): DOMExportOutput {
        const element = document.createElement("span");
        element.setAttribute("data-lexical-mention", "true");
        if (this.__id_for_component) {
            element.setAttribute("data-lexical-mention-name", this.__mention);
            element.setAttribute("data-lexical-mention-move-id", this.__id_for_component);
            element.setAttribute("data-lexical-mention-text", this.__text);
            element.setAttribute("data-lexical-mention-details", this.__detailsText);
        }
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
            <MentionCardPopup
                mentionName={this.__mention}
                moveId={this.__id_for_component}
                previewText={`Preview of @${this.__mention}`}
                detailsText={this.__detailsText}
            />
        );
    }
}

export function $createMentionNode(mentionName: string, idForMove: string, detailsText: string, textContent?: string): MentionNode {
    const mentionNode = new MentionNode(mentionName, idForMove, textContent ?? mentionName, detailsText);
    return $applyNodeReplacement(mentionNode);
}
