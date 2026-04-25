import React from "react";

import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppChip} from "@/src/components/ui/AppChip";
import {AppFormControl} from "@/src/components/ui/AppFormControl";
import {AppInputLabel} from "@/src/components/ui/AppInputLabel";
import {AppMenuItem} from "@/src/components/ui/AppMenuItem";
import {AppSelect} from "@/src/components/ui/AppSelect";
import {AppTextField} from "@/src/components/ui/AppTextField";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {WrappedAutocomplete} from "@/src/components/ui/WrappedAutocomplete";
import {CheckCircleOutlineIcon} from "@/src/components/ui/AppIcons";
import {ActionBar} from "@/src/components/ui/tactical/ActionBar";
import {InlineNotice} from "@/src/components/ui/tactical/InlineNotice";
import {SectionCard} from "@/src/components/ui/tactical/SectionCard";
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

    const selectedDefender = React.useMemo(
        () => characterOptions.find((character) => character.id === defenderCharacterId) ?? null,
        [characterOptions, defenderCharacterId]
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
        const backendQuery = query === "" ? " " : query;

        let canceled = false;
        setIsSearchingMoves(true);

        searchMovesRef.current(backendQuery, attackerCharacterId)
            .then((results) => {
                if (canceled) {
                    return;
                }

                const normalized = normalizeMoveListResults(results);
                const attackerPrefix = `${selectedAttacker.name.toLowerCase()} `;
                setMoveOptions(normalized.filter((option) => option.summary.toLowerCase().startsWith(attackerPrefix)));
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

    const canSubmit = Boolean(name.trim()) && Boolean(defenderCharacterId) && Boolean(attackerCharacterId) && Boolean(triggerMove?.id);

    return (
        <AppBox sx={{display: "grid", gap: {xs: 1.25, md: 1.5}, width: "100%"}}>
            <SectionCard
                title="Scenario Setup"
                description="Lock attacker and trigger first, then complete defender and type context."
                tone="default"
                variant="input"
            >
                <AppBox sx={{display: "grid", gap: 1}}>
                    <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", md: "minmax(0, 1fr) 220px"}, gap: 1, alignItems: "stretch"}}>
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

                        <AppFormControl size="small">
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
                    </AppBox>

                    <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", md: "minmax(240px, 1fr) minmax(300px, 1.3fr) minmax(240px, 1fr)"}, gap: 1}}>
                        <WrappedAutocomplete<CharacterOption>
                            label="Attacker Character"
                            options={characterOptions}
                            value={selectedAttacker}
                            loading={charactersLoading}
                            disableClearable={false}
                            getOptionLabel={(option) => option?.name ?? ""}
                            onChange={(value) => {
                                setAttackerCharacterId(value?.id ?? "");
                                setTriggerMoveQuery("");
                                setTriggerMove(null);
                                setError(null);
                            }}
                        />

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

                        <WrappedAutocomplete<CharacterOption>
                            label="Defender Character"
                            options={characterOptions}
                            value={selectedDefender}
                            loading={charactersLoading}
                            disableClearable={false}
                            getOptionLabel={(option) => option?.name ?? ""}
                            onChange={(value) => {
                                setDefenderCharacterId(value?.id ?? "");
                                setError(null);
                            }}
                        />
                    </AppBox>
                </AppBox>
            </SectionCard>

            <SectionCard
                title="Matrix Workspace"
                description="Keep existing matrix flow; tune outcomes and dynamic combo cells with the refreshed tactical palette."
                tone="raised"
                variant="review"
            >
                <ActionBar>
                    <AppChip size="small" variant="outlined" label={scenarioType === "aggregated_oki" ? "Aggregated columns locked" : "Standard matrix editing"} />
                    <AppButton
                        type="button"
                        variant="outlined"
                        color="secondary"
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
                </ActionBar>

                <AppBox sx={{p: {xs: 0.75, md: 0.9}, borderRadius: 1.5, border: "1px solid", borderColor: "fgc.border.default", backgroundColor: "fgc.surface.sunken"}}>
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
            </SectionCard>

            {error ? <InlineNotice severity="error">{error}</InlineNotice> : null}

            <SectionCard
                title="Finalize"
                description="Submit one primary action once setup and matrix are valid."
                tone="default"
                variant="finalize"
            >
                <AppBox sx={{display: "flex", gap: 0.6, alignItems: "center", flexWrap: "wrap"}}>
                    <CheckCircleOutlineIcon fontSize="small" color={canSubmit ? "success" : "disabled"} />
                    <AppTypography variant="body2" color="text.secondary">
                        Ready: {canSubmit ? "yes" : "missing scenario name, attacker, defender, or trigger move"}
                    </AppTypography>
                </AppBox>
                <AppBox sx={{display: "flex", justifyContent: "flex-end"}}>
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
            </SectionCard>
        </AppBox>
    );
}
