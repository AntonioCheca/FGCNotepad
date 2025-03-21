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
import {
    RestoreFromLocalStoragePlugin,
    LoadFromJsonStringPlugin
} from "@/src/components/lexical/RestoreFromLocalStoragePlugin";
import MentionMovePlugin from "@/src/components/lexical/MentionMovePlugin";
import {MentionNode} from "@/src/components/lexical/MentionNode"
import TagInput from "@/src/components/forum/TagInput";
import TagList from "@/src/components/forum/TagList";

interface PostEditorProps {
    onSubmit: (title: string, body: string, tags) => void;
    initialTitle: string,
    initialBody: string,
    editable: boolean
}

const theme = {
    paragraph: "editor-paragraph"
};

function onError(error) {
    console.error(error);
}

export default function PostEditor({
                                       onSubmit,
                                       initialTitle = '',
                                       initialBody = '',
                                       initialTags = [],
                                       editable = true
                                   }: PostEditorProps) {
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
        editable: editable,
    };

    useEffect(() => {
        if (editable) {
            const savedTitle = localStorage.getItem("postDraftTitle");
            if (savedTitle) {
                setTitle(savedTitle);
            }
            const savedBody = localStorage.getItem("postDraftBody");
            if (savedBody) {
                setBody(savedBody);
            }
        } else {
            setBody(initialBody);
            setTitle(initialTitle);
        }
    }, []);
    const [tags, setTags] = useState<string[]>(initialTags);  // Initialize from props

    const handleAddTag = (tag: string) => {
        if (!tags.includes(tag)) {
            setTags([...tags, tag]);
        }
    };

    const handleDeleteTag = (tagToDelete: string) => {
        setTags(tags.filter(tag => tag !== tagToDelete));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const savedBody = localStorage.getItem('postDraftBody');
        onSubmit(title, savedBody, tags);  // Ensure tags are included in submission
    };

    return (
        <Paper elevation={3} sx={{p: 3}}>
            <Stack spacing={2} component="form" onSubmit={handleSubmit}>
                {editable && <TextField
                    label="Post title"
                    value={title}
                    onChange={(e) => {
                        setTitle(e.target.value);
                        localStorage.setItem("postDraftTitle", e.target.value);
                    }}
                    fullWidth
                    required
                />}
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
                <TagList tags={tags} onDeleteTag={handleDeleteTag} onAddTag={handleAddTag} editable={editable}/>
                {editable && <Button type="submit" variant="contained" color="primary">
                    Submit Post
                </Button>}
            </Stack>
        </Paper>
    );
}

