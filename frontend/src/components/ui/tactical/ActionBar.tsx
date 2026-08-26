import React from "react";
import {AppBox} from "@/src/components/ui/AppBox";

interface ActionBarProps {
    children: React.ReactNode;
}

export function ActionBar({children}: ActionBarProps) {
    return (
        <AppBox
            sx={{
                display: "flex",
                justifyContent: {xs: "stretch", sm: "flex-end"},
                gap: 0.75,
                flexWrap: "wrap",
                pt: 1.1,
                mt: 0.2,
                borderTop: "1px solid",
                borderColor: "divider",
                alignItems: "center",
                minWidth: 0,
                "& .MuiButton-root": {
                    flex: {xs: "1 1 100%", sm: "0 0 auto"},
                },
            }}
        >
            {children}
        </AppBox>
    );
}
