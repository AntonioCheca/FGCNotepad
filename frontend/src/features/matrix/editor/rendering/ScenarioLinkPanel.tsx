import React from "react";

import {MatrixReferencePreValue} from "@/src/features/matrix/model";
import {fetchScenarioItems, ScenarioSearchError, ScenarioSearchItem} from "../services/scenarioSearchService";
import {DynamicComboPanel} from "./DynamicComboPanel";

interface ScenarioLinkPanelProps {
    open: boolean;
    initialScenarioId?: string;
    initialScenarioLabel?: string;
    initialPreValue?: MatrixReferencePreValue;
    moveLabelById: Record<string, string>;
    presentation?: "modal" | "inline";
    resetKey?: string;
    onClose: () => void;
    onConfirm: (item: ScenarioSearchItem, preValue: MatrixReferencePreValue, starterLabels: Record<string, string>) => void;
    onRemove?: () => void;
}

type PreValueKind = MatrixReferencePreValue["kind"];

type ScenarioLinkPanelBodyProps = Omit<ScenarioLinkPanelProps, "open" | "resetKey">;

export function ScenarioLinkPanel({open, resetKey = "scenario-link-panel", ...bodyProps}: ScenarioLinkPanelProps) {
    if (!open) {
        return null;
    }

    return <ScenarioLinkPanelBody key={resetKey} {...bodyProps} />;
}

