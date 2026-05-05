import PostEditor from "@/src/components/forum/PostEditor";
import usePosts from "@/hooks/usePosts";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {AppContainer} from "@/src/components/ui/AppContainer";

export default function CreatePostPage() {
    const {createPost} = usePosts();

    const handleSubmit = async (title: string, body: string, tags: string[]) => {
        const response = await createPost(title, body, tags);
        if (response.ok) {
            alert("Post created successfully!");
        }
    };

    return (
        <AppContainer maxWidth={false} sx={{width: "100%", maxWidth: "100%", minWidth: 0, overflowX: "hidden", boxSizing: "border-box"}}>
            <AppTypography variant="h4" gutterBottom>
                Create a New Post
            </AppTypography>
            <PostEditor onSubmit={handleSubmit} initialTitle={''} initialBody={''} initialTags={[]} editable={true}/>
        </AppContainer>
    );
}
