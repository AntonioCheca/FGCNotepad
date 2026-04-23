import React from "react";

import useMoves from "@/hooks/useMoves";
import {useCharacters} from "@/hooks/useCharacters";
import {WrappedAutocomplete} from "@/src/components/ui/WrappedAutocomplete";
import {MatrixDynamicComboData} from "@/src/features/matrix/model";

interface DynamicComboPanelProps {
    open: boolean;
    initialValue: MatrixDynamicComboData | null;
    moveLabelById: Record<string, string>;
    presentation?: "modal" | "inline";
    onClose: () => void;
    onConfirm: (value: MatrixDynamicComboData, starterLabels: Record<string, string>) => void;
}

interface CharacterOption {
    id: string;
    name: string;
}

interface MoveSearchOption {
    id: string;
    summary: string;
}

type StarterContextPreset = "normal" | "punish_counter" | "counter_hit";

function contextFromPreset(preset: StarterContextPreset): MatrixDynamicComboData["starterContext"] {
    if (preset === "punish_counter") {
        return {isPunishCounter: true, isCounterHit: false};
    }

    if (preset === "counter_hit") {
        return {isPunishCounter: false, isCounterHit: true};
    }

    return {isPunishCounter: false, isCounterHit: false};
}

function presetFromContext(value: MatrixDynamicComboData["starterContext"] | null | undefined): StarterContextPreset {
    if (value?.isPunishCounter) {
        return "punish_counter";
    }

    if (value?.isCounterHit) {
        return "counter_hit";
    }

    return "normal";
}

function normalizeMoveSearchResults(value: unknown): MoveSearchOption[] {
    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .map((item) => {
            if (!item || typeof item !== "object" || Array.isArray(item)) {
                return null;
            }

            const record = item as Record<string, unknown>;
            if (typeof record.id !== "string" && typeof record.id !== "number") {
                return null;
            }

            return {
                id: String(record.id),
                summary: typeof record.summary === "string" ? record.summary : `Move #${String(record.id)}`,
            } satisfies MoveSearchOption;
        })
        .filter((option): option is MoveSearchOption => option !== null);
}

