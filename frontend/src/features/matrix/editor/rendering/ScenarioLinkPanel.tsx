import React from "react";

import {MatrixReferencePreValue} from "@/src/features/matrix/model";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppTextField} from "@/src/components/ui/AppTextField";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {fetchScenarioItems, ScenarioSearchError, ScenarioSearchItem} from "../services/scenarioSearchService";
import {DynamicComboPanel} from "./DynamicComboPanel";
import {MatrixEditorPanelFrame} from "./MatrixEditorPanelFrame";

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

const PANEL_TITLE_ID = "scenario-link-panel-title";

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

    return (
        <MatrixEditorPanelFrame presentation={presentation} titleId={PANEL_TITLE_ID} width="640px" gap={8} onClose={onClose}>
                <AppBox sx={{display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1.5}}>
                    <AppBox sx={{display: "grid", gap: 0.25}}>
                        <AppTypography id={PANEL_TITLE_ID} component="strong" variant="subtitle2" sx={(theme) => ({color: theme.fgc.text.primary})}>Link Scenario</AppTypography>
                        <AppTypography variant="caption" sx={(theme) => ({color: theme.fgc.text.secondary})}>Visible only for selected reference-capable cell</AppTypography>
                    </AppBox>
                    <AppButton type="button" size="small" variant="outlined" onClick={onClose}>Close</AppButton>
                </AppBox>
                <AppTextField
                    size="small"
                    aria-label="Search scenarios"
                    placeholder="Search scenarios"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                />

                <AppBox sx={(theme) => ({border: `1px solid ${theme.fgc.border.default}`, borderRadius: 1, overflowY: "auto", overflowX: "hidden", maxHeight: isInline ? "44vh" : "50vh", backgroundColor: theme.fgc.surface.base, minWidth: 0})}>
                    {loading ? <AppBox sx={{p: 1.5}}>Loading scenarios...</AppBox> : null}
                    {!loading && error ? <AppBox sx={(theme) => ({p: 1.5, color: theme.fgc.feedback.error})}>{error}</AppBox> : null}
                    {!loading && !error && items.length === 0 ? <AppBox sx={{p: 1.5}}>No scenarios found.</AppBox> : null}
                    {!loading && !error && items.length > 0 ? (
                        <AppBox>
                            {items.map((item) => {
                                const selected = selectedId === item.id;
                                return (
                                    <AppButton
                                        key={item.id}
                                        type="button"
                                        variant="text"
                                        fullWidth
                                        onClick={() => setSelectedId(item.id)}
                                        sx={(theme) => ({
                                            display: "block",
                                            minWidth: 0,
                                            textAlign: "left",
                                            justifyContent: "flex-start",
                                            p: 1.25,
                                            border: "none",
                                            borderRadius: 0,
                                            borderBottom: `1px solid ${theme.fgc.border.subtle}`,
                                            backgroundColor: selected ? theme.fgc.selection.hover : theme.fgc.surface.base,
                                            color: theme.fgc.text.primary,
                                            textTransform: "none",
                                            "&:hover": {backgroundColor: theme.fgc.selection.hover},
                                        })}
                                    >
                                        <AppTypography variant="body2" sx={{fontWeight: 600}}>{item.label}</AppTypography>
                                        <AppTypography variant="caption" sx={(theme) => ({color: theme.fgc.text.muted})}>{item.typeLabel} · #{item.id}</AppTypography>
                                    </AppButton>
                                );
                            })}
                        </AppBox>
                    ) : null}
                </AppBox>

                <AppBox sx={(theme) => ({
                    display: "grid",
                    gap: 1,
                    border: `1px solid ${theme.fgc.border.default}`,
                    borderRadius: 1,
                    p: 1.25,
                    backgroundColor: theme.fgc.surface.base,
                    "& .scenario-link-control": {
                        height: 34,
                        borderRadius: 1,
                        border: `1px solid ${theme.fgc.border.default}`,
                        padding: "0 10px",
                        backgroundColor: theme.fgc.control.default,
                        color: theme.fgc.text.primary,
                    },
                })}>
                    <AppBox component="label" sx={{display: "grid", gap: 0.5}}>
                        <AppTypography variant="caption" sx={(theme) => ({color: theme.fgc.text.secondary})}>Pre-value Added Before Linked EV</AppTypography>
                        <select
                            className="scenario-link-control"
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
                    </AppBox>

                    {preValueKind === "static" ? (
                        <AppBox component="label" sx={{display: "grid", gap: 0.5}}>
                            <AppTypography variant="caption" sx={(theme) => ({color: theme.fgc.text.secondary})}>Static Pre-value</AppTypography>
                            <AppTextField
                                size="small"
                                type="number"
                                value={staticPreValue}
                                onChange={(event) => {
                                    setStaticPreValue(event.target.value);
                                    setError(null);
                                }}
                            />
                        </AppBox>
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
                </AppBox>

                <AppBox sx={{display: "flex", justifyContent: "flex-end", gap: 1, flexWrap: "wrap"}}>
                    <AppButton type="button" size="small" variant="outlined" onClick={onClose}>Cancel</AppButton>
                    <AppButton
                        type="button"
                        size="small"
                        variant="contained"
                        disabled={!selectedId}
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
                    </AppButton>
                    {initialScenarioId && onRemove ? (
                        <AppButton
                            type="button"
                            size="small"
                            variant="outlined"
                            color="error"
                            onClick={onRemove}
                        >
                            Remove Link
                        </AppButton>
                    ) : null}
                </AppBox>
        </MatrixEditorPanelFrame>
    );
}
