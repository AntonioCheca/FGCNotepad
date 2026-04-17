import React from "react";

import {AppButton} from "@/src/components/ui/AppButton";
import {AppTextField} from "@/src/components/ui/AppTextField";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {WrappedAutocomplete} from "@/src/components/ui/WrappedAutocomplete";
import {useCharacters} from "@/hooks/useCharacters";
import useMoves from "@/hooks/useMoves";
import {ScenarioSavePayload, ScenarioType} from "@/hooks/useScenarios";
import {MatrixPayload} from "@/src/types/matrixPayload";
import {createDefaultMatrixPayload} from "@/src/features/matrix/serialization/serializeMatrixPayload";
import {MatrixEditorShell} from "@/src/features/matrix/editor";

interface MoveOption {
    id: string;
    summary: string;
    characterId: string;
}

interface CharacterOption {
    id: string;
    name: string;
}

interface ScenarioEditorFormProps {
    initialValue?: Partial<ScenarioSavePayload>;
    submitLabel: string;
    onSubmit: (payload: ScenarioSavePayload) => Promise<void>;
}

function normalizeMoveListResults(value: unknown): MoveOption[] {
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

            const summary = typeof record.summary === "string" ? record.summary : "";
            if (summary === "") {
                return null;
            }

            const characterName = summary.includes(" ") ? summary.split(" ")[0] : "";

            return {
                id: String(record.id),
                summary,
                characterId: characterName,
            } satisfies MoveOption;
        })
        .filter((option): option is MoveOption => option !== null);
}

