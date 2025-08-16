import {Box} from "@mui/material";
import {AppButton} from "@/src/components/ui/AppButton";
import StepItem from "@/src/components/combos/create/StepItem";
import type {StepDraft, ConnectionType, LeafSequenceOption} from "@/src/types/combo";

/**
 * Displays all steps + "Add Step" button.
 * Delegates each step UI to StepItem.
 */
interface StepListProps {
    steps: StepDraft[];
    onAddStep: () => void;
    onRemoveStep: (index: number) => void;
    onChangeStep: (index: number, update: Partial<StepDraft>) => void;
    searchMoves: (q: string) => Promise<{ data: LeafSequenceOption[] } | any>;
    connections: ConnectionType[];
    connectionsLoading: boolean;
    leafs: LeafSequenceOption[]; // <-- NEW
}

export function StepList({
                             steps,
                             onAddStep,
                             onRemoveStep,
                             onChangeStep,
                             searchMoves,
                             connections,
                             connectionsLoading,
                             leafs, // <-- NEW
                         }: StepListProps) {
    return (
        <Box sx={{display: "flex", flexDirection: "column", gap: 1}}>
            {steps.map((step, index) => (
                <StepItem
                    key={index}
                    index={index}
                    step={step}
                    onRemove={() => onRemoveStep(index)}
                    onChange={(update) => onChangeStep(index, update)}
                    searchMoves={searchMoves}
                    moves={leafs} // <-- PASS leafs instead of using searchMoves directly
                    connections={connections}
                    connectionsLoading={connectionsLoading}
                />
            ))}

            <AppButton onClick={onAddStep} type="button">
                Add Step
            </AppButton>
        </Box>
    );
}

export default StepList;
