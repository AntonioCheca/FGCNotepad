import React from "react";

import {useCharacters} from "@/hooks/useCharacters";
import useMoves from "@/hooks/useMoves";
import {buildResolvedMoveLabel, buildStarterLabels, contextFromPreset} from "./dynamic-combo-panel/dynamicComboPanelUtils";
import type {DynamicComboCharacterOption, DynamicComboPanelBodyProps, DynamicComboPanelProps} from "./dynamic-combo-panel/dynamicComboPanelTypes";
import {DynamicComboCharacterField} from "./dynamic-combo-panel/DynamicComboCharacterField";
import {DynamicComboContextField} from "./dynamic-combo-panel/DynamicComboContextField";
import {DynamicComboPanelActions} from "./dynamic-combo-panel/DynamicComboPanelActions";
import {DynamicComboPanelFrame} from "./dynamic-combo-panel/DynamicComboPanelFrame";
import {DynamicComboPanelHeader} from "./dynamic-combo-panel/DynamicComboPanelHeader";
import {DynamicComboStarterField} from "./dynamic-combo-panel/DynamicComboStarterField";
import {DynamicComboStarterList} from "./dynamic-combo-panel/DynamicComboStarterList";
import {useDynamicComboMoveSearch} from "./dynamic-combo-panel/useDynamicComboMoveSearch";
import {useDynamicComboPanelState} from "./dynamic-combo-panel/useDynamicComboPanelState";

const PANEL_TITLE_ID = "dynamic-combo-panel-title";

export function DynamicComboPanel({open, resetKey = "dynamic-combo-panel", ...bodyProps}: DynamicComboPanelProps) {
    if (!open) {
        return null;
    }

    return <DynamicComboPanelBody key={resetKey} {...bodyProps} />;
}

function DynamicComboPanelBody({initialValue, moveLabelById, presentation = "modal", onClose, onConfirm}: DynamicComboPanelBodyProps) {
    const {characters, loading: charactersLoading} = useCharacters();
    const {searchMoves, getSpecificMove} = useMoves();
    const getSpecificMoveRef = React.useRef(getSpecificMove);
    const {
        state,
        setSelectedCharacter,
        setStarterQuery,
        addStarterSelection,
        removeStarterSelection,
        replaceStarterLabels,
        setStarterPreset,
        setError,
    } = useDynamicComboPanelState(initialValue, moveLabelById);

    React.useEffect(() => {
        getSpecificMoveRef.current = getSpecificMove;
    }, [getSpecificMove]);

    const characterOptions = React.useMemo<DynamicComboCharacterOption[]>(
        () => (characters as DynamicComboCharacterOption[]).filter((item) => typeof item.id === "string" && typeof item.name === "string"),
        [characters]
    );
    const selectedCharacterName = state.selectedCharacter?.name ?? "";
    const {starterOptions, searchingMoves, clearStarterOptions} = useDynamicComboMoveSearch({
        starterQuery: state.starterQuery,
        selectedCharacterName,
        searchMoves,
    });

    React.useEffect(() => {
        if (!initialValue?.starterMoveIds?.length) {
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
                    return [moveId, buildResolvedMoveLabel(moveId, move)] as const;
                } catch {
                    return [moveId, `Move #${moveId}`] as const;
                }
            })
        ).then((resolvedLabels) => {
            if (canceled) {
                return;
            }

            replaceStarterLabels(resolvedLabels.reduce<Record<string, string>>((acc, [id, label]) => {
                acc[id] = label;
                return acc;
            }, {}));
        });

        return () => {
            canceled = true;
        };
    }, [initialValue, moveLabelById, replaceStarterLabels]);

    React.useEffect(() => {
        if (!initialValue?.attackerCharacterId || characterOptions.length === 0) {
            return;
        }

        setSelectedCharacter(characterOptions.find((option) => option.id === initialValue.attackerCharacterId) ?? null);
    }, [initialValue, characterOptions, setSelectedCharacter]);

    const handleSave = React.useCallback(() => {
        if (!state.selectedCharacter) {
            setError("Select an attacker character.");
            return;
        }

        if (state.starterSelections.length === 0) {
            setError("Add at least one starter move.");
            return;
        }

        onConfirm({
            attackerCharacterId: state.selectedCharacter.id,
            ...(typeof initialValue?.isComboInitiatorAttacker === "boolean" ? {isComboInitiatorAttacker: initialValue.isComboInitiatorAttacker} : {}),
            starterMoveIds: state.starterSelections.map((item) => item.id),
            starterContext: contextFromPreset(state.starterPreset),
        }, buildStarterLabels(state.starterSelections));
    }, [initialValue, onConfirm, setError, state]);

    return (
        <DynamicComboPanelFrame presentation={presentation} titleId={PANEL_TITLE_ID} onClose={onClose}>
            <DynamicComboPanelHeader titleId={PANEL_TITLE_ID} onClose={onClose} />

            <DynamicComboCharacterField
                characterOptions={characterOptions}
                charactersLoading={charactersLoading}
                selectedCharacter={state.selectedCharacter}
                onSelectedCharacterChange={setSelectedCharacter}
            />

            <div style={{display: "grid", gap: 6, minWidth: 0}}>
                <DynamicComboStarterField
                    starterOptions={starterOptions}
                    searchingMoves={searchingMoves}
                    starterQuery={state.starterQuery}
                    onStarterQueryChange={setStarterQuery}
                    onStarterSelected={(value) => {
                        addStarterSelection(value);
                        clearStarterOptions();
                    }}
                />
                <DynamicComboStarterList starterSelections={state.starterSelections} onRemoveStarter={removeStarterSelection} />
            </div>

            <DynamicComboContextField starterPreset={state.starterPreset} onStarterPresetChange={setStarterPreset} />

            <DynamicComboPanelActions error={state.error} onCancel={onClose} onSave={handleSave} />
        </DynamicComboPanelFrame>
    );
}
