import {useEffect, useState, useContext} from "react";
import {useRouter} from "next/router";
import {Container, Typography, CircularProgress} from "@mui/material";
import AuthContext from "@/services/AuthContext";
import PostEditor from "@/src/components/forum/PostEditor";
import usePost from "@/hooks/usePosts";

interface Post {
    id: string;
    title: string;
    body: string;
    tags: string[];
}

export default function PostPage() {
    const {getSpecificPost} = usePost();
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
        if (!router.isReady || !safeUuid || !user?.token) return;

        let isMounted = true; // Prevent state updates after unmount

        const fetchAndSetPostData = async (postId: string) => {
            try {
                const data = await getSpecificPost(postId);

                if (isMounted && data) {
                    setPost(data);
                } else if (isMounted) {
                    setError("Post not found.");
                }
            } catch (error) {
                console.error("Error fetching post data", error);
                if (isMounted) setError("Failed to load post.");
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        setLoading(true);
        fetchAndSetPostData(safeUuid);

        return () => {
            isMounted = false; // Prevent updating state if unmounted
        };
    }, [router.isReady, safeUuid, user?.token]);


    if (loading) return <CircularProgress sx={{display: "block", margin: "auto", mt: 4}}/>;
    if (error) return <Typography color="error">Error: {error}</Typography>;
    if (!post) return <Typography>No post found.</Typography>;

    return (
        <Container maxWidth="md" sx={{mt: 4}}>
            <Typography variant="h4" gutterBottom>
                {post.title}
            </Typography>
            {/* Pass tags as the initialTags prop to PostEditor */}
            <PostEditor
                onSubmit={null}
                initialTitle={post.title}
                initialBody={post.body}
                initialTags={post.tags}  // Pass the tags here
                editable={false}
            />
        </Container>
    );
}
