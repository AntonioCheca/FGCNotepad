import React from "react";
import ReactMarkdown from "react-markdown";
import {Paper, Typography} from "@mui/material";

interface MarkdownPreviewProps {
    content: string;
}

export default function MarkdownPreview({content}: MarkdownPreviewProps) {
    return (
        <Paper elevation={2} sx={{p: 2, mt: 2}}>
            <Typography variant="subtitle1" gutterBottom>
                Preview:
            </Typography>
            <ReactMarkdown>{content}</ReactMarkdown>
        </Paper>
    );
}
