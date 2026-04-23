import React from "react";

import {MatrixBodyCell} from "@/src/features/matrix/model";

interface MatrixEditorToolbarProps {
    showAllLayers: boolean;
    selectedLayer: number;
    onShowAllLayersChange: (showAllLayers: boolean) => void;
    onSelectedLayerChange: (layer: number) => void;
    canEditReferences: boolean;
    canEditDynamicCombos: boolean;
    selectedBodyCell: MatrixBodyCell | null;
    onOpenReferenceLink: (key: string) => void;
    onOpenDynamicCombo: (key: string) => void;
    onSolve: () => void;
    isSolving: boolean;
    rowCount: number;
    columnCount: number;
    editable: boolean;
    selectedReferenceLabel: string | null;
    showLayerControls: boolean;
    onShowLayerControlsChange: (show: boolean) => void;
}

export function MatrixEditorToolbar({
    showAllLayers,
    selectedLayer,
    onShowAllLayersChange,
    onSelectedLayerChange,
    canEditReferences,
    canEditDynamicCombos,
    selectedBodyCell,
    onOpenReferenceLink,
    onOpenDynamicCombo,
    onSolve,
    isSolving,
    rowCount,
    columnCount,
    editable,
    selectedReferenceLabel,
    showLayerControls,
    onShowLayerControlsChange,
}: MatrixEditorToolbarProps) {
    const showCellActions = editable && !!selectedBodyCell && (canEditReferences || canEditDynamicCombos);

    return (
        <div style={{display: "grid", gap: 8, marginBottom: 10}}>
            <div
                style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    flexWrap: "wrap",
                    border: "1px solid #d9e2ec",
                    borderRadius: 10,
                    padding: 8,
                    background: "linear-gradient(180deg, #ffffff 0%, #f7fafc 100%)",
                }}
            >
                <label style={{display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12}}>
                    View
                    <select
                        value={showAllLayers ? "all" : "layer"}
                        onChange={(event) => onShowAllLayersChange(event.target.value === "all")}
                        style={{height: 30, borderRadius: 6, border: "1px solid #cbd5e1", padding: "0 6px"}}
                    >
                        <option value="layer">Up To Layer</option>
                        <option value="all">All Layers</option>
                    </select>
                </label>
                {!showAllLayers ? (
                    <label style={{display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12}}>
                        Layer
                        <input
                            type="number"
                            min={1}
                            step={1}
                            value={selectedLayer}
                            onChange={(event) => {
                                const next = Number(event.target.value);
                                onSelectedLayerChange(Number.isFinite(next) ? Math.max(1, Math.trunc(next)) : 1);
                            }}
                            style={{width: 72, height: 30, borderRadius: 6, border: "1px solid #cbd5e1", padding: "0 6px"}}
                        />
                    </label>
                ) : null}
                <button type="button" onClick={() => onShowLayerControlsChange(!showLayerControls)} style={{height: 30}}>
                    {showLayerControls ? "Hide Layers" : "Show Layers"}
                </button>
                <button
                    type="button"
                    onClick={onSolve}
                    disabled={isSolving}
                    style={{
                        height: 30,
                        borderRadius: 6,
                        border: "1px solid #2c5e93",
                        background: isSolving ? "#dbe8f6" : "linear-gradient(135deg, #356ba4 0%, #4a80b8 100%)",
                        color: isSolving ? "#355578" : "#fff",
                        fontWeight: 600,
                    }}
                >
                    {isSolving ? "Solving..." : "Solve Game"}
                </button>
                <span style={{fontSize: 12, color: "#334155"}}>
                    {rowCount}x{columnCount}
                </span>
                <span style={{fontSize: 12, color: "#64748b"}}>{editable ? "Mode: Edit" : "Mode: View"}</span>
                {selectedReferenceLabel ? <span style={{fontSize: 12, color: "#64748b"}}>Linked: {selectedReferenceLabel}</span> : null}
            </div>

            {showCellActions ? (
                <div
                    style={{
                        display: "flex",
                        gap: 8,
                        alignItems: "center",
                        flexWrap: "wrap",
                        border: "1px solid #d5e0ec",
                        borderRadius: 10,
                        background: "#f8fbff",
                        padding: 8,
                    }}
                >
                    <span style={{fontSize: 12, color: "#4f6d8f", fontWeight: 600}}>Cell Action</span>
                    {canEditReferences ? (
                        <button
                            type="button"
                            style={{borderRadius: 6, border: "1px solid #9fb8d2", background: "#ffffff", height: 30, padding: "0 10px"}}
                            onClick={() => {
                                if (selectedBodyCell) {
                                    onOpenReferenceLink(selectedBodyCell.key);
                                }
                            }}
                        >
                            {selectedBodyCell?.kind === "reference" ? "Relink Scenario" : "Link Scenario"}
                        </button>
                    ) : null}
                    {canEditDynamicCombos ? (
                        <button
                            type="button"
                            style={{borderRadius: 6, border: "1px solid #9fb8d2", background: "#ffffff", height: 30, padding: "0 10px"}}
                            onClick={() => {
                                if (selectedBodyCell) {
                                    onOpenDynamicCombo(selectedBodyCell.key);
                                }
                            }}
                        >
                            {selectedBodyCell?.kind === "dynamic_combo" ? "Edit Dynamic Combo" : "Set Dynamic Combo"}
                        </button>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
}
