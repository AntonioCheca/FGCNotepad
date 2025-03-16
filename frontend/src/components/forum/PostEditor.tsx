import {useState, useEffect} from "react";
import {TextField, Button, Paper, Stack} from "@mui/material";
import {LexicalComposer} from "@lexical/react/LexicalComposer";
import {RichTextPlugin} from "@lexical/react/LexicalRichTextPlugin";
import {ContentEditable} from "@lexical/react/LexicalContentEditable";
import {HistoryPlugin} from "@lexical/react/LexicalHistoryPlugin";
import {AutoFocusPlugin} from '@lexical/react/LexicalAutoFocusPlugin';
import {LexicalErrorBoundary} from '@lexical/react/LexicalErrorBoundary';
import {CodeNode} from '@lexical/code';
import {LinkNode} from '@lexical/link';
import {ListNode, ListItemNode} from '@lexical/list';
import {HeadingNode, QuoteNode} from '@lexical/rich-text';
import {HorizontalRuleNode} from '@lexical/react/LexicalHorizontalRuleNode';
import {TRANSFORMERS} from '@lexical/markdown';
import {MarkdownShortcutPlugin} from '@lexical/react/LexicalMarkdownShortcutPlugin';
import RestoreFromLocalStoragePlugin from "@/src/components/lexical/RestoreFromLocalStoragePlugin";
import MentionMovePlugin from "@/src/components/lexical/MentionMovePlugin";
import {MentionNode} from "@/src/components/lexical/MentionNode"

interface PostEditorProps {
    onSubmit: (title: string, body: string) => void;
}

const theme = {
    paragraph: "editor-paragraph"
};

function onError(error) {
    console.error(error);
}

export default function PostEditor({onSubmit}: PostEditorProps) {
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const initialConfig = {
        namespace: 'MyEditor',
        theme,
        onError,
        nodes: [
            HorizontalRuleNode,
            CodeNode,
            LinkNode,
            ListNode,
            ListItemNode,
            HeadingNode,
            QuoteNode,
            MentionNode,
        ],
        text: 'Enter text',
    };

    useEffect(() => {
        const savedTitle = localStorage.getItem("postDraftTitle");
        if (savedTitle) setTitle(savedTitle);
        const savedBody = localStorage.getItem("postDraftBody");
        if (savedBody) setBody(savedBody);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(title, body);
    };

    return (
        <Paper elevation={3} sx={{p: 3}}>
            <Stack spacing={2} component="form" onSubmit={handleSubmit}>
                <TextField
                    label="Post Title"
                    value={title}
                    onChange={(e) => {
                        setTitle(e.target.value);
                        localStorage.setItem("postDraftTitle", e.target.value);
                    }}
                    fullWidth
                    required
                />
                <LexicalComposer initialConfig={initialConfig}>
                    <RichTextPlugin
                        contentEditable={
                            <ContentEditable className="outline-none p-2 w-full min-h-[150px]"/>
                        }
                        ErrorBoundary={LexicalErrorBoundary}
                    />
                    <MarkdownShortcutPlugin transformers={TRANSFORMERS}/>
                    <MentionMovePlugin/>
                    <HistoryPlugin/>
                    <RestoreFromLocalStoragePlugin/>
                    <AutoFocusPlugin/>
                </LexicalComposer>
                <Button type="submit" variant="contained" color="primary">
                    Submit Post
                </Button>
            </Stack>
        </Paper>
    );
}
