import {Chip, Box} from "@mui/material";
import TagInput from "@/src/components/forum/TagInput"; // Ensure TagInput is imported

interface TagListProps {
    tags: string[];
    onDeleteTag: (tag: string) => void;
    onAddTag: (tag: string) => void;
    editable: boolean; // Add editable prop to control tag editing
}

const TagList = ({tags, onDeleteTag, onAddTag, editable}: TagListProps) => {
    return (
        <Box sx={{display: "flex", flexWrap: "wrap", gap: 1, mt: 1}}>
            {/* Render the TagInput component for adding tags */}
            {editable && <TagInput onAddTag={onAddTag}/>}

            {/* Render existing tags */}
            {tags.map((tag) => (
                <Chip
                    key={tag}
                    label={tag}
                    // Only pass onDelete when editable is true
                    {...(editable ? {onDelete: () => onDeleteTag(tag)} : {})}
                />
            ))}
        </Box>
    );
};

export default TagList;
