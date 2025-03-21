import {TextField, Box} from "@mui/material";
import {useState} from "react";

const SearchBar = ({onSubmit}) => {
    const [query, setQuery] = useState("");

    const parseQuery = (query: string) => {
        const includedTags: string[] = [];
        const excludedTags: string[] = [];
        const textQueryParts: string[] = [];

        query.split(/\s+/).forEach((part) => {
            if (part.startsWith("[") && part.endsWith("]")) {
                includedTags.push(part.slice(1, -1)); // Extract tag name without brackets
            } else if (part.startsWith("-[") && part.endsWith("]")) {
                excludedTags.push(part.slice(2, -1)); // Extract tag name without -[]
            } else {
                textQueryParts.push(part); // Normal search terms
            }
        });

        return {
            textQuery: textQueryParts.join(" "),
            includedTags,
            excludedTags,
        };
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const parsedQuery = parseQuery(query);
        onSubmit(parsedQuery);
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
