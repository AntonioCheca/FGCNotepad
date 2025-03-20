import {TextField, Box} from "@mui/material";
import {useState} from "react";

const SearchBar = ({onSubmit}) => {
    const [query, setQuery] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(query);
    };

    return (
        <Box sx={{mb: 3}}>
            <form onSubmit={handleSubmit}>
                <TextField
                    fullWidth
                    label="Search posts..."
                    variant="outlined"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
            </form>
        </Box>
    );
};

export default SearchBar;
