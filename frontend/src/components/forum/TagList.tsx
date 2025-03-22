import {useState} from "react";
import {TextField, IconButton, Chip, Stack} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

interface TagListProps {
    tags: string[];
    onTagsChange: (updatedTags: string[]) => void;
    editable: boolean;
}

export default function TagList({tags, onTagsChange, editable}: TagListProps) {
    const [tagInput, setTagInput] = useState("");

    const handleAddTag = () => {
        if (tagInput.trim() && !tags.includes(tagInput.trim())) {
            onTagsChange([...tags, tagInput.trim()]);
            setTagInput("");
        }
    };

    const handleDeleteTag = (tagToDelete: string) => {
        onTagsChange(tags.filter((tag) => tag !== tagToDelete));
    };

    return (
        <Stack spacing={1}>
            {editable && (
                <Stack direction="row" spacing={1} alignItems="center">
                    <TextField
                        label="Add Tag"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        size="small"
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddTag();
                            }
                        }}
                    />
                    <IconButton onClick={handleAddTag} color="primary">
                        <AddIcon/>
                    </IconButton>
                </Stack>
            )}

            <Stack direction="row" spacing={1} flexWrap="wrap">
                {tags.map((tag, index) => (
                    <Chip
                        key={index}
                        label={tag}
                        onDelete={editable ? () => handleDeleteTag(tag) : undefined}
                        color="primary"
                    />
                ))}
            </Stack>
        </Stack>
    );
}
