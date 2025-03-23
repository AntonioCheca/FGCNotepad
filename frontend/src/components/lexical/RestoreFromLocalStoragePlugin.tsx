import {useLocalStorage} from 'react-use';
import {useState, useEffect, useCallback} from 'react';
import {OnChangePlugin} from '@lexical/react/LexicalOnChangePlugin';
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {EditorState} from 'lexical';
import {$createParagraphNode, $getRoot} from 'lexical';

/**
 * Loads saved JSON content into the editor from a given string.
 * Ensures the editor starts with a valid state even if the string is empty.
 */
const loadEditorContent = (editor, jsonString) => {
    if (jsonString) {
        try {
            const parsedJson = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
            const editorState = editor.parseEditorState(parsedJson);
            editor.setEditorState(editorState);
        } catch (error) {
            console.warn("Error while updating the editor with JSON:", error);
        }
    }
};


/**
 * Handles saving the editor content to local storage on change.
 */
const useEditorSaveToStorage = (storageKey) => {
    const [editor] = useLexicalComposerContext();

    return useCallback(
        (editorState) => {
            try {
                const json = JSON.stringify(editorState);
                console.log("DETECTING CGHANGE IN EDITOR; SAVING", json);
                localStorage.setItem(storageKey, json);
            } catch (error) {
                console.error("Error while saving editor state to localStorage:", error);
            }
        },
        [editor]
    );
};

/**
 * Plugin to load content from a given JSON string on first render.
 */
function LoadFromJsonStringPlugin({jsonString}) {
    const [editor] = useLexicalComposerContext();
    const [isFirstRender, setIsFirstRender] = useState(true);

    useEffect(() => {
        if (isFirstRender) {
            setIsFirstRender(false);
            loadEditorContent(editor, jsonString);
        }
    }, [isFirstRender, jsonString, editor]);

    return null;
}

/**
 * Plugin to restore editor content from local storage on initial render
 * and save updates to storage on changes.
 */
function RestoreFromLocalStoragePlugin() {
    const [editor] = useLexicalComposerContext();
    const onChange = useEditorSaveToStorage('postDraftBody');

    useEffect(() => {
        const storedJson = localStorage.getItem('postDraftBody');
        if (storedJson) {
            loadEditorContent(editor, storedJson);
        }
    }, [editor]);

    return <OnChangePlugin onChange={onChange}/>;
}

export {RestoreFromLocalStoragePlugin, LoadFromJsonStringPlugin};