export function DynamicComboPanel({open, initialValue, moveLabelById, presentation = "modal", onClose, onConfirm}: DynamicComboPanelProps) {
    const {characters, loading: charactersLoading} = useCharacters();
    const {searchMoves, getSpecificMove} = useMoves();
    const searchMovesRef = React.useRef(searchMoves);
    const getSpecificMoveRef = React.useRef(getSpecificMove);

    const [selectedCharacter, setSelectedCharacter] = React.useState<CharacterOption | null>(null);
    const [starterQuery, setStarterQuery] = React.useState("");
    const [starterOptions, setStarterOptions] = React.useState<MoveSearchOption[]>([]);
    const [starterSelections, setStarterSelections] = React.useState<MoveSearchOption[]>([]);
    const [searchingMoves, setSearchingMoves] = React.useState(false);
    const [starterPreset, setStarterPreset] = React.useState<StarterContextPreset>(presetFromContext(initialValue?.starterContext));
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        searchMovesRef.current = searchMoves;
    }, [searchMoves]);

    React.useEffect(() => {
        getSpecificMoveRef.current = getSpecificMove;
    }, [getSpecificMove]);

    const characterOptions = React.useMemo<CharacterOption[]>(
        () => (characters as CharacterOption[]).filter((item) => typeof item.id === "string" && typeof item.name === "string"),
        [characters]
    );

    const initialStarterSelections = React.useMemo<MoveSearchOption[]>(
        () =>
            (initialValue?.starterMoveIds ?? []).map((starterMoveId) => ({
                id: starterMoveId,
                summary: moveLabelById[starterMoveId] ?? `Move #${starterMoveId}`,
            })),
        [initialValue, moveLabelById]
    );
    const selectedCharacterName = selectedCharacter?.name ?? "";

    React.useEffect(() => {
        if (!open) {
            return;
        }

        setSelectedCharacter(null);
        setStarterQuery("");
        setStarterOptions([]);
        setStarterSelections(initialStarterSelections);
        setStarterPreset(presetFromContext(initialValue?.starterContext));
        setError(null);
    }, [open, initialValue, initialStarterSelections]);

    React.useEffect(() => {
        if (!open || !initialValue?.starterMoveIds?.length) {
            return;
        }

        const unresolvedMoveIds = initialValue.starterMoveIds.filter((moveId) => !moveLabelById[moveId]);
        if (unresolvedMoveIds.length === 0) {
            return;
        }

        let canceled = false;

        Promise.all(
            unresolvedMoveIds.map(async (moveId) => {
                try {
                    const move = await getSpecificMoveRef.current(moveId);
                    if (!move || typeof move !== "object") {
                        return [moveId, `Move #${moveId}`] as const;
                    }

                    const record = move as Record<string, unknown>;
                    const notation = typeof record.numpad_notation === "string" ? record.numpad_notation : null;
                    const character = typeof record.character === "string" ? record.character : null;
                    return [moveId, notation ? `${character ? `${character} ` : ""}${notation}` : `Move #${moveId}`] as const;
                } catch {
                    return [moveId, `Move #${moveId}`] as const;
                }
            })
        ).then((resolvedLabels) => {
            if (canceled) {
                return;
            }

            const resolvedLabelById = resolvedLabels.reduce<Record<string, string>>((acc, [id, label]) => {
                acc[id] = label;
                return acc;
            }, {});

            setStarterSelections((previous) =>
                previous.map((selection) => ({
                    ...selection,
                    summary: resolvedLabelById[selection.id] ?? selection.summary,
                }))
            );
        });

        return () => {
            canceled = true;
        };
    }, [open, initialValue, moveLabelById]);

    React.useEffect(() => {
        if (!open || !initialValue?.attackerCharacterId || characterOptions.length === 0) {
            return;
        }

        const existing = characterOptions.find((option) => option.id === initialValue.attackerCharacterId) ?? null;
        setSelectedCharacter(existing);
    }, [open, initialValue, characterOptions]);

    React.useEffect(() => {
        if (!open) {
            setStarterOptions([]);
            return;
        }

        let canceled = false;
        const normalizedQuery = starterQuery.trim();
        const backendQuery = selectedCharacterName
            ? `${selectedCharacterName}${normalizedQuery ? ` ${normalizedQuery}` : ""}`
            : normalizedQuery;

        if (backendQuery.length === 0) {
            setStarterOptions([]);
            return;
        }

        const timeoutId = window.setTimeout(() => {
            setSearchingMoves(true);

            searchMovesRef.current(backendQuery)
                .then((results: unknown) => {
                    if (canceled) {
                        return;
                    }

                    const normalized = normalizeMoveSearchResults(results);
                    const filteredByQuery = normalized.filter((option) =>
                        option.summary.toLowerCase().includes(normalizedQuery.toLowerCase())
                    );
                    setStarterOptions(filteredByQuery);
                })
                .catch(() => {
                    if (!canceled) {
                        setStarterOptions([]);
                    }
                })
                .finally(() => {
                    if (!canceled) {
                        setSearchingMoves(false);
                    }
                });
        }, 200);

        return () => {
            canceled = true;
            window.clearTimeout(timeoutId);
        };
    }, [open, starterQuery, selectedCharacterName]);

    if (!open) {
        return null;
    }

    const isInline = presentation === "inline";

    const panelContent = (
        <div
            style={{
                width: isInline ? "100%" : "min(560px, 92vw)",
                maxHeight: isInline ? "unset" : "80vh",
                background: isInline ? "transparent" : "#fff",
                borderRadius: isInline ? 0 : 8,
                border: isInline ? "none" : "1px solid #d9d9d9",
                padding: 12,
                display: "flex",
                flexDirection: "column",
                gap: 10,
                minWidth: 0,
                boxSizing: "border-box",
                overflowX: "hidden",
            }}
            onClick={(event) => event.stopPropagation()}
        >
                <div style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
                    <div style={{display: "grid", gap: 2}}>
                        <strong style={{fontSize: 14, color: "#2a4a6f"}}>Dynamic Combo Cell</strong>
                        <span style={{fontSize: 12, color: "#5e7795"}}>Visible only for selected dynamic combo-capable cell</span>
                    </div>
                    <button type="button" onClick={onClose} style={{height: 30}}>Close</button>
                </div>

                <WrappedAutocomplete<CharacterOption>
                    label="Attacker Character"
                    options={characterOptions}
                    loading={charactersLoading}
                    disablePortal
                    value={selectedCharacter}
                    onChange={(value) => {
                        setSelectedCharacter(value);
                        setError(null);
                    }}
                    getOptionLabel={(option) => option.name}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                />

                <div style={{display: "grid", gap: 6, minWidth: 0}}>
                    <WrappedAutocomplete<MoveSearchOption>
                        label="Search Starter Move"
                        options={starterOptions}
                        loading={searchingMoves}
                        disablePortal
                        value={null}
                        inputValue={starterQuery}
                        onInputChange={(_event, value, reason) => {
                            if (reason === "input" || reason === "clear") {
                                setStarterQuery(value);
                            }
                            setError(null);
                        }}
                        onChange={(value) => {
                            if (!value) {
                                return;
                            }

                            setStarterSelections((previous) => {
                                if (previous.some((item) => item.id === value.id)) {
                                    return previous;
                                }

                                return [...previous, value];
                            });

                            setStarterQuery("");
                            setStarterOptions([]);
                            setError(null);
                        }}
                        getOptionLabel={(option) => option.summary}
                        isOptionEqualToValue={(option, value) => option.id === value.id}
                        filterOptions={(options) => options}
                        noOptionsText={starterQuery.trim().length === 0 ? "Type to search moves" : "No moves found"}
                    />
                    <div style={{display: "grid", gap: 4, border: "1px solid #cfdeec", borderRadius: 8, padding: 8, background: "#fff", minWidth: 0}}>
                        <span style={{fontSize: 12, color: "#595959"}}>Selected Starters</span>
                        {starterSelections.length === 0 ? (
                            <span style={{fontSize: 12, color: "#8c8c8c"}}>No starter moves selected yet.</span>
                        ) : (
                            starterSelections.map((item) => (
                                <div
                                    key={item.id}
                                    style={{display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, minWidth: 0}}
                                >
                                    <span style={{fontSize: 13, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}>{item.summary}</span>
                                    <button
                                        type="button"
                                        style={{flexShrink: 0}}
                                        onClick={() => {
                                            setStarterSelections((prev) => prev.filter((entry) => entry.id !== item.id));
                                        }}
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <label style={{display: "grid", gap: 4}}>
                    <span style={{fontSize: 12, color: "#595959"}}>Starter Context</span>
                    <select value={starterPreset} onChange={(event) => setStarterPreset(event.target.value as StarterContextPreset)}>
                        <option value="normal">Normal Hit</option>
                        <option value="punish_counter">Punish Counter</option>
                        <option value="counter_hit">Counter Hit</option>
                    </select>
                </label>

                {error ? <div style={{fontSize: 12, color: "#cf1322"}}>{error}</div> : null}

                <div style={{display: "flex", justifyContent: "flex-end", gap: 8}}>
                    <button type="button" onClick={onClose} style={{height: 30}}>Cancel</button>
                    <button
                        type="button"
                        style={{
                            height: 30,
                            borderRadius: 6,
                            border: "1px solid #2c5e93",
                            background: "linear-gradient(135deg, #356ba4 0%, #4a80b8 100%)",
                            color: "#fff",
                            fontWeight: 600,
                        }}
                        onClick={() => {
                            if (!selectedCharacter) {
                                setError("Select an attacker character.");
                                return;
                            }

                            if (starterSelections.length === 0) {
                                setError("Add at least one starter move.");
                                return;
                            }

                            const starterContext = contextFromPreset(starterPreset);
                            const starterLabels = starterSelections.reduce<Record<string, string>>((acc, selection) => {
                                acc[selection.id] = selection.summary;
                                return acc;
                            }, {});
                            onConfirm({
                                attackerCharacterId: selectedCharacter.id,
                                starterMoveIds: starterSelections.map((item) => item.id),
                                starterContext,
                            }, starterLabels);
                        }}
                    >
                        Save Dynamic Combo
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
