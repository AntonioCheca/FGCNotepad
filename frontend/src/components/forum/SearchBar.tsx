import {useState} from "react";
import {AppTextField} from "@/src/components/ui/AppTextField";
import {AppBox} from "@/src/components/ui/AppBox";

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
        <AppBox sx={{mb: 3}}>
            <form onSubmit={handleSubmit}>
                <AppTextField
                    label="Search posts..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
            </form>
        </AppBox>
    );
};

export default SearchBar;
