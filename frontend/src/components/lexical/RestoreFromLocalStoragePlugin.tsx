import {useState, useEffect, useCallback} from 'react';
import {OnChangePlugin} from '@lexical/react/LexicalOnChangePlugin';
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import type {EditorState, LexicalEditor} from 'lexical';

interface LoadFromJsonStringPluginProps {
    jsonString: unknown;
}

const loadEditorContent = (editor: LexicalEditor, jsonString: unknown): void => {
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

const useEditorSaveToStorage = (storageKey: string) => {
    return useCallback(
        (editorState: EditorState) => {
            try {
                const json = JSON.stringify(editorState);
                localStorage.setItem(storageKey, json);
            } catch (error) {
                console.error("Error while saving editor state to localStorage:", error);
            }
        },
        [storageKey]
    );
};

function LoadFromJsonStringPlugin({jsonString}: LoadFromJsonStringPluginProps) {
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
