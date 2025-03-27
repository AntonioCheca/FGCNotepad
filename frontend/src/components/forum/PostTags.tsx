import {AppBox} from "@/src/components/ui/AppBox";
import {AppChip} from "@/src/components/ui/AppChip";

export const PostTags = ({tags}: { tags: string[] }) => {
    if (!tags || tags.length === 0) return null;

    return (
        <AppBox display="flex" gap={1} flexWrap="wrap">
            {tags.map((tag, index) => (
                <AppChip key={index} label={tag} variant="outlined"/>
            ))}
        </AppBox>
    );
};

export default PostTags;
