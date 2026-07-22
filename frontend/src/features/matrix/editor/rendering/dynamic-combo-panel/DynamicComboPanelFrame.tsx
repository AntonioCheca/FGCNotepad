import React from "react";

import type {DynamicComboPresentation} from "./dynamicComboPanelTypes";

interface DynamicComboPanelFrameProps {
    presentation: DynamicComboPresentation;
    titleId: string;
    onClose: () => void;
    children: React.ReactNode;
}

export function DynamicComboPanelFrame({presentation, titleId, onClose, children}: DynamicComboPanelFrameProps) {
    const isInline = presentation === "inline";
    const panelContent = (
        <div
            style={{
                width: isInline ? "100%" : "min(560px, 92vw)",
                maxHeight: isInline ? "unset" : "80vh",
                background: isInline ? "transparent" : "#fff",
                borderRadius: isInline ? 0 : 8,
                border: isInline ? "none" : "1px solid #d9d9d9",
                padding: 12,
                display: "flex",
                flexDirection: "column",
                gap: 10,
                minWidth: 0,
                boxSizing: "border-box",
                overflowX: "hidden",
            }}
            onClick={(event) => event.stopPropagation()}
        >
            {children}
        </div>
    );

    if (isInline) {
        return panelContent;
    }

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.35)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 1200,
            }}
            onClick={onClose}
        >
            {panelContent}
        </div>
    );
}
