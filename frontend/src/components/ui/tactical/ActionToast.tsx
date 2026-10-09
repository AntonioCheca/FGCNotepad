import {AppSnackbar} from "@/src/components/ui/AppSnackbar";
import {AppAlert} from "@/src/components/ui/AppAlert";

interface ActionToastProps {
    open: boolean;
    severity: "success" | "error";
    message: string;
    onClose: () => void;
}

export function ActionToast({open, severity, message, onClose}: ActionToastProps) {
    return (
        <AppSnackbar open={open} autoHideDuration={3000} onClose={onClose} anchorOrigin={{vertical: "bottom", horizontal: "right"}}>
            <AppAlert severity={severity} variant="filled" onClose={onClose} sx={{width: "100%"}}>
                {message}
            </AppAlert>
        </AppSnackbar>
    );
}