export function ScenarioEditorForm({initialValue, submitLabel, onSubmit}: ScenarioEditorFormProps) {
    const {characters, loading: charactersLoading} = useCharacters();
    const {searchMoves, getSpecificMove} = useMoves();
    const searchMovesRef = React.useRef(searchMoves);
    const getSpecificMoveRef = React.useRef(getSpecificMove);

    const [name, setName] = React.useState(initialValue?.name ?? "");
    const [scenarioType, setScenarioType] = React.useState<ScenarioType>(initialValue?.scenarioType ?? "oki");
    const [defenderCharacterId, setDefenderCharacterId] = React.useState(initialValue?.defenderCharacterId ?? "");
    const [attackerCharacterId, setAttackerCharacterId] = React.useState(initialValue?.attackerCharacterId ?? "");
    const [triggerMove, setTriggerMove] = React.useState<MoveOption | null>(null);
    const [triggerMoveQuery, setTriggerMoveQuery] = React.useState("");
    const [moveOptions, setMoveOptions] = React.useState<MoveOption[]>([]);
    const [isSearchingMoves, setIsSearchingMoves] = React.useState(false);
    const [matrix, setMatrix] = React.useState<MatrixPayload>(initialValue?.matrix ?? createDefaultMatrixPayload());
    const [error, setError] = React.useState<string | null>(null);
    const [submitting, setSubmitting] = React.useState(false);

    React.useEffect(() => {
        searchMovesRef.current = searchMoves;
        getSpecificMoveRef.current = getSpecificMove;
    }, [searchMoves, getSpecificMove]);

    const characterOptions = React.useMemo<CharacterOption[]>(
        () => (characters as CharacterOption[]).filter((character) => typeof character.id === "string" && typeof character.name === "string"),
        [characters]
    );

    const selectedAttacker = React.useMemo(
        () => characterOptions.find((character) => character.id === attackerCharacterId) ?? null,
        [characterOptions, attackerCharacterId]
    );

    React.useEffect(() => {
        if (!initialValue?.triggerMoveId || !initialValue?.matrix) {
            return;
        }

        if (!initialValue.triggerMoveId) {
            return;
        }

        getSpecificMoveRef.current(initialValue.triggerMoveId)
            .then((result) => {
                const record = result as Record<string, unknown>;
                const notation = typeof record.numpad_notation === "string" ? record.numpad_notation : initialValue.triggerMoveId;
                const character = typeof record.character === "string" ? record.character : "";
                setTriggerMove({
                    id: initialValue.triggerMoveId as string,
                    summary: character ? `${character} ${notation}` : notation,
                    characterId: "",
                });
            })
            .catch(() => {
                setTriggerMove(null);
            });
    }, [initialValue?.triggerMoveId, initialValue?.matrix]);

    React.useEffect(() => {
        if (!attackerCharacterId) {
            setMoveOptions([]);
            setTriggerMove(null);
            setTriggerMoveQuery("");
            return;
        }

        if (!selectedAttacker) {
            setMoveOptions([]);
            return;
        }

        const query = triggerMoveQuery.trim();
        const backendQuery = query === "" ? selectedAttacker.name : `${selectedAttacker.name} ${query}`;

        let canceled = false;
        setIsSearchingMoves(true);

        searchMovesRef.current(backendQuery)
            .then((results) => {
                if (canceled) {
                    return;
                }

                setMoveOptions(normalizeMoveListResults(results));
            })
            .catch(() => {
                if (!canceled) {
                    setMoveOptions([]);
                }
            })
            .finally(() => {
                if (!canceled) {
                    setIsSearchingMoves(false);
                }
            });

        return () => {
            canceled = true;
        };
    }, [attackerCharacterId, selectedAttacker, triggerMoveQuery]);

    React.useEffect(() => {
        if (!attackerCharacterId || !triggerMove) {
            return;
        }

        const stillValid = moveOptions.some((option) => option.id === triggerMove.id);
        if (!stillValid) {
            setTriggerMove(null);
        }
    }, [attackerCharacterId, moveOptions, triggerMove]);

    return (
        <div style={{display: "grid", gap: 16}}>
            <AppTextField
                label="Scenario Name"
                value={name}
                onChange={(event) => {
                    setName(event.target.value);
                    setError(null);
                }}
                required
            />

            <div style={{display: "grid", gap: 6}}>
                <AppTypography variant="body2">Scenario Type</AppTypography>
                <select
                    value={scenarioType}
                    onChange={(event) => setScenarioType(event.target.value as ScenarioType)}
                    style={{height: 40, borderRadius: 6, border: "1px solid #d9d9d9", padding: "0 10px"}}
                >
                    <option value="oki">Oki</option>
                    <option value="blockstun">Blockstun</option>
                </select>
            </div>

            <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12}}>
                <div style={{display: "grid", gap: 6}}>
                    <AppTypography variant="body2">Defender Character</AppTypography>
                    <select
                        value={defenderCharacterId}
                        onChange={(event) => {
                            setDefenderCharacterId(event.target.value);
                            setError(null);
                        }}
                        disabled={charactersLoading}
                        style={{height: 40, borderRadius: 6, border: "1px solid #d9d9d9", padding: "0 10px"}}
                    >
                        <option value="">Select defender</option>
                        {characterOptions.map((character) => (
                            <option key={character.id} value={character.id}>{character.name}</option>
                        ))}
                    </select>
                </div>

                <div style={{display: "grid", gap: 6}}>
                    <AppTypography variant="body2">Attacker Character</AppTypography>
                    <select
                        value={attackerCharacterId}
                        onChange={(event) => {
                            setAttackerCharacterId(event.target.value);
                            setTriggerMoveQuery("");
                            setTriggerMove(null);
                            setError(null);
                        }}
                        disabled={charactersLoading}
                        style={{height: 40, borderRadius: 6, border: "1px solid #d9d9d9", padding: "0 10px"}}
                    >
                        <option value="">Select attacker</option>
                        {characterOptions.map((character) => (
                            <option key={character.id} value={character.id}>{character.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <WrappedAutocomplete<MoveOption>
                label="Trigger Move"
                value={triggerMove}
                options={moveOptions}
                loading={isSearchingMoves}
                getOptionLabel={(option) => option.summary}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                onChange={(value) => {
                    setTriggerMove(value);
                    setError(null);
                }}
                disabled={!attackerCharacterId}
                openOnFocus
                inputValue={attackerCharacterId ? triggerMoveQuery : ""}
                onInputChange={(_event, value) => {
                    if (!attackerCharacterId) {
                        return;
                    }

                    setTriggerMoveQuery(value);
                }}
                noOptionsText={!attackerCharacterId ? "Select attacker first" : "No moves found"}
            />

            <div style={{display: "grid", gap: 8}}>
                <AppTypography variant="h6">Matrix</AppTypography>
                <MatrixEditorShell
                    matrix={matrix}
                    onMatrixChange={setMatrix}
                    editable={true}
                />
            </div>

            {error ? <AppTypography color="error">{error}</AppTypography> : null}

            <div style={{display: "flex", justifyContent: "flex-end"}}>
                <AppButton
                    type="button"
                    disabled={submitting}
                    onClick={async () => {
                        const trimmedName = name.trim();
                        if (!trimmedName) {
                            setError("Scenario name is required.");
                            return;
                        }

                        if (!defenderCharacterId || !attackerCharacterId) {
                            setError("Select both defender and attacker characters.");
                            return;
                        }

                        if (!triggerMove?.id) {
                            setError("Select a trigger move.");
                            return;
                        }

                        setSubmitting(true);
                        setError(null);
                        try {
                            await onSubmit({
                                name: trimmedName,
                                scenarioType,
                                defenderCharacterId,
                                attackerCharacterId,
                                triggerMoveId: triggerMove.id,
                                matrix,
                            });
                        } catch (err) {
                            const message =
                                typeof err === "object" && err !== null && "response" in err
                                    ? (err as {response?: {data?: {error?: string}}}).response?.data?.error
                                    : null;
                            setError(message ?? "Unable to save scenario.");
                        } finally {
                            setSubmitting(false);
                        }
                    }}
                >
                    {submitting ? "Saving..." : submitLabel}
                </AppButton>
            </div>
        </div>
    );
}
