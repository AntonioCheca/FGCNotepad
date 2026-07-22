import React from "react";

import {useCharacters} from "@/hooks/useCharacters";
import useMoves from "@/hooks/useMoves";
import {useScenarios} from "@/hooks/useScenarios";
import {AppBox} from "@/src/components/ui/AppBox";
import {InlineNotice} from "@/src/components/ui/tactical/InlineNotice";
import {getScenarioDraftStorageKey, parseScenarioFormDraft, serializeScenarioFormDraft} from "./editor/scenarioEditorDraft";
import {ScenarioComboEnvironmentSection} from "./editor/ScenarioComboEnvironmentSection";
import {ScenarioFinalizeSection} from "./editor/ScenarioFinalizeSection";
import {ScenarioMatrixWorkspaceSection} from "./editor/ScenarioMatrixWorkspaceSection";
import {ScenarioSetupSection} from "./editor/ScenarioSetupSection";
import type {CharacterOption, MoveOption, ScenarioEditorFormProps, ScenarioStatusDefinition} from "./editor/scenarioEditorTypes";
import {useScenarioEditorState} from "./editor/useScenarioEditorState";
import {useScenarioTriggerMoveSearch} from "./editor/useScenarioTriggerMoveSearch";

function normalizeSubmitError(error: unknown): string {
    if (typeof error !== "object" || error === null || !("response" in error)) {
        return "Unable to save scenario.";
    }

    return (error as {response?: {data?: {error?: string}}}).response?.data?.error ?? "Unable to save scenario.";
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
    const {
        state,
        loadDraft,
        setName,
        setScenarioType,
        setDefenderCharacterId,
        setAttackerCharacterId,
        setTriggerMove,
        setTriggerMoveQuery,
        resetTriggerMove,
        setMatrix,
        setPositionLock,
        addCharacterStatusLock,
        removeCharacterStatusLock,
        enforceAggregatedOkiColumns,
    } = useScenarioEditorState({
        name: initialValue?.name,
        scenarioType: initialValue?.scenarioType,
        defenderCharacterId: initialValue?.defenderCharacterId,
        attackerCharacterId: initialValue?.attackerCharacterId,
        matrix: initialValue?.matrix,
        comboContext: initialValue?.comboContext,
    });

    const [statusObjectName, setStatusObjectName] = React.useState("");
    const [statusRequired, setStatusRequired] = React.useState("");
    const [statusCatalog, setStatusCatalog] = React.useState<ScenarioStatusDefinition[]>([]);
    const [error, setError] = React.useState<string | null>(null);
    const [submitting, setSubmitting] = React.useState(false);
    const [resolvingDynamicCells, setResolvingDynamicCells] = React.useState(false);
    const draftStorageKey = React.useMemo(() => getScenarioDraftStorageKey(currentScenarioId), [currentScenarioId]);
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
        if (draft) {
            loadDraft(draft);
        }
    }, [draftStorageKey, loadDraft]);

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

        window.localStorage.setItem(draftStorageKey, serializeScenarioFormDraft(state));
    }, [draftStorageKey, state]);

    React.useEffect(() => {
        if (state.scenarioType === "aggregated_oki") {
            enforceAggregatedOkiColumns();
        }
    }, [enforceAggregatedOkiColumns, state.scenarioType]);

    const characterOptions = React.useMemo<CharacterOption[]>(
        () => (characters as CharacterOption[]).filter((character) => typeof character.id === "string" && typeof character.name === "string"),
        [characters]
    );

    const selectedAttacker = React.useMemo(
        () => characterOptions.find((character) => character.id === state.attackerCharacterId) ?? null,
        [characterOptions, state.attackerCharacterId]
    );

    const selectedDefender = React.useMemo(
        () => characterOptions.find((character) => character.id === state.defenderCharacterId) ?? null,
        [characterOptions, state.defenderCharacterId]
    );

    const handleResolvedInitialMove = React.useCallback((move: MoveOption) => {
        setTriggerMove(move, move.summary);
    }, [setTriggerMove]);

    const {moveOptions, isSearchingMoves} = useScenarioTriggerMoveSearch({
        attackerCharacterId: state.attackerCharacterId,
        selectedAttacker,
        triggerMoveQuery: state.triggerMoveQuery,
        initialTriggerMoveId: initialValue?.triggerMoveId,
        initialTriggerMoveLabel: initialValue?.triggerMoveLabel,
        searchMoves,
        getSpecificMove,
        onResolvedInitialMove: handleResolvedInitialMove,
        onResetTriggerMove: resetTriggerMove,
    });

    const canSubmit = Boolean(state.name.trim()) && Boolean(state.defenderCharacterId) && Boolean(state.attackerCharacterId) && Boolean(state.triggerMove?.id);

    const handleRefreshDynamicCells = React.useCallback(async () => {
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
    }, [onResolveDynamicCells, setMatrix]);

    const handleSubmit = React.useCallback(async () => {
        const trimmedName = state.name.trim();
        if (!trimmedName) {
            setError("Scenario name is required.");
            return;
        }

        if (!state.defenderCharacterId || !state.attackerCharacterId) {
            setError("Select both defender and attacker characters.");
            return;
        }

        if (!state.triggerMove?.id) {
            setError("Select a trigger move.");
            return;
        }

        setSubmitting(true);
        setError(null);
        try {
            await onSubmit({
                name: trimmedName,
                scenarioType: state.scenarioType,
                defenderCharacterId: state.defenderCharacterId,
                attackerCharacterId: state.attackerCharacterId,
                triggerMoveId: state.triggerMove.id,
                matrix: state.matrix,
                comboContext: state.comboContext,
            });
            if (typeof window !== "undefined") {
                window.localStorage.removeItem(draftStorageKey);
            }
        } catch (submitError) {
            setError(normalizeSubmitError(submitError));
        } finally {
            setSubmitting(false);
        }
    }, [draftStorageKey, onSubmit, state]);

    return (
        <AppBox sx={{display: "grid", gap: {xs: 1.25, md: 1.5}, width: "100%"}}>
            <ScenarioSetupSection
                name={state.name}
                scenarioType={state.scenarioType}
                characterOptions={characterOptions}
                selectedAttacker={selectedAttacker}
                selectedDefender={selectedDefender}
                triggerMove={state.triggerMove}
                triggerMoveQuery={state.triggerMoveQuery}
                moveOptions={moveOptions}
                charactersLoading={charactersLoading}
                isSearchingMoves={isSearchingMoves}
                attackerCharacterId={state.attackerCharacterId}
                onNameChange={(value) => {
                    setName(value);
                    setError(null);
                }}
                onScenarioTypeChange={setScenarioType}
                onAttackerChange={(value) => {
                    setAttackerCharacterId(value?.id ?? "");
                    setError(null);
                }}
                onTriggerMoveChange={(value) => {
                    setTriggerMove(value, value?.summary ?? "");
                    setError(null);
                }}
                onTriggerMoveQueryChange={setTriggerMoveQuery}
                onDefenderChange={(value) => {
                    setDefenderCharacterId(value?.id ?? "");
                    setError(null);
                }}
            />

            <ScenarioComboEnvironmentSection
                comboContext={state.comboContext}
                statusObjectName={statusObjectName}
                statusRequired={statusRequired}
                statusCatalog={statusCatalog}
                onPositionLockChange={setPositionLock}
                onStatusObjectNameChange={setStatusObjectName}
                onStatusRequiredChange={setStatusRequired}
                onAddStatusLock={addCharacterStatusLock}
                onRemoveStatusLock={removeCharacterStatusLock}
                onValidationError={setError}
                onClearError={() => setError(null)}
            />

            <ScenarioMatrixWorkspaceSection
                scenarioType={state.scenarioType}
                matrix={state.matrix}
                selectedAttackerName={selectedAttacker?.name ?? null}
                selectedDefenderName={selectedDefender?.name ?? null}
                resolvingDynamicCells={resolvingDynamicCells}
                submitting={submitting}
                currentScenarioId={currentScenarioId}
                linkedCellResolutions={linkedCellResolutions}
                onMatrixChange={setMatrix}
                onResolveDynamicCells={onResolveDynamicCells}
                onResolveDynamicComboCell={onResolveDynamicComboCell}
                onRefreshDynamicCellsClick={handleRefreshDynamicCells}
            />

            {error ? <InlineNotice severity="error">{error}</InlineNotice> : null}

            <ScenarioFinalizeSection canSubmit={canSubmit} submitting={submitting} submitLabel={submitLabel} onSubmit={handleSubmit} />
        </AppBox>
    );
}
