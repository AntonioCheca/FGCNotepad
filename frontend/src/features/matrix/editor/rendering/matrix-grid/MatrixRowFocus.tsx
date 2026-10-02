import React from "react";

import {useMode} from "@/src/context/ThemeContext";
import type {RowFocusRow} from "./rowFocusModel";

interface MatrixRowFocusProps {
    rows: RowFocusRow[];
    defaultRowId: string | null;
    rowAxisLabel: string;
    columnAxisLabel: string;
}

// Phone view of a payoff matrix: pick one row option, read its outcome against every column as a list.
export function MatrixRowFocus({rows, defaultRowId, rowAxisLabel, columnAxisLabel}: MatrixRowFocusProps) {
    const {theme} = useMode();
    const [chosenRowId, setChosenRowId] = React.useState<string | null>(null);
    const listId = React.useId();
    const selectedRow = rows.find((row) => row.id === (chosenRowId ?? defaultRowId)) ?? rows[0];

    if (!selectedRow) {
        return null;
    }

    const valueColor = (value: number | null) => (value === null ? theme.fgc.text.secondary : value < 0 ? theme.fgc.feedback.errorText : theme.fgc.feedback.success);

    return (
        <section aria-label={`${rowAxisLabel} outcomes`} style={{display: "grid", gap: 10}}>
            <div role="group" aria-label={`${rowAxisLabel} option`} style={{display: "flex", flexWrap: "wrap", gap: 6}}>
                {rows.map((row) => {
                    const selected = row.id === selectedRow.id;
                    return (
                        <button
                            key={row.id}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => setChosenRowId(row.id)}
                            style={{
                                minHeight: 40,
                                padding: "6px 12px",
                                borderRadius: 999,
                                border: `1px solid ${selected ? theme.fgc.accent.selected : theme.fgc.border.default}`,
                                background: selected ? theme.fgc.surface.selected : theme.fgc.surface.base,
                                color: row.unavailable ? theme.fgc.text.disabled : theme.fgc.text.primary,
                                font: "inherit",
                                fontSize: 14,
                                fontWeight: selected ? 700 : 500,
                                cursor: "pointer",
                            }}
                        >
                            {row.label}
                            {row.frequency ? <span style={{marginLeft: 6, color: theme.fgc.text.secondary, fontWeight: 500}}>{row.frequency}</span> : null}
                        </button>
                    );
                })}
            </div>

            <h4 id={listId} style={{margin: 0, fontSize: 14, fontWeight: 600, color: theme.fgc.text.secondary}}>
                {rowAxisLabel} {selectedRow.label} vs {columnAxisLabel}
            </h4>
            <ul aria-labelledby={listId} style={{listStyle: "none", margin: 0, padding: 0, border: `1px solid ${theme.fgc.border.default}`, borderRadius: 10, overflow: "hidden"}}>
                {selectedRow.outcomes.map((outcome, index) => (
                    <li
                        key={outcome.columnId}
                        style={{
                            display: "grid",
                            gridTemplateColumns: "minmax(0, 1fr) auto",
                            alignItems: "center",
                            gap: 12,
                            padding: "10px 12px",
                            borderTop: index === 0 ? "none" : `1px solid ${theme.fgc.border.subtle}`,
                            background: theme.fgc.surface.base,
                            opacity: outcome.unavailable ? 0.6 : 1,
                        }}
                    >
                        <span style={{minWidth: 0, fontSize: 16, fontWeight: 700, color: theme.fgc.text.primary, overflowWrap: "anywhere"}}>
                            {outcome.columnLabel}
                            {outcome.columnFrequency ? <span style={{marginLeft: 6, fontSize: 14, fontWeight: 500, color: theme.fgc.text.secondary}}>{outcome.columnFrequency}</span> : null}
                        </span>
                        <span style={{fontSize: 18, fontWeight: 700, fontVariantNumeric: "tabular-nums", textAlign: "right", color: outcome.unavailable ? theme.fgc.text.disabled : valueColor(outcome.value)}}>
                            {outcome.unavailable ? "Unavailable" : outcome.display}
                        </span>
                    </li>
                ))}
            </ul>
        </section>
    );
}
