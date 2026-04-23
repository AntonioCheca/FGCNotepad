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
    return (
        <div style={{display: "flex", gap: 8, alignItems: "center", marginBottom: 8, flexWrap: "wrap"}}>
            <label style={{display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12}}>
                View
                <select
                    value={showAllLayers ? "all" : "layer"}
                    onChange={(event) => onShowAllLayersChange(event.target.value === "all")}
                    style={{height: 28}}
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
                        style={{width: 72, height: 28}}
                    />
                </label>
            ) : null}
            <button type="button" onClick={() => onShowLayerControlsChange(!showLayerControls)} style={{height: 28}}>
                {showLayerControls ? "Hide Layers" : "Show Layers"}
            </button>
            {canEditReferences ? (
                <button
                    type="button"
                    disabled={!selectedBodyCell}
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
                    disabled={!selectedBodyCell}
                    onClick={() => {
                        if (selectedBodyCell) {
                            onOpenDynamicCombo(selectedBodyCell.key);
                        }
                    }}
                >
                    {selectedBodyCell?.kind === "dynamic_combo" ? "Edit Dynamic Combo" : "Set Dynamic Combo"}
                </button>
            ) : null}
            <button type="button" onClick={onSolve} disabled={isSolving}>
                {isSolving ? "Solving..." : "Solve Game"}
            </button>
            <span style={{fontSize: 12, color: "#595959"}}>
                {rowCount}x{columnCount}
            </span>
            <span style={{fontSize: 12, color: "#8c8c8c"}}>{editable ? "Mode: Edit" : "Mode: View"}</span>
            {selectedReferenceLabel ? <span style={{fontSize: 12, color: "#8c8c8c"}}>Linked: {selectedReferenceLabel}</span> : null}
        </div>
    );
}
