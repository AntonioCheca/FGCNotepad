import {useEffect, useState, useContext} from "react";
import {useRouter} from "next/router";
import {Container, Typography, CircularProgress, Paper} from "@mui/material";
import AuthContext from "@/services/AuthContext";
import PostEditor from "@/src/components/forum/PostEditor";
import {getSpecificMove, getSpecificPost} from "@/services/api";

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
    const safeUuid = typeof uuid === "string" ? uuid : undefined;

    useEffect(() => {
        if (!router.isReady || !safeUuid || !user?.token) {
            setLoading(false);
            return;
        }


        const fetchAndSetPostData = async (postId) => {
            try {
                const data = await getSpecificPost(postId);
                setPost(data);
            } catch (error) {
                console.error("Error fetching move data", error);
            } finally {
                setLoading(false);
            }
        };

        setLoading(true);
        fetchAndSetPostData(safeUuid);
        setLoading(false);
    }, [router.isReady, safeUuid, user?.token]);

    if (loading) return <CircularProgress sx={{display: "block", margin: "auto", mt: 4}}/>;
    if (error) return <Typography color="error">Error: {error}</Typography>;
    if (!post) return <Typography>No post found.</Typography>;

    return (
        <Container maxWidth="md" sx={{mt: 4}}>
            <Typography variant="h4" gutterBottom>
                {post.title}
            </Typography>
            <PostEditor onSubmit={null} initialTitle={post.title} initialBody={post.body} editable={false}/>
        </Container>
    );
}
