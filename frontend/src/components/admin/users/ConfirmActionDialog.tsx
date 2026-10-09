import {AppTypography} from "@/src/components/ui/AppTypography";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppDialog} from "@/src/components/ui/AppDialog";
import {AppDialogTitle} from "@/src/components/ui/AppDialogTitle";
import {AppDialogContent} from "@/src/components/ui/AppDialogContent";
import {AppDialogActions} from "@/src/components/ui/AppDialogActions";

interface ConfirmActionDialogProps {
    open: boolean;
    title: string;
    body: string;
    loading: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export function ConfirmActionDialog({open, title, body, loading, onClose, onConfirm}: ConfirmActionDialogProps) {
    return (
        <AppDialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <AppDialogTitle>{title}</AppDialogTitle>
            <AppDialogContent>
                <AppTypography>{body}</AppTypography>
            </AppDialogContent>
            <AppDialogActions>
                <AppButton type="button" variant="outlined" onClick={onClose} disabled={loading}>Cancel</AppButton>
                <AppButton type="button" color="error" onClick={onConfirm} disabled={loading}>{loading ? "Confirming..." : "Confirm"}</AppButton>
            </AppDialogActions>
        </AppDialog>
    );
}
