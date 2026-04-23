import React from "react";

interface MatrixEditorLayoutProps {
    title?: string | null;
    onDelete?: () => void;
    warnings?: string[];
    children: React.ReactNode;
}

export function MatrixEditorLayout({title, onDelete, warnings = [], children}: MatrixEditorLayoutProps) {
    return (
        <section
            className="matrix-editor-shell"
            style={{
                border: "1px solid #cfd9e3",
                borderRadius: 12,
                padding: 10,
                marginTop: 8,
                background: "linear-gradient(180deg, #ffffff 0%, #f5f8fc 100%)",
                width: "100%",
                maxWidth: "100%",
                minWidth: 0,
                overflow: "hidden",
                boxSizing: "border-box",
            }}
        >
            <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8}}>
                <div style={{display: "flex", alignItems: "center", gap: 8}}>
                    <strong style={{fontSize: 13, letterSpacing: 0.2, color: "#1f334d"}}>{title ?? "Matrix Editor"}</strong>
                    <span
                        style={{
                            border: "1px solid #b7c9dd",
                            borderRadius: 999,
                            background: "#edf3fb",
                            color: "#375a84",
                            fontSize: 11,
                            padding: "2px 8px",
                            fontWeight: 600,
                        }}
                    >
                        Segmented
                    </span>
                </div>
                {onDelete ? (
                    <button type="button" onClick={onDelete} aria-label="Delete matrix" style={{fontSize: 12}}>
                        Delete
                    </button>
                ) : null}
            </div>
            {warnings.length > 0 ? (
                <div
                    style={{
                        border: "1px solid #ffd591",
                        background: "#fff7e6",
                        color: "#8c4a00",
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
