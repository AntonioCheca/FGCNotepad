import PostEditor from "@/src/components/forum/PostEditor";
import {createPost} from "@/services/api";
import {Container, Typography} from "@mui/material";

export default function CreatePostPage() {
    const handleSubmit = async (title: string, body: string) => {
        const response = await createPost(title, body);
        if (response.ok) {
            alert("Post created successfully!");
        }
    };

    return (
        <Container maxWidth="md" sx={{mt: 4}}>
            <Typography variant="h4" gutterBottom>
                Create a New Post
            </Typography>
            <PostEditor onSubmit={handleSubmit}/>
        </Container>
    );
}
