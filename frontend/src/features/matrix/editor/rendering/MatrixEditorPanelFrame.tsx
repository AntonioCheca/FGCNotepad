import React from "react";

import styles from "./matrixEditorRendering.module.css";

interface MatrixEditorPanelFrameProps {
    presentation: "modal" | "inline";
    titleId: string;
    width: string;
    gap: number;
    onClose: () => void;
    children: React.ReactNode;
}

export function MatrixEditorPanelFrame({presentation, titleId, width, gap, onClose, children}: MatrixEditorPanelFrameProps) {
    const dialogRef = React.useRef<HTMLDialogElement | null>(null);
    const style = {"--panel-width": width, "--panel-gap": `${gap}px`} as React.CSSProperties;

    React.useEffect(() => {
        if (presentation !== "modal") {
            return;
        }

        const dialog = dialogRef.current;
        if (dialog && !dialog.open) {
            dialog.showModal();
        }
    }, [presentation]);

    if (presentation === "inline") {
        return (
            <div className={styles.panelFrameInline} style={style}>
                {children}
            </div>
        );
    }

    return (
        <dialog
            ref={dialogRef}
            className={styles.panelDialog}
            style={style}
            aria-labelledby={titleId}
            onCancel={onClose}
        >
            <div className={styles.panelDialogInner}>{children}</div>
        </dialog>
    );
}
