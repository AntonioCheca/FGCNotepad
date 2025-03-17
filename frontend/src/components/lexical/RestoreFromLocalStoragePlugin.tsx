import {useLocalStorage} from 'react-use';
import {useState, useEffect, useCallback} from 'react';
import {OnChangePlugin} from '@lexical/react/LexicalOnChangePlugin';
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {$generateHtmlFromNodes, $generateNodesFromDOM} from '@lexical/html';
import {EditorState} from 'lexical';
import {$createParagraphNode, $getRoot} from 'lexical';

/**
 * Loads saved HTML content into the editor from a given string.
 * Ensures the editor starts with a valid state even if the string is empty.
 */
const loadEditorContent = (editor: any, htmlString: string) => {
    if (htmlString) {
        try {
            editor.update(() => {
                const parser = new DOMParser();
                const dom = parser.parseFromString(htmlString, 'text/html');

                const nodes = $generateNodesFromDOM(editor, dom);
                const root = $getRoot();

                root.clear();

                if (nodes.length > 0) {
                    root.append(...nodes);
                } else {
                    root.append($createParagraphNode()); // Ensure there's at least one paragraph
                }
            });
        } catch (error) {
            console.error("Error while updating the editor:", error);
        }
    }
};

/**
 * Handles saving the editor content to local storage on change.
 */
const useEditorSaveToStorage = (storageKey: string) => {
    const [editor] = useLexicalComposerContext();

    return useCallback(
        (editorState: EditorState) => {
            editor.read(() => {
                const html = $generateHtmlFromNodes(editor);
                console.log("SAVING HTML", html);
                localStorage.setItem(storageKey, html);
            });
        },
        [editor]
    );
};

/**
 * Plugin to load content from a given HTML string on first render.
 */
function LoadFromHtmlStringPlugin({htmlString}: { htmlString: string }) {
    const [editor] = useLexicalComposerContext();
    const [isFirstRender, setIsFirstRender] = useState(true);

    useEffect(() => {
        if (isFirstRender) {
            setIsFirstRender(false);
            loadEditorContent(editor, htmlString);
        }
    }, [isFirstRender, htmlString, editor]);

    return null; // No need for OnChangePlugin since we are not saving changes
}

/**
 * Plugin to restore editor content from local storage on initial render
 * and save updates to storage on changes.
 */
function RestoreFromLocalStoragePlugin() {
    const [editor] = useLexicalComposerContext();
    const onChange = useEditorSaveToStorage('postDraftBody');

    useEffect(() => {
        console.log(localStorage.getItem('postDraftBody'));
        loadEditorContent(editor, localStorage.getItem('postDraftBody') ?? '');
    }, [editor]);

    return <OnChangePlugin onChange={onChange}/>;
}

export {RestoreFromLocalStoragePlugin, LoadFromHtmlStringPlugin};
