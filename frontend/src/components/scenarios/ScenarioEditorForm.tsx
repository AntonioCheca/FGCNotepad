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
import {ScenarioCharacterStatusPayload, ScenarioComboContextPayload, ScenarioPositionLock, ScenarioSavePayload, ScenarioType, useScenarios} from "@/hooks/useScenarios";
import {MatrixDynamicComboPayload, MatrixPayload} from "@/src/types/matrixPayload";
import {MatrixLinkedCellResolution} from "@/src/features/matrix/model";
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
    initialValue?: Partial<ScenarioSavePayload> & {triggerMoveLabel?: string | null};
    submitLabel: string;
    onSubmit: (payload: ScenarioSavePayload) => Promise<void>;
    onResolveDynamicCells?: () => Promise<MatrixPayload>;
    onResolveDynamicComboCell?: (dynamicCombo: MatrixDynamicComboPayload) => Promise<number | null>;
    currentScenarioId?: string | null;
    linkedCellResolutions?: Record<string, MatrixLinkedCellResolution>;
}

interface ScenarioFormDraft {
    name: string;
    scenarioType: ScenarioType;
    defenderCharacterId: string;
    attackerCharacterId: string;
    triggerMove: MoveOption | null;
    triggerMoveQuery: string;
    matrix: MatrixPayload;
    comboContext: ScenarioComboContextPayload;
}

const DEFAULT_COMBO_CONTEXT: ScenarioComboContextPayload = {
    positionLock: "viewer_default_midscreen",
    characterStatuses: [],
};

function isScenarioType(value: unknown): value is ScenarioType {
    return value === "oki" || value === "blockstun" || value === "aggregated_oki";
}

function isMoveOption(value: unknown): value is MoveOption {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return false;
    }

    const record = value as Record<string, unknown>;
    return typeof record.id === "string" && typeof record.summary === "string" && typeof record.characterId === "string";
}

function isMatrixPayload(value: unknown): value is MatrixPayload {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return false;
    }

    const record = value as Record<string, unknown>;
    const axes = record.axes as {rows?: unknown} | undefined;

    return record.kind === "matrix-editor" && Array.isArray(axes?.rows) && Array.isArray(record.cells);
}

function isPositionLock(value: unknown): value is ScenarioPositionLock {
    return value === "viewer_default_midscreen" || value === "corner" || value === "midscreen";
}

function parseComboContext(value: unknown): ScenarioComboContextPayload {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return DEFAULT_COMBO_CONTEXT;
    }

    const record = value as Record<string, unknown>;
    const statuses = Array.isArray(record.characterStatuses)
        ? record.characterStatuses
            .map((status) => {
                if (!status || typeof status !== "object" || Array.isArray(status)) {
                    return null;
                }

                const statusRecord = status as Record<string, unknown>;
                const objectName = statusRecord.object_name;
                const statusRequired = statusRecord.status_required;
                if (typeof objectName !== "string" || (typeof statusRequired !== "string" && typeof statusRequired !== "number" && typeof statusRequired !== "boolean")) {
                    return null;
                }

                return {object_name: objectName, status_required: statusRequired} satisfies ScenarioCharacterStatusPayload;
            })
            .filter((status): status is ScenarioCharacterStatusPayload => status !== null)
        : [];

    return {
        positionLock: isPositionLock(record.positionLock) ? record.positionLock : "viewer_default_midscreen",
        characterStatuses: statuses,
    };
}

