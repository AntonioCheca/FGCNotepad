import React from "react";
import {useLexicalComposerContext} from "@lexical/react/LexicalComposerContext";
import {$createParagraphNode, $getRoot, $getSelection, $isRangeSelection} from "lexical";

import {$createScenarioTableNode} from "@/src/components/lexical/ScenarioTableNode";
import {AppButton} from "@/src/components/ui/AppButton";

export default function InsertScenarioTableButton() {
    const [editor] = useLexicalComposerContext();

    const handleInsertMatrix = React.useCallback(() => {
        editor.update(() => {
            const matrixNode = $createScenarioTableNode();
            const selection = $getSelection();

            if ($isRangeSelection(selection)) {
                selection.insertNodes([matrixNode]);
                const paragraph = $createParagraphNode();
                matrixNode.insertAfter(paragraph);
                paragraph.selectStart();
                return;
            }

            const root = $getRoot();
            root.append(matrixNode);
            const paragraph = $createParagraphNode();
            root.append(paragraph);
            paragraph.selectStart();
        });
    }, [editor]);

    return (
        <AppButton onClick={handleInsertMatrix} variant="outlined">
            Add Matrix Scenario
        </AppButton>
    );
}