function ScenarioLinkPanelBody({initialScenarioId, initialScenarioLabel, initialPreValue, moveLabelById, presentation = "modal", onClose, onConfirm, onRemove}: ScenarioLinkPanelBodyProps) {
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [query, setQuery] = React.useState("");
    const [items, setItems] = React.useState<ScenarioSearchItem[]>([]);
    const [selectedId, setSelectedId] = React.useState<string | null>(initialScenarioId ?? null);
    const [debouncedQuery, setDebouncedQuery] = React.useState("");
    const [preValueKind, setPreValueKind] = React.useState<PreValueKind>(() => initialPreValue?.kind ?? "none");
    const [staticPreValue, setStaticPreValue] = React.useState(() => initialPreValue?.kind === "static" ? String(initialPreValue.staticValue) : "");
    const [dynamicPreValue, setDynamicPreValue] = React.useState(() => initialPreValue?.kind === "dynamic_combo" ? initialPreValue.dynamicCombo : null);
    const dynamicStarterLabelsRef = React.useRef<Record<string, string>>({});

    React.useEffect(() => {
        const handle = window.setTimeout(() => {
            setDebouncedQuery(query.trim());
        }, 250);

        return () => {
            window.clearTimeout(handle);
        };
    }, [query]);

    React.useEffect(() => {
        let isMounted = true;
        setLoading(true);
        setError(null);

        fetchScenarioItems({q: debouncedQuery, size: 80})
            .then((nextItems) => {
                if (!isMounted) {
                    return;
                }
                setItems(nextItems);
                if (initialScenarioId && nextItems.some((item) => item.id === initialScenarioId)) {
                    setSelectedId(initialScenarioId);
                }
            })
            .catch((_err) => {
                if (!isMounted) {
                    return;
                }
                if (_err instanceof ScenarioSearchError) {
                    setError(_err.message);
                } else {
                    setError("Failed to load scenarios. Try again.");
                }
            })
            .finally(() => {
                if (!isMounted) {
                    return;
                }
                setLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [initialScenarioId, debouncedQuery]);

    const isInline = presentation === "inline";

    const panelContent = (
        <div
            style={{
                width: isInline ? "100%" : "min(640px, 92vw)",
                maxHeight: isInline ? "unset" : "80vh",
                background: isInline ? "transparent" : "#fff",
                borderRadius: isInline ? 0 : 8,
                border: isInline ? "none" : "1px solid #d9d9d9",
                padding: 12,
                display: "flex",
                flexDirection: "column",
                gap: 8,
                minWidth: 0,
                boxSizing: "border-box",
                overflowX: "hidden",
            }}
            onClick={(event) => event.stopPropagation()}
        >
                <div style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
                    <div style={{display: "grid", gap: 2}}>
                        <strong id="scenario-link-panel-title" style={{fontSize: 14, color: "#2a4a6f"}}>Link Scenario</strong>
                        <span style={{fontSize: 12, color: "#5e7795"}}>Visible only for selected reference-capable cell</span>
                    </div>
                    <button type="button" onClick={onClose} style={{height: 30}}>Close</button>
                </div>
                <input
                    autoFocus
                    type="text"
                    aria-label="Search scenarios"
                    placeholder="Search scenarios"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    style={{height: 34, border: "1px solid #b8c9dc", borderRadius: 8, padding: "0 10px", background: "#fff"}}
                />

                <div style={{border: "1px solid #cfdeec", borderRadius: 8, overflowY: "auto", overflowX: "hidden", maxHeight: isInline ? "44vh" : "50vh", background: "#fff", minWidth: 0}}>
                    {loading ? <div style={{padding: 12}}>Loading scenarios...</div> : null}
                    {!loading && error ? <div style={{padding: 12, color: "#cf1322"}}>{error}</div> : null}
                    {!loading && !error && items.length === 0 ? <div style={{padding: 12}}>No scenarios found.</div> : null}
                    {!loading && !error && items.length > 0 ? (
                        <div>
                            {items.map((item) => {
                                const selected = selectedId === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => setSelectedId(item.id)}
                                     style={{
                                             display: "block",
                                             width: "100%",
                                             minWidth: 0,
                                             textAlign: "left",
                                             padding: 10,
                                             border: "none",
                                             borderBottom: "1px solid #edf2f7",
                                             background: selected ? "#e6f1fc" : "#fff",
                                         }}
                                     >
                                        <div style={{fontWeight: 600}}>{item.label}</div>
                                        <div style={{fontSize: 12, color: "#64748b"}}>{item.typeLabel} · #{item.id}</div>
                                    </button>
                                );
                            })}
                        </div>
                    ) : null}
                </div>

                <div style={{display: "grid", gap: 8, border: "1px solid #cfdeec", borderRadius: 8, padding: 10, background: "#fff"}}>
                    <label style={{display: "grid", gap: 4}}>
                        <span style={{fontSize: 12, color: "#595959"}}>Pre-value Added Before Linked EV</span>
                        <select
                            value={preValueKind}
                            onChange={(event) => {
                                setPreValueKind(event.target.value as PreValueKind);
                                setError(null);
                            }}
                        >
                            <option value="none">None</option>
                            <option value="static">Static value</option>
                            <option value="dynamic_combo">Dynamic combo</option>
                        </select>
                    </label>

                    {preValueKind === "static" ? (
                        <label style={{display: "grid", gap: 4}}>
                            <span style={{fontSize: 12, color: "#595959"}}>Static Pre-value</span>
                            <input
                                type="number"
                                value={staticPreValue}
                                onChange={(event) => {
                                    setStaticPreValue(event.target.value);
                                    setError(null);
                                }}
                                style={{height: 34, border: "1px solid #b8c9dc", borderRadius: 8, padding: "0 10px", background: "#fff"}}
                            />
                        </label>
                    ) : null}

                    {preValueKind === "dynamic_combo" ? (
                        <DynamicComboPanel
                            open
                            presentation="inline"
                            resetKey="scenario-dynamic-prevalue"
                            initialValue={dynamicPreValue}
                            moveLabelById={moveLabelById}
                            onClose={() => setPreValueKind("none")}
                            onConfirm={(value, starterLabels) => {
                                setDynamicPreValue(value);
                                dynamicStarterLabelsRef.current = starterLabels;
                                setError(null);
                            }}
                        />
                    ) : null}
                </div>

                <div style={{display: "flex", justifyContent: "flex-end", gap: 8}}>
                    <button type="button" onClick={onClose} style={{height: 30}}>Cancel</button>
                    <button
                        type="button"
                        disabled={!selectedId}
                        style={{
                            height: 30,
                            borderRadius: 6,
                            border: "1px solid #2c5e93",
                            background: selectedId ? "linear-gradient(135deg, #356ba4 0%, #4a80b8 100%)" : "#dbe8f6",
                            color: selectedId ? "#fff" : "#355578",
                            fontWeight: 600,
                        }}
                        onClick={() => {
                            const selected = items.find((item) => item.id === selectedId)
                                ?? (selectedId && selectedId === initialScenarioId
                                    ? {
                                        id: selectedId,
                                        label: initialScenarioLabel ?? selectedId,
                                        typeLabel: "Scenario",
                                    }
                                    : null);
                            if (selected) {
                                if (preValueKind === "static") {
                                    const numeric = Number(staticPreValue);
                                    if (!Number.isFinite(numeric)) {
                                        setError("Static pre-value must be numeric.");
                                        return;
                                    }

                                    onConfirm(selected, {kind: "static", staticValue: numeric}, {});
                                    return;
                                }

                                if (preValueKind === "dynamic_combo") {
                                    if (!dynamicPreValue) {
                                        setError("Save the dynamic combo pre-value first.");
                                        return;
                                    }

                                    onConfirm(selected, {kind: "dynamic_combo", dynamicCombo: dynamicPreValue}, dynamicStarterLabelsRef.current);
                                    return;
                                }

                                onConfirm(selected, {kind: "none"}, {});
                            }
                        }}
                    >
                        Confirm Link
                    </button>
                    {initialScenarioId && onRemove ? (
                        <button
                            type="button"
                            onClick={onRemove}
                            style={{
                                height: 30,
                                borderRadius: 6,
                                border: "1px solid #cf1322",
                                background: "#fff1f0",
                                color: "#a8071a",
                                fontWeight: 600,
                            }}
                        >
                            Remove Link
                        </button>
                    ) : null}
                </div>
            </div>
    );

    if (presentation === "inline") {
        return panelContent;
    }

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="scenario-link-panel-title"
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
