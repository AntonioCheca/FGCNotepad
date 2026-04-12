import React from "react";

import {fetchScenarioItems, filterScenarioItems, ScenarioSearchError, ScenarioSearchItem} from "../services/scenarioSearchService";

interface ScenarioLinkPanelProps {
    open: boolean;
    initialScenarioId?: string;
    onClose: () => void;
    onConfirm: (item: ScenarioSearchItem) => void;
}

export function ScenarioLinkPanel({open, initialScenarioId, onClose, onConfirm}: ScenarioLinkPanelProps) {
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [query, setQuery] = React.useState("");
    const [items, setItems] = React.useState<ScenarioSearchItem[]>([]);
    const [selectedId, setSelectedId] = React.useState<string | null>(initialScenarioId ?? null);

    React.useEffect(() => {
        if (!open) {
            return;
        }

        let isMounted = true;
        setLoading(true);
        setError(null);

        fetchScenarioItems()
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
    }, [open, initialScenarioId]);

    const filtered = React.useMemo(() => filterScenarioItems(items, query), [items, query]);

    if (!open) {
        return null;
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
            <div
                style={{
                    width: "min(640px, 92vw)",
                    maxHeight: "80vh",
                    background: "#fff",
                    borderRadius: 8,
                    border: "1px solid #d9d9d9",
                    padding: 12,
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                }}
                onClick={(event) => event.stopPropagation()}
            >
                <div style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
                    <strong>Link Scenario</strong>
                    <button type="button" onClick={onClose}>Close</button>
                </div>
                <input
                    autoFocus
                    type="text"
                    placeholder="Search scenarios"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                />

                <div style={{border: "1px solid #f0f0f0", borderRadius: 6, overflow: "auto", maxHeight: "50vh"}}>
                    {loading ? <div style={{padding: 12}}>Loading scenarios...</div> : null}
                    {!loading && error ? <div style={{padding: 12, color: "#cf1322"}}>{error}</div> : null}
                    {!loading && !error && filtered.length === 0 ? <div style={{padding: 12}}>No scenarios found.</div> : null}
                    {!loading && !error && filtered.length > 0 ? (
                        <div>
                            {filtered.map((item) => {
                                const selected = selectedId === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => setSelectedId(item.id)}
                                        style={{
                                            display: "block",
                                            width: "100%",
                                            textAlign: "left",
                                            padding: 10,
                                            border: "none",
                                            borderBottom: "1px solid #f5f5f5",
                                            background: selected ? "#e6f7ff" : "#fff",
                                        }}
                                    >
                                        <div style={{fontWeight: 600}}>{item.label}</div>
                                        <div style={{fontSize: 12, color: "#8c8c8c"}}>{item.typeLabel} · #{item.id}</div>
                                    </button>
                                );
                            })}
                        </div>
                    ) : null}
                </div>

                <div style={{display: "flex", justifyContent: "flex-end", gap: 8}}>
                    <button type="button" onClick={onClose}>Cancel</button>
                    <button
                        type="button"
                        disabled={!selectedId}
                        onClick={() => {
                            const selected = filtered.find((item) => item.id === selectedId) ?? items.find((item) => item.id === selectedId);
                            if (selected) {
                                onConfirm(selected);
                            }
                        }}
                    >
                        Confirm Link
                    </button>
                </div>
            </div>
        </div>
    );
}
