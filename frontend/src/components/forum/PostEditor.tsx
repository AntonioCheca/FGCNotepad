import {useState, useEffect} from "react";
import MarkdownPreview from "@/src/components/forum/MarkdownPreview";
import {TextField, Button, Paper, Stack} from "@mui/material";

interface PostEditorProps {
    onSubmit: (title: string, body: string) => void;
}

export default function PostEditor({onSubmit}: PostEditorProps) {
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");


    useEffect(() => {
        // Restore draft on page load
        const savedTitle = localStorage.getItem("postDraftTitle");
        const savedBody = localStorage.getItem("postDraftBody");

        if (savedTitle) setTitle(savedTitle);
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
                    onChange={
                        (e) => {
                            setTitle(e.target.value);
                            localStorage.setItem("postDraftTitle", title);
                        }
                    }
                    fullWidth
                    required
                />
                <TextField
                    label="Write your post in Markdown..."
                    value={body}
                    onChange={
                        (e) => {
                            setBody(e.target.value);
                            localStorage.setItem("postDraftBody", body);
                        }
                    }
                    multiline
                    rows={6}
                    fullWidth
                    required
                />
                <MarkdownPreview content={body}/>
                <Button type="submit" variant="contained" color="primary">
                    Submit Post
                </Button>
            </Stack>
        </Paper>
    );
}
