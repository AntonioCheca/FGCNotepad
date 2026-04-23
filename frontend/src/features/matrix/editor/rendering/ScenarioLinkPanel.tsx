import React from "react";

import {fetchScenarioItems, ScenarioSearchError, ScenarioSearchItem} from "../services/scenarioSearchService";

interface ScenarioLinkPanelProps {
    open: boolean;
    initialScenarioId?: string;
    presentation?: "modal" | "inline";
    onClose: () => void;
    onConfirm: (item: ScenarioSearchItem) => void;
}

export function ScenarioLinkPanel({open, initialScenarioId, presentation = "modal", onClose, onConfirm}: ScenarioLinkPanelProps) {
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [query, setQuery] = React.useState("");
    const [items, setItems] = React.useState<ScenarioSearchItem[]>([]);
    const [selectedId, setSelectedId] = React.useState<string | null>(initialScenarioId ?? null);
    const [debouncedQuery, setDebouncedQuery] = React.useState("");

    React.useEffect(() => {
        const handle = window.setTimeout(() => {
            setDebouncedQuery(query.trim());
        }, 250);

        return () => {
            window.clearTimeout(handle);
        };
    }, [query]);

    React.useEffect(() => {
        if (!open) {
            return;
        }

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
    }, [open, initialScenarioId, debouncedQuery]);

    if (!open) {
        return null;
    }

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
                        <strong style={{fontSize: 14, color: "#2a4a6f"}}>Link Scenario</strong>
                        <span style={{fontSize: 12, color: "#5e7795"}}>Visible only for selected reference-capable cell</span>
                    </div>
                    <button type="button" onClick={onClose} style={{height: 30}}>Close</button>
                </div>
                <input
                    autoFocus
                    type="text"
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
                            const selected = items.find((item) => item.id === selectedId);
                            if (selected) {
                                onConfirm(selected);
                            }
                        }}
                    >
                        Confirm Link
                    </button>
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
