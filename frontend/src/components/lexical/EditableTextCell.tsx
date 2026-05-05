import {AppTextField} from "@/src/components/ui/AppTextField";
import {AppTableCell} from "@/src/components/ui/AppTableCell";

interface EditableTextCellProps {
    value: string;
    onChange: (value: string) => void;
    sx?: Parameters<typeof AppTableCell>[0]["sx"];
}

function EditableTextCell({value, onChange, sx}: EditableTextCellProps) {
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
