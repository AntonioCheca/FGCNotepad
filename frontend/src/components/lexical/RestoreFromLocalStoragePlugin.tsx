import {useLocalStorage} from 'react-use'
import {useState, useEffect, useCallback} from "react";
import {OnChangePlugin} from '@lexical/react/LexicalOnChangePlugin'
import {useLexicalComposerContext} from "@lexical/react/LexicalComposerContext";
import {$generateHtmlFromNodes, $generateNodesFromDOM} from '@lexical/html';
import {EditorState} from 'lexical';
import {$createParagraphNode, $getRoot} from 'lexical';

function RestoreFromLocalStoragePlugin() {
    const [editor] = useLexicalComposerContext()
    const [serializedEditorState, setSerializedEditorState] = useLocalStorage<string | null>('postDraftBody', null)
    const [isFirstRender, setIsFirstRender] = useState(true)

    useEffect(() => {
        if (isFirstRender) {
            setIsFirstRender(false);
            if (serializedEditorState) {
                editor.update(() => {
                    const parser = new DOMParser();
                    const dom = parser.parseFromString(serializedEditorState, 'text/html');

                    const nodes = $generateNodesFromDOM(editor, dom);

                    // Clear the root and insert the parsed nodes
                    const root = $getRoot();
                    root.clear();

                    if (nodes.length > 0) {
                        root.append(...nodes);
                    } else {
                        // Ensure there's at least an empty paragraph
                        root.append($createParagraphNode());
                    }
                });
            }
        }
    }, [isFirstRender, serializedEditorState, editor])

    const onChange = useCallback(
        (editorState: EditorState) => {
            if (editor) {
                editor.read(() => {
                    const html = $generateHtmlFromNodes(editor);
                    console.log("HTML CREATED");
                    console.log(html)
                    setSerializedEditorState(html);
                });
            }
        },
        [setSerializedEditorState]
    )

    // TODO: add ignoreSelectionChange
    return <OnChangePlugin onChange={onChange}/>
}

export default RestoreFromLocalStoragePlugin;