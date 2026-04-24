import React from "react";
import {AppAlert} from "@/src/components/ui/AppAlert";

interface InlineNoticeProps {
    severity: "success" | "info" | "warning" | "error";
    children: React.ReactNode;
}

export function InlineNotice({severity, children}: InlineNoticeProps) {
    return (
        <AppAlert severity={severity} variant="outlined" sx={{borderRadius: 1.5}}>
            {children}
        </AppAlert>
    );
}
