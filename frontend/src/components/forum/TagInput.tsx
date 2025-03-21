import {useState} from "react";
import {TextField, IconButton} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

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
        <TextField
            label="Add a Tag"
            variant="outlined"
            size="small"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
            InputProps={{
                endAdornment: (
                    <IconButton onClick={handleAddTag}>
                        <AddIcon/>
                    </IconButton>
                ),
            }}
        />
    );
};

export default TagInput;
