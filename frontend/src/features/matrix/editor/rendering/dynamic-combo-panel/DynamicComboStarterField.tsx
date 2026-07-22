import {WrappedAutocomplete} from "@/src/components/ui/WrappedAutocomplete";
import type {DynamicComboMoveOption} from "./dynamicComboPanelTypes";

interface DynamicComboStarterFieldProps {
    starterOptions: DynamicComboMoveOption[];
    searchingMoves: boolean;
    starterQuery: string;
    onStarterQueryChange: (value: string) => void;
    onStarterSelected: (value: DynamicComboMoveOption) => void;
}

export function DynamicComboStarterField({starterOptions, searchingMoves, starterQuery, onStarterQueryChange, onStarterSelected}: DynamicComboStarterFieldProps) {
    return (
        <WrappedAutocomplete<DynamicComboMoveOption>
            label="Search Starter Move"
            options={starterOptions}
            loading={searchingMoves}
            disablePortal
            value={null}
            inputValue={starterQuery}
            onInputChange={(_event, value, reason) => {
                if (reason === "input" || reason === "clear") {
                    onStarterQueryChange(value);
                }
            }}
            onChange={(value) => {
                if (value) {
                    onStarterSelected(value);
                }
            }}
            getOptionLabel={(option) => option.summary}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            filterOptions={(options) => options}
            noOptionsText={starterQuery.trim().length === 0 ? "Type to search moves" : "No moves found"}
        />
    );
}
