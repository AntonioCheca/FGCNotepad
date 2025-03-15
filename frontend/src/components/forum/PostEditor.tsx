import {useState, useEffect} from "react";
import MarkdownPreview from "@/src/components/forum/MarkdownPreview";
import MoveReferenceBlock from "@/src/components/forum/MoveReferenceBlock";
import {TextField, Button, Paper, Stack} from "@mui/material";

interface PostEditorProps {
    onSubmit: (title: string, body: string) => void;
}

export default function PostEditor({onSubmit}: PostEditorProps) {
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [blocks, setBlocks] = useState<Record<string, string>>({});

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

    const renderContentWithBlocks = (text: string) => {
        return text.split(/(\[\[.*?\]\])/g).map((part, index) => {
            const match = part.match(/^\[\[(.*?)\]\]$/);
            if (match) {
                return <MoveReferenceBlock key={index} initialMoveId={match[1]}/>;
            }
            return <span key={index}>{part}</span>; // Wrap in span to preserve inline flow
        });
    };


    return (
        <Paper elevation={3} sx={{p: 3}}>
            <Stack spacing={2} component="form" onSubmit={handleSubmit}>
                <TextField
                    label="Post Title"
                    value={title}
                    onChange={(e) => {
                        const newTitle = e.target.value;
                        setTitle(newTitle);
                        localStorage.setItem("postDraftTitle", newTitle);
                    }}
                    fullWidth
                    required
                />
                <TextField
                    label="Write your post in Markdown..."
                    value={body}
                    onChange={(e) => {
                        const newBody = e.target.value;
                        setBody(newBody);
                        localStorage.setItem("postDraftBody", newBody);
                    }}
                    multiline
                    rows={6}
                    fullWidth
                    required
                />
                {/* MarkdownPreview with embedded blocks */}
                <Paper elevation={2} sx={{p: 2}}>
                    {renderContentWithBlocks(body).map((el, idx) =>
                        typeof el === "string" ? (
                            <MarkdownPreview key={idx} content={el}/>
                        ) : (
                            el
                        )
                    )}
                </Paper>
                <Button type="submit" variant="contained" color="primary">
                    Submit Post
                </Button>
            </Stack>
        </Paper>
    );
}
