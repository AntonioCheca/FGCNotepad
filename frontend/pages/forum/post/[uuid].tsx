import {useEffect, useState, useContext} from "react";
import {useRouter} from "next/router";
import {Container, Typography, CircularProgress, Paper} from "@mui/material";
import DOMPurify from "dompurify";
import AuthContext from "@/services/AuthContext";

interface Post {
    id: string;
    title: string;
    body: string;
}

export default function PostPage() {
    const router = useRouter();
    const {uuid} = router.query;
    const [post, setPost] = useState<Post | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const authContext = useContext(AuthContext);
    if (!authContext) {
        throw new Error("AuthContext must be used within an AuthProvider");
    }

    const {user} = authContext;

    // Ensure uuid is a string (router.query types can be string | string[] | undefined)
    const safeUuid = ((typeof uuid) === "string") ? uuid : undefined;

    useEffect(() => {
        if (!router.isReady) return;  // Ensure the router is ready before accessing query params

        if (!safeUuid || !user?.token) {
            setLoading(false);
            return;
        }

        setLoading(true);
        fetch(`/api/posts/${safeUuid}?markdown_parse=true`, {
            headers: {
                Authorization: `Bearer ${user.token}`,
                "Content-Type": "application/json",
            },
        })
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
                console.error("Error fetching post:", err);
                setError(err.message);
                setLoading(false);
            });
    }, [router.isReady, safeUuid, user?.token]); // ✅ Include `router.isReady` as a dependency

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
                    dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(post.body)}}
                />
            </Paper>
        </Container>
    );
}