function parseScenarioFormDraft(value: string | null): ScenarioFormDraft | null {
    if (!value) {
        return null;
    }

    try {
        const parsed = JSON.parse(value) as Record<string, unknown>;
        if (!isScenarioType(parsed.scenarioType) || !isMatrixPayload(parsed.matrix)) {
            return null;
        }

        return {
            name: typeof parsed.name === "string" ? parsed.name : "",
            scenarioType: parsed.scenarioType,
            defenderCharacterId: typeof parsed.defenderCharacterId === "string" ? parsed.defenderCharacterId : "",
            attackerCharacterId: typeof parsed.attackerCharacterId === "string" ? parsed.attackerCharacterId : "",
            triggerMove: isMoveOption(parsed.triggerMove) ? parsed.triggerMove : null,
            triggerMoveQuery: typeof parsed.triggerMoveQuery === "string" ? parsed.triggerMoveQuery : "",
            matrix: parsed.matrix,
            comboContext: parseComboContext(parsed.comboContext),
        };
    } catch {
        return null;
    }
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
    currentScenarioId = null,
    linkedCellResolutions,
}: ScenarioEditorFormProps) {
    const {characters, loading: charactersLoading} = useCharacters();
    const {searchMoves, getSpecificMove} = useMoves();
    const {getComboContextCatalog} = useScenarios();
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
    const [comboContext, setComboContext] = React.useState<ScenarioComboContextPayload>(initialValue?.comboContext ?? DEFAULT_COMBO_CONTEXT);
    const [statusObjectName, setStatusObjectName] = React.useState("");
    const [statusRequired, setStatusRequired] = React.useState("");
    const [statusCatalog, setStatusCatalog] = React.useState<Array<{name: string; status_type: "integer" | "boolean"; max_status: number | null}>>([]);
    const [error, setError] = React.useState<string | null>(null);
    const [submitting, setSubmitting] = React.useState(false);
    const [resolvingDynamicCells, setResolvingDynamicCells] = React.useState(false);
    const draftStorageKey = React.useMemo(() => `scenarioDraft:${currentScenarioId ?? "new"}`, [currentScenarioId]);
    const draftLoadedRef = React.useRef(false);

    React.useEffect(() => {
        if (draftLoadedRef.current) {
            return;
        }

        draftLoadedRef.current = true;
        if (typeof window === "undefined") {
            return;
        }

        const draft = parseScenarioFormDraft(window.localStorage.getItem(draftStorageKey));
        if (!draft) {
            return;
        }

        setName(draft.name);
        setScenarioType(draft.scenarioType);
        setDefenderCharacterId(draft.defenderCharacterId);
        setAttackerCharacterId(draft.attackerCharacterId);
        setTriggerMove(draft.triggerMove);
        setTriggerMoveQuery(draft.triggerMoveQuery);
        setMatrix(draft.matrix);
        setComboContext(draft.comboContext);
    }, [draftStorageKey]);

    React.useEffect(() => {
        let canceled = false;
        getComboContextCatalog()
            .then((catalog) => {
                if (!canceled) {
                    setStatusCatalog(catalog.characterStatuses);
                }
            })
            .catch(() => {
                if (!canceled) {
                    setStatusCatalog([]);
                }
            });

        return () => {
            canceled = true;
        };
    }, [getComboContextCatalog]);

    React.useEffect(() => {
        if (!draftLoadedRef.current || typeof window === "undefined") {
            return;
        }

        window.localStorage.setItem(draftStorageKey, JSON.stringify({
            name,
            scenarioType,
            defenderCharacterId,
            attackerCharacterId,
            triggerMove,
            triggerMoveQuery,
            matrix,
            comboContext,
        } satisfies ScenarioFormDraft));
    }, [attackerCharacterId, comboContext, defenderCharacterId, draftStorageKey, matrix, name, scenarioType, triggerMove, triggerMoveQuery]);

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

    const selectedStatusDefinition = React.useMemo(
        () => statusCatalog.find((status) => status.name === statusObjectName) ?? null,
        [statusCatalog, statusObjectName]
    );

    React.useEffect(() => {
        if (!initialValue?.triggerMoveId) {
            return;
        }

        const fallbackSummary = initialValue.triggerMoveLabel?.trim() || initialValue.triggerMoveId;

        getSpecificMoveRef.current(initialValue.triggerMoveId)
            .then((result) => {
                const record = result as Record<string, unknown>;
                const notation = typeof record.numpad_notation === "string" ? record.numpad_notation : fallbackSummary;
                const character = typeof record.character === "string" ? record.character : "";
                const summary = character ? `${character} ${notation}` : notation;
                setTriggerMove({
                    id: initialValue.triggerMoveId as string,
                    summary,
                    characterId: "",
                });
                setTriggerMoveQuery(summary);
            })
            .catch(() => {
                setTriggerMove({
                    id: initialValue.triggerMoveId as string,
                    summary: fallbackSummary,
                    characterId: "",
                });
                setTriggerMoveQuery(fallbackSummary);
            });
    }, [initialValue?.triggerMoveId, initialValue?.triggerMoveLabel]);

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
                                setTriggerMoveQuery(value?.summary ?? "");
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
                title="Combo Environment"
                description="Lock only scenario-wide combo assumptions that are part of the setup. Leave normal cases viewer-controlled."
                tone="default"
                variant="input"
            >
                <AppBox sx={{display: "grid", gap: 1}}>
                    <AppFormControl size="small">
                        <AppInputLabel id="combo-position-lock-label">Position Lock</AppInputLabel>
                        <AppSelect
                            labelId="combo-position-lock-label"
                            label="Position Lock"
                            value={comboContext.positionLock}
                            onChange={(event) => setComboContext((current) => ({...current, positionLock: event.target.value as ScenarioPositionLock}))}
                        >
                            <AppMenuItem value="viewer_default_midscreen">Viewer decides, default midscreen</AppMenuItem>
                            <AppMenuItem value="corner">Always corner</AppMenuItem>
                            <AppMenuItem value="midscreen">Always midscreen</AppMenuItem>
                        </AppSelect>
                    </AppFormControl>

                    <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", md: "minmax(220px, 1fr) minmax(160px, 0.6fr) auto"}, gap: 1, alignItems: "center"}}>
                        <AppFormControl size="small">
                            <AppInputLabel id="combo-status-object-label">Character Status Lock</AppInputLabel>
                            <AppSelect
                                labelId="combo-status-object-label"
                                label="Character Status Lock"
                                value={statusObjectName}
                                onChange={(event) => {
                                    setStatusObjectName(event.target.value as string);
                                    setStatusRequired("");
                                }}
                            >
                                <AppMenuItem value="">None</AppMenuItem>
                                {statusCatalog.map((status) => (
                                    <AppMenuItem key={status.name} value={status.name}>{status.name}</AppMenuItem>
                                ))}
                            </AppSelect>
                        </AppFormControl>
                        <AppTextField
                            label={selectedStatusDefinition?.status_type === "boolean" ? "Required" : "Count"}
                            size="small"
                            type={selectedStatusDefinition?.status_type === "integer" ? "number" : undefined}
                            value={selectedStatusDefinition?.status_type === "boolean" ? "true" : statusRequired}
                            disabled={!selectedStatusDefinition || selectedStatusDefinition.status_type === "boolean"}
                            inputProps={selectedStatusDefinition?.max_status ? {min: 1, max: selectedStatusDefinition.max_status} : undefined}
                            onChange={(event) => setStatusRequired(event.target.value)}
                        />
                        <AppButton
                            type="button"
                            variant="outlined"
                            color="secondary"
                            disabled={!selectedStatusDefinition || comboContext.characterStatuses.some((status) => status.object_name === statusObjectName)}
                            onClick={() => {
                                if (!selectedStatusDefinition) {
                                    return;
                                }

                                const nextValue = selectedStatusDefinition.status_type === "boolean" ? true : Number.parseInt(statusRequired, 10);
                                if (selectedStatusDefinition.status_type === "integer" && (typeof nextValue !== "number" || !Number.isFinite(nextValue) || nextValue < 1)) {
                                    setError("Character status count must be at least 1.");
                                    return;
                                }

                                setComboContext((current) => ({
                                    ...current,
                                    characterStatuses: [...current.characterStatuses, {object_name: selectedStatusDefinition.name, status_required: nextValue}],
                                }));
                                setStatusObjectName("");
                                setStatusRequired("");
                                setError(null);
                            }}
                        >
                            Add Lock
                        </AppButton>
                    </AppBox>

                    {comboContext.characterStatuses.length > 0 ? (
                        <AppBox sx={{display: "flex", flexWrap: "wrap", gap: 0.75}}>
                            {comboContext.characterStatuses.map((status) => (
                                <AppChip
                                    key={status.object_name}
                                    label={`${status.object_name}: ${String(status.status_required)}`}
                                    onDelete={() => setComboContext((current) => ({
                                        ...current,
                                        characterStatuses: current.characterStatuses.filter((entry) => entry.object_name !== status.object_name),
                                    }))}
                                />
                            ))}
                        </AppBox>
                    ) : (
                        <AppTypography variant="body2" color="text.secondary">No character status locks.</AppTypography>
                    )}
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
                        attackerCharacterName={selectedAttacker?.name ?? null}
                        defenderCharacterName={selectedDefender?.name ?? null}
                        onMatrixChange={setMatrix}
                        editable={true}
                        allowColumnStructureEdit={scenarioType !== "aggregated_oki"}
                        allowColumnAxisLabelEdit={scenarioType !== "aggregated_oki"}
                        allowColumnLayerEdit={scenarioType !== "aggregated_oki"}
                        onRefreshDynamicCells={onResolveDynamicCells}
                        onResolveDynamicComboCell={onResolveDynamicComboCell}
                        displayFrequenciesAsPercent
                        currentScenarioId={currentScenarioId}
                        linkedCellResolutions={linkedCellResolutions}
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
                                    comboContext,
                                });
                                if (typeof window !== "undefined") {
                                    window.localStorage.removeItem(draftStorageKey);
                                }
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
