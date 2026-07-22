import React from "react";

interface MatrixGridScrollFrameProps {
    borderColor: string;
    backgroundColor: string;
    children: React.ReactNode;
}

export function MatrixGridScrollFrame({borderColor, backgroundColor, children}: MatrixGridScrollFrameProps) {
    return (
        <div
            style={{
                overflow: "auto",
                maxWidth: "100%",
                minWidth: 0,
                maxHeight: "62vh",
                border: `1px solid ${borderColor}`,
                borderRadius: 10,
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8)",
                width: "100%",
                background: backgroundColor,
            }}
        >
            {children}
        </div>
    );
}
