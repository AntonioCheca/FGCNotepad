import {useState} from "react";
import {AppTextField} from "@/src/components/ui/AppTextField";
import {AppStack} from "@/src/components/ui/AppStack";
import {AppChip} from "@/src/components/ui/AppChip";
import {AppAddIconButton} from "@/src/components/ui/AppAddIconButton";
import AdvancedEditableWrapper from "@/src/components/util/AdvancedEditableWrapper";

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
        <AppStack spacing={1}>
            <AdvancedEditableWrapper condition={editable}>
                <AppStack direction="row" spacing={1} alignItems="center">
                    <AppTextField
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
                    <AppAddIconButton onClick={handleAddTag} color="primary"/>
                </AppStack>
            </AdvancedEditableWrapper>

            <AppStack direction="row" spacing={1} flexWrap="wrap">
                {tags.map((tag, index) => (
                    <AppChip
                        key={index}
                        label={tag}
                        onDelete={editable ? () => handleDeleteTag(tag) : undefined}
                        color="primary"
                    />
                ))}
            </AppStack>
        </AppStack>
    );
}
