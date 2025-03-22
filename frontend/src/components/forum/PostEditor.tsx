import {useState, useEffect} from "react";
import {TextField, Button, Paper, Stack} from "@mui/material";
import {LexicalComposer} from "@lexical/react/LexicalComposer";
import {RichTextPlugin} from "@lexical/react/LexicalRichTextPlugin";
import {ContentEditable} from "@lexical/react/LexicalContentEditable";
import {HistoryPlugin} from "@lexical/react/LexicalHistoryPlugin";
import {AutoFocusPlugin} from "@lexical/react/LexicalAutoFocusPlugin";
import {LexicalErrorBoundary} from "@lexical/react/LexicalErrorBoundary";
import {CodeNode} from "@lexical/code";
import {LinkNode} from "@lexical/link";
import {ListNode, ListItemNode} from "@lexical/list";
import {HeadingNode, QuoteNode} from "@lexical/rich-text";
import {HorizontalRuleNode} from "@lexical/react/LexicalHorizontalRuleNode";
import {TRANSFORMERS} from "@lexical/markdown";
import {MarkdownShortcutPlugin} from "@lexical/react/LexicalMarkdownShortcutPlugin";
import {
    RestoreFromLocalStoragePlugin,
    LoadFromJsonStringPlugin
} from "@/src/components/lexical/RestoreFromLocalStoragePlugin";
import MentionMovePlugin from "@/src/components/lexical/MentionMovePlugin";
import {MentionNode} from "@/src/components/lexical/MentionNode";
import TagList from "@/src/components/forum/TagList";

interface PostEditorProps {
    onSubmit: (title: string, body: string, tags: string[]) => void;
    initialTitle: string;
    initialBody: string;
    initialTags: string[];
    editable: boolean;
}

const theme = {
    paragraph: "editor-paragraph"
};

function onError(error: Error) {
    console.error(error);
}

export default function PostEditor({
                                       onSubmit,
                                       initialTitle = "",
                                       initialBody = "",
                                       initialTags = [],
                                       editable = true
                                   }: PostEditorProps) {
    const [title, setTitle] = useState(initialTitle);
    const [body, setBody] = useState(initialBody);
    const [tags, setTags] = useState<string[]>(initialTags);

    const initialConfig = {
        namespace: "MyEditor",
        theme,
        onError,
        nodes: [
            HorizontalRuleNode,
            CodeNode,
            LinkNode,
            ListNode,
            ListItemNode,
            HeadingNode,
            MentionNode,
            QuoteNode
        ],
        editable: editable
    };

    useEffect(() => {
        if (editable) {
            const savedTitle = localStorage.getItem("postDraftTitle");
            const savedBody = localStorage.getItem("postDraftBody");
            if (savedTitle) setTitle(savedTitle);
            if (savedBody) setBody(savedBody);
        }
    }, []);

    const handlePostSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(title, body, tags);
    };

    const handleTagUpdate = (updatedTags: string[]) => {
        setTags(updatedTags);
    };

    return (
        <Paper elevation={3} sx={{p: 3}}>
            <form onSubmit={handlePostSubmit}>
                <Stack spacing={2}>
                    {editable && (
                        <TextField
                            label="Post title"
                            value={title}
                            onChange={(e) => {
                                setTitle(e.target.value);
                                localStorage.setItem("postDraftTitle", e.target.value);
                            }}
                            fullWidth
                            required
                        />
                    )}

                    <LexicalComposer initialConfig={initialConfig}>
                        <RichTextPlugin
                            contentEditable={
                                <ContentEditable
                                    className="outline-none p-2 w-full min-h-[150px]"
                                    style={{fontSize: "16px", lineHeight: "1.8", fontFamily: "Arial, sans-serif"}}
                                />
                            }
                            ErrorBoundary={LexicalErrorBoundary}
                        />
                        <MarkdownShortcutPlugin transformers={TRANSFORMERS}/>
                        <MentionMovePlugin/>
                        <HistoryPlugin/>
                        {editable ? <RestoreFromLocalStoragePlugin/> :
                            <LoadFromJsonStringPlugin jsonString={initialBody ?? body}/>}
                        <AutoFocusPlugin/>
                    </LexicalComposer>

                    {/* Render TagList separately */}
                    <TagList tags={tags} onTagsChange={handleTagUpdate} editable={editable}/>

                    {editable && (
                        <Button type="submit" variant="contained" color="primary">
                            Submit Post
                        </Button>
                    )}
                </Stack>
            </form>
        </Paper>
    );
}
