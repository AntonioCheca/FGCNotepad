// PostItem.tsx
import {ListItem, ListItemText, Divider} from "@mui/material";
import Link from "next/link";
import PostTags from "@/src/components/forum/PostTags";

export type Post = {
    id: string;
    title: string;
    author: string;
    tags: string[];
};

export const PostItem = ({post}: { post: Post }) => {
    return (
        <>
            <ListItem alignItems="flex-start">
                <ListItemText
                    primary={
                        <Link href={`/forum/post/${post.id}`} passHref>
                            {post.title}
                        </Link>
                    }
                    secondary={`by ${post.author}`}
                />
            </ListItem>
            <PostTags tags={post.tags}/>
            <Divider component="li"/>
        </>
    );
};

export default PostItem;
