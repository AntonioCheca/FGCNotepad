import {TextField, TableCell} from "@mui/material";

function EditableTextCell({value, onChange, sx}) {
    return (
        <TableCell sx={sx}>
            <TextField
                value={value}
                onChange={(e) => onChange(e.target.value)}
                variant="standard"
                size="small"
                sx={{width: "100%"}}
            />
        </TableCell>
    );
}

export default EditableTextCell;
