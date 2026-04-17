import React from "react";
import {useLexicalComposerContext} from "@lexical/react/LexicalComposerContext";

import {useScenarioTableEditor} from "@/hooks/useScenarioTableEditor";
import {MatrixPayload} from "@/src/types/matrixPayload";
import {MatrixEditorShell} from "./MatrixEditorShell";

interface LexicalMatrixEditorShellProps {
    matrix: MatrixPayload;
    nodeKey: string;
}

export function LexicalMatrixEditorShell({matrix, nodeKey}: LexicalMatrixEditorShellProps) {
    const [editor] = useLexicalComposerContext();
    const {handleDelete, handleMatrixChange} = useScenarioTableEditor(nodeKey);
    const [editable, setEditable] = React.useState<boolean>(() => editor.isEditable());

    React.useEffect(() => {
        setEditable(editor.isEditable());
        return editor.registerEditableListener((nextEditable) => {
            setEditable(nextEditable);
        });
    }, [editor]);

    return (
        <MatrixEditorShell
            matrix={matrix}
            editable={editable}
            onMatrixChange={handleMatrixChange}
            onDelete={handleDelete}
        />
    );
}
