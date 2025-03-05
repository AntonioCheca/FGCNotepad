import {useEffect, useState} from "react";
import {useRouter} from "next/router";
import {Container, Typography, CircularProgress, Paper} from "@mui/material";
import DOMPurify from "dompurify";

interface Uuid {
    id: string;
    title: string;
    body: string;
}

export default function PostPage() {
    const router = useRouter();
    const {uuid} = router.query;
    const [post, setPost] = useState<Uuid | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!uuid) return;

        fetch(`/api/posts/${uuid}?markdown_parse=true`)
            .then((res) => {
                if (!res.ok) {
                    throw new Error("Failed to fetch post");
                }
                return res.json();
            })
            .then((data) => {
                setPost(data);
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message);
                setLoading(false);
            });
    }, [uuid]);

    if (loading) return <CircularProgress sx={{display: "block", margin: "auto", mt: 4}}/>;
    if (error) return <Typography color="error">Error: {error}</Typography>;
    if (!post) return <Typography>No post found.</Typography>;

    return (
        <Container maxWidth="md" sx={{mt: 4, display: "flex", justifyContent: "center"}}>
            <Paper elevation={3} sx={{p: 4, width: "100%", maxWidth: "800px"}}>
                <Typography variant="h3" gutterBottom>
                    {post.title}
                </Typography>
                <Typography
                    variant="body1"
                    component="div"
                    dangerouslySetInnerHTML={{__html: post.body}}
                />
            </Paper>
        </Container>
    );
}
