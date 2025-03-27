import Link from "next/link";
import PostTags from "@/src/components/forum/PostTags";
import {AppListItem} from "@/src/components/ui/AppListItem";
import {AppListItemText} from "@/src/components/ui/AppListItemText";
import {AppDivider} from "@/src/components/ui/AppDivider";

export type Post = {
    id: string;
    title: string;
    author: string;
    tags: string[];
};

export const PostItem = ({post}: { post: Post }) => {
    return (
        <>
            <AppListItem alignItems="flex-start">
                <AppListItemText
                    primary={
                        <Link href={`/forum/post/${post.id}`} passHref>
                            {post.title}
                        </Link>
                    }
                    secondary={`by ${post.author}`}
                />
            </AppListItem>
            <PostTags tags={post.tags}/>
            <AppDivider component="li"/>
        </>
    );
};

export default PostItem;
