import { useCallback, useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $createParagraphNode, $getNodeByKey } from 'lexical';

export function useScenarioTableEditor(nodeKey: string) {
    const [editor] = useLexicalComposerContext();

    const handleDelete = useCallback(() => {
        editor.update(() => {
            const node = $getNodeByKey(nodeKey);
            if (node) {
                node.remove();
            }
        });
    }, [editor, nodeKey]);

    const handleBottomAreaClick = useCallback((event: React.MouseEvent) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const isBottomArea = event.clientY > rect.bottom - 20;

        if (isBottomArea) {
            editor.update(() => {
                const node = $getNodeByKey(nodeKey);
                if (node) {
                    const nextSibling = node.getNextSibling();
                    if (nextSibling) {
                        nextSibling.selectStart();
                    } else {
                        const paragraph = $createParagraphNode();
                        node.insertAfter(paragraph);
                        paragraph.selectStart();
                    }
                    const previousSibling = node.getPreviousSibling();
                    if (previousSibling) {
                        previousSibling.selectStart();
                    } else {
                        const paragraph = $createParagraphNode();
                        node.insertBefore(paragraph);
                        paragraph.selectStart();
                    }
                }
            });
        }
    }, [editor, nodeKey]);

    useEffect(() => {
        editor.update(() => {
            const node = $getNodeByKey(nodeKey);
            if (node) {
                const nextSibling = node.getNextSibling();
                if (!nextSibling) {
                    const paragraph = $createParagraphNode();
                    node.insertAfter(paragraph);
                }
            }
        });
    }, [editor, nodeKey]);

    return {
        handleDelete,
        handleBottomAreaClick
    };
}
