import {PostItem, Post} from "@/src/components/forum/PostItem";
import {AppCircularProgress} from "@/src/components/ui/AppCircularProgress";
import {AppList} from "@/src/components/ui/AppList";


type Props = {
    posts: Post[];
    loading: boolean;
};

export const PostList = ({posts, loading}: Props) => {
    const safePosts = Array.isArray(posts) ? posts : [];

    if (loading) return <AppCircularProgress sx={{display: "block", mx: "auto", my: 4}}/>;
    if (safePosts.length === 0) return <p>No posts found.</p>;

    return (
        <AppList>
            {safePosts.map((post) => (
                <PostItem key={post.id} post={post}/>
            ))}
        </AppList>
    );
};
