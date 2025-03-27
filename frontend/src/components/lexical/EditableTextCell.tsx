import {AppTextField} from "@/src/components/ui/AppTextField";
import {AppTableCell} from "@/src/components/ui/AppTableCell";

function EditableTextCell({value, onChange, sx}) {
    return (
        <AppTableCell sx={sx}>
            <AppTextField
                value={value}
                onChange={(e) => onChange(e.target.value)}
                variant="standard"
                size="small"
            />
        </AppTableCell>
    );
}

export default EditableTextCell;
