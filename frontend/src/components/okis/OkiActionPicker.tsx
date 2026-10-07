import React from "react";
import useMoves from "@/hooks/useMoves";
import {AppAutocomplete} from "@/src/components/ui/AppAutocomplete";
import {AppTextField} from "@/src/components/ui/AppTextField";
import {moveOptionLabel, toMoveSearchOptions} from "./okiMoveSearch";
import type {OkiNodeChoice} from "./okiEditorTypes";
import {choiceLabel} from "./okiEditorTypes";
import {OKI_ACTION_LABELS, OKI_ACTIONS} from "./okiVocabulary";

interface OkiActionPickerProps {
    characterId: string;
    value: OkiNodeChoice | null;
    autoFocus?: boolean;
    onChange: (choice: OkiNodeChoice) => void;
}

const ACTION_CHOICES: OkiNodeChoice[] = OKI_ACTIONS.map((action) => ({kind: "action", action}));

function choiceKey(choice: OkiNodeChoice): string {
    return choice.kind === "action" ? `action:${choice.action}` : `move:${choice.move.id}`;
}

// One list for both kinds of node: universal actions are always offered, character moves are searched as you type.
export function OkiActionPicker({characterId, value, autoFocus = false, onChange}: OkiActionPickerProps) {
    const {searchMoves} = useMoves();
    const [typed, setTyped] = React.useState("");
    const [moveChoices, setMoveChoices] = React.useState<OkiNodeChoice[]>([]);
    const [loading, setLoading] = React.useState(false);
    const query = typed.trim();

    React.useEffect(() => {
        if (query === "") {
            return;
        }

        let canceled = false;
        const handle = window.setTimeout(() => {
            setLoading(true);
            searchMoves(query, characterId)
                .then((result: unknown) => {
                    if (!canceled) {
                        setMoveChoices(toMoveSearchOptions(result).map((move) => ({kind: "move", move})));
                    }
                })
                .catch(() => {
                    if (!canceled) {
                        setMoveChoices([]);
                    }
                })
                .finally(() => {
                    if (!canceled) {
                        setLoading(false);
                    }
                });
        }, 200);

        return () => {
            canceled = true;
            window.clearTimeout(handle);
        };
    }, [characterId, query, searchMoves]);

    const lowerQuery = query.toLowerCase();
    const moves = query === "" ? [] : moveChoices;
    const actions = ACTION_CHOICES.filter((choice) => choice.kind === "action" && OKI_ACTION_LABELS[choice.action].toLowerCase().includes(lowerQuery));
    // The current value stays listed (inside its own group) so the field never holds a value missing from its options.
    const withValue = (group: OkiNodeChoice[], kind: OkiNodeChoice["kind"]) => value?.kind === kind && !group.some((choice) => choiceKey(choice) === choiceKey(value)) ? [value, ...group] : group;
    const options = [...withValue(moves, "move"), ...withValue(actions, "action")];

    return (
        <AppAutocomplete<OkiNodeChoice, false, false, false>
            options={options}
            value={value}
            loading={loading}
            openOnFocus
            autoHighlight
            filterOptions={(items) => items}
            groupBy={(option) => option.kind === "action" ? "Universal" : "Moves"}
            onInputChange={(_, nextValue, reason) => setTyped(reason === "input" ? nextValue : "")}
            onChange={(_, nextValue) => {
                if (nextValue) {
                    onChange(nextValue);
                }
            }}
            getOptionLabel={(option) => option.kind === "move" ? moveOptionLabel(option.move) : choiceLabel(option)}
            getOptionKey={choiceKey}
            isOptionEqualToValue={(option, selected) => choiceKey(option) === choiceKey(selected)}
            noOptionsText="No matching move"
            renderInput={(params) => <AppTextField {...params} autoFocus={autoFocus} label="Move or action" size="small" margin="none" />}
        />
    );
}
