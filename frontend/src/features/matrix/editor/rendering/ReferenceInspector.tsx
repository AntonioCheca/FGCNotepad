import React from "react";

import {ReferenceInspectorData} from "../services/referenceInspector";

interface ReferenceInspectorProps {
    data: ReferenceInspectorData;
}

export function ReferenceInspector({data}: ReferenceInspectorProps) {
    return (
        <section
            style={{
                border: "1px solid #d9d9d9",
                borderRadius: 6,
                background: "#fafafa",
                padding: 10,
                marginBottom: 8,
            }}
        >
            <div style={{fontWeight: 600, marginBottom: 6}}>Reference Inspector</div>
            <div style={{fontSize: 13, display: "grid", gap: 4}}>
                <div><strong>Name:</strong> {data.scenarioName}</div>
                <div><strong>ID:</strong> {data.scenarioId}</div>
                <div><strong>Kind:</strong> {data.referenceKind}</div>
                <div><strong>Resolved Value:</strong> {data.resolvedValue ?? "--"}</div>
                <div><strong>Cached Value:</strong> {data.cachedValue ?? "--"}</div>
                {data.metadata.length > 0 ? (
                    <div>
                        <strong>Metadata:</strong>{" "}
                        {data.metadata.map((item) => `${item.label}: ${item.value}`).join(" | ")}
                    </div>
                ) : null}
            </div>
        </section>
    );
}
