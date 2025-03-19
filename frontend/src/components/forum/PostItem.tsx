import {ListItem, ListItemText, Divider} from "@mui/material";
import Link from "next/link";

export type Post = {
    id: string;
    title: string;
    author: string;
};

export const PostItem = ({post}: { post: Post }) => {
    return (
        <>
            <ListItem component={Link} href={`/forum/post/${post.id}`} sx={{textDecoration: "none", color: "inherit"}}>
                <ListItemText
                    primary={post.title}
                    secondary={post.author}
                    primaryTypographyProps={{fontWeight: "bold"}}
                />
            </ListItem>
            <Divider/>
        </>
    );
};

export default PostItem;
