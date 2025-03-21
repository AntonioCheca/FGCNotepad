import {ListItem, ListItemText, Divider, Box, Chip} from "@mui/material";
import Link from "next/link";

export type Post = {
    id: string;
    title: string;
    author: string;
    tags: string[];
};

export const PostItem = ({post}: { post: Post }) => {

    console.log("TAGS", post.tags);
    return (
        <>
            <ListItem component={Link} href={`/forum/post/${post.id}`} sx={{textDecoration: "none", color: "inherit"}}>
                <ListItemText
                    primary={post.title}
                    secondary={post.author}
                    primaryTypographyProps={{fontWeight: "bold"}}
                />
            </ListItem>
            {/* Render tags if available */}
            {post.tags && post.tags.length > 0 && (
                <Box sx={{display: "flex", flexWrap: "wrap", gap: 1, ml: 2, mt: 1}}>
                    {post.tags.map((tag, index) => (
                        <Chip key={index} label={tag} size="small" color="primary"/>
                    ))}
                </Box>
            )}

            <Divider/>
            <Divider/>
        </>
    );
};

export default PostItem;
