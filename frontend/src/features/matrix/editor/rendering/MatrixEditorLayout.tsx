import React from "react";
import {useMode} from "@/src/context/ThemeContext";
import styles from "./matrixEditorRendering.module.css";

interface MatrixEditorLayoutProps {
    title?: string | null;
    onDelete?: () => void;
    warnings?: string[];
    children: React.ReactNode;
}

export function MatrixEditorLayout({title, onDelete, warnings = [], children}: MatrixEditorLayoutProps) {
    const {mode, theme} = useMode();
    const isDark = mode === "dark";

    return (
        <section
            className={styles.matrixEditorShell}
            style={{
                "--matrix-border": theme.fgc.border.default,
                "--matrix-shell-background": isDark
                    ? `linear-gradient(180deg, ${theme.fgc.surface.base} 0%, ${theme.fgc.surface.sunken} 100%)`
                    : `linear-gradient(180deg, ${theme.fgc.surface.base} 0%, ${theme.fgc.background.subtle} 100%)`,
            } as React.CSSProperties}
        >
            <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8}}>
                <strong style={{fontSize: 13, letterSpacing: 0.2, color: theme.fgc.text.primary}}>{title ?? "Matrix Editor"}</strong>
                {onDelete ? (
                    <button type="button" onClick={onDelete} aria-label="Delete matrix" style={{fontSize: 12}}>
                        Delete
                    </button>
                ) : null}
            </div>
            {warnings.length > 0 ? (
                <div
                    style={{
                        border: `1px solid ${theme.fgc.feedback.warning}`,
                        background: theme.fgc.chip.warningBg,
                        color: theme.fgc.chip.warningText,
                        padding: 8,
                        borderRadius: 6,
                        marginBottom: 8,
                        fontSize: 13,
                    }}
                >
                    {warnings.map((warning, index) => (
                        <div key={`${warning}-${index}`}>{warning}</div>
                    ))}
                </div>
            ) : null}
            {children}
        </section>
    );
}
