import {Box, Chip} from "@mui/material";

export const PostTags = ({tags}: { tags: string[] }) => {
    if (!tags || tags.length === 0) return null;

    return (
        <Box display="flex" gap={1} flexWrap="wrap">
            {tags.map((tag, index) => (
                <Chip key={index} label={tag} variant="outlined"/>
            ))}
        </Box>
    );
};

export default PostTags;
