import React from "react";

import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppFormControl} from "@/src/components/ui/AppFormControl";
import {AppInputLabel} from "@/src/components/ui/AppInputLabel";
import {AppMenuItem} from "@/src/components/ui/AppMenuItem";
import {AppPaper} from "@/src/components/ui/AppPaper";
import {AppSelect} from "@/src/components/ui/AppSelect";
import {AppTextField} from "@/src/components/ui/AppTextField";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {WrappedAutocomplete} from "@/src/components/ui/WrappedAutocomplete";
import {useCharacters} from "@/hooks/useCharacters";
import useMoves from "@/hooks/useMoves";
import {ScenarioSavePayload, ScenarioType} from "@/hooks/useScenarios";
import {MatrixDynamicComboPayload, MatrixPayload} from "@/src/types/matrixPayload";
import {createDefaultMatrixPayload} from "@/src/features/matrix/serialization/serializeMatrixPayload";
import {MatrixEditorShell} from "@/src/features/matrix/editor";
import {enforceAggregatedDefenseColumns} from "@/src/features/matrix/aggregation/aggregatedDefenseCatalog";

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
    onResolveDynamicCells?: () => Promise<MatrixPayload>;
    onResolveDynamicComboCell?: (dynamicCombo: MatrixDynamicComboPayload) => Promise<number | null>;
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

export function ScenarioEditorForm({
    initialValue,
    submitLabel,
    onSubmit,
    onResolveDynamicCells,
    onResolveDynamicComboCell,
}: ScenarioEditorFormProps) {
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
    const [resolvingDynamicCells, setResolvingDynamicCells] = React.useState(false);

    React.useEffect(() => {
        if (scenarioType !== "aggregated_oki") {
            return;
        }

        setMatrix((current) => enforceAggregatedDefenseColumns(current));
    }, [scenarioType]);

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
        <AppBox sx={{display: "grid", gap: 2}}>
            <AppPaper variant="outlined" sx={{p: {xs: 1.5, md: 2}, borderRadius: 2.5}}>
                <AppBox sx={{display: "grid", gap: 1.5}}>
                    <AppTypography variant="subtitle2">Scenario Setup</AppTypography>

                    <AppTextField
                        label="Scenario Name"
                        value={name}
                        onChange={(event) => {
                            setName(event.target.value);
                            setError(null);
                        }}
                        required
                        size="small"
                    />

                    <AppFormControl size="small" sx={{maxWidth: 280}}>
                        <AppInputLabel id="scenario-type-label">Scenario Type</AppInputLabel>
                        <AppSelect
                            labelId="scenario-type-label"
                            label="Scenario Type"
                            value={scenarioType}
                            onChange={(event) => setScenarioType(event.target.value as ScenarioType)}
                        >
                            <AppMenuItem value="oki">Oki</AppMenuItem>
                            <AppMenuItem value="aggregated_oki">Aggregated Oki</AppMenuItem>
                            <AppMenuItem value="blockstun">Blockstun</AppMenuItem>
                        </AppSelect>
                    </AppFormControl>

                    <AppBox sx={{display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 1.5}}>
                        <AppFormControl size="small">
                            <AppInputLabel id="scenario-defender-label">Defender Character</AppInputLabel>
                            <AppSelect
                                labelId="scenario-defender-label"
                                label="Defender Character"
                                value={defenderCharacterId}
                                onChange={(event) => {
                                    setDefenderCharacterId(event.target.value as string);
                                    setError(null);
                                }}
                                disabled={charactersLoading}
                            >
                                <AppMenuItem value="">Select defender</AppMenuItem>
                                {characterOptions.map((character) => (
                                    <AppMenuItem key={character.id} value={character.id}>{character.name}</AppMenuItem>
                                ))}
                            </AppSelect>
                        </AppFormControl>

                        <AppFormControl size="small">
                            <AppInputLabel id="scenario-attacker-label">Attacker Character</AppInputLabel>
                            <AppSelect
                                labelId="scenario-attacker-label"
                                label="Attacker Character"
                                value={attackerCharacterId}
                                onChange={(event) => {
                                    setAttackerCharacterId(event.target.value as string);
                                    setTriggerMoveQuery("");
                                    setTriggerMove(null);
                                    setError(null);
                                }}
                                disabled={charactersLoading}
                            >
                                <AppMenuItem value="">Select attacker</AppMenuItem>
                                {characterOptions.map((character) => (
                                    <AppMenuItem key={character.id} value={character.id}>{character.name}</AppMenuItem>
                                ))}
                            </AppSelect>
                        </AppFormControl>
                    </AppBox>

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
                </AppBox>
            </AppPaper>

            <AppPaper variant="outlined" sx={{p: {xs: 1.5, md: 2}, borderRadius: 2.5}}>
                <AppBox sx={{display: "grid", gap: 1}}>
                    <AppBox sx={{display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1, flexWrap: "wrap"}}>
                        <AppTypography variant="h6">Matrix</AppTypography>
                        <AppTypography variant="body2" color="text.secondary">Configure outcomes and dynamic combo cells.</AppTypography>
                    </AppBox>
                    <AppButton
                        type="button"
                        disabled={!onResolveDynamicCells || resolvingDynamicCells || submitting}
                        onClick={async () => {
                            if (!onResolveDynamicCells) {
                                return;
                            }

                            setResolvingDynamicCells(true);
                            setError(null);
                            try {
                                const resolvedMatrix = await onResolveDynamicCells();
                                setMatrix(resolvedMatrix);
                            } catch {
                                setError("Unable to refresh dynamic combo values.");
                            } finally {
                                setResolvingDynamicCells(false);
                            }
                        }}
                    >
                        {onResolveDynamicCells
                            ? (resolvingDynamicCells ? "Refreshing Dynamic Combos..." : "Refresh Dynamic Combos")
                            : "Refresh Dynamic Combos (Save First)"}
                    </AppButton>
                    <MatrixEditorShell
                        matrix={matrix}
                        onMatrixChange={setMatrix}
                        editable={true}
                        allowColumnStructureEdit={scenarioType !== "aggregated_oki"}
                        allowColumnAxisLabelEdit={scenarioType !== "aggregated_oki"}
                        allowColumnLayerEdit={scenarioType !== "aggregated_oki"}
                        onRefreshDynamicCells={onResolveDynamicCells}
                        onResolveDynamicComboCell={onResolveDynamicComboCell}
                    />
                </AppBox>
            </AppPaper>

            {error ? <AppTypography color="error">{error}</AppTypography> : null}

            <AppBox sx={{display: "flex", justifyContent: "flex-end", pt: 0.5}}>
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
            </AppBox>
        </AppBox>
    );
}
