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
                border: "1px solid #d9d9d9",
                borderRadius: 10,
                padding: 10,
                marginTop: 8,
                background: "linear-gradient(180deg, #ffffff 0%, #fcfcfc 100%)",
            }}
        >
            <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8}}>
                <strong style={{fontSize: 13, letterSpacing: 0.2}}>{title ?? "Matrix Editor"}</strong>
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
