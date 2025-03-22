import {useState} from "react";
import PostEditor from "@/src/components/forum/PostEditor";
import usePosts from "@/hooks/usePosts";
import {Container, Typography} from "@mui/material";

export default function CreatePostPage() {
    const {createPost} = usePosts();

    const handleSubmit = async (title: string, body: string, tags) => {
        const response = await createPost(title, body, tags);
        if (response.ok) {
            alert("Post created successfully!");
        }
    };

    return (
        <Container maxWidth="md" sx={{mt: 4}}>
            <Typography variant="h4" gutterBottom>
                Create a New Post
            </Typography>
            <PostEditor onSubmit={handleSubmit} initialTitle={''} initialBody={''} initialTags={[]} editable={true}/>
        </Container>
    );
}
