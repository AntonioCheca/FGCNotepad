import {TextField, Box} from "@mui/material";

const SearchBar = () => {
    return (
        <Box sx={{mb: 3}}>
            <TextField
                fullWidth
                label="Search posts..."
                variant="outlined"
            />
        </Box>
    );
};

export default SearchBar;
