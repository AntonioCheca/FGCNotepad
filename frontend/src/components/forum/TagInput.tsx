import {useState} from "react";
import {AppTextField} from "@/src/components/ui/AppTextField";
import {AppAddIconButton} from "@/src/components/ui/AppAddIconButton";

interface TagInputProps {
    onAddTag: (tag: string) => void;
}

const TagInput = ({onAddTag}: TagInputProps) => {
    const [tagInput, setTagInput] = useState("");

    const handleAddTag = () => {
        if (tagInput.trim()) {
            onAddTag(tagInput.trim());
            setTagInput("");
        }
    };

    return (
        <AppTextField
            label="Add a Tag"
            size="small"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
            InputProps={{
                endAdornment: (
                    <AppAddIconButton onClick={handleAddTag}/>
                ),
            }}
        />
    );
};

export default TagInput;
