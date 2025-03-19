import {List, CircularProgress} from "@mui/material";
import {PostItem, Post} from "@/src/components/forum/PostItem";


type Props = {
    posts: Post[];
    loading: boolean;
};

export const PostList = ({posts, loading}: Props) => {
    if (loading) return <CircularProgress sx={{display: "block", mx: "auto", my: 4}}/>;
    if (posts.length === 0) return <p>No posts found.</p>;

    return (
        <List>
            {posts.map((post) => (
                <PostItem key={post.id} post={post}/>
            ))}
        </List>
    );
};
