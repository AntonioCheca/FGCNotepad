import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import StepItem from "@/src/components/combos/create/StepItem";
import type {StepDraft, ConnectionType, LeafSequenceOption} from "@/src/types/combo";

interface StepListProps {
    steps: StepDraft[];
    onAddStep: () => void;
    onRemoveStep: (index: number) => void;
    onChangeStep: (index: number, update: Partial<StepDraft>) => void;
    searchMoves: (q: string) => Promise<{ data: LeafSequenceOption[] } | any>;
    connections: ConnectionType[];
    connectionsLoading: boolean;
    leafs: LeafSequenceOption[];
}

export function StepList({
                             steps,
                             onAddStep,
                             onRemoveStep,
                             onChangeStep,
                             connections,
                             connectionsLoading,
                             leafs,
                         }: StepListProps) {
    return (
        <AppBox sx={{display: "flex", flexDirection: "column", gap: 1}}>
            {steps.map((step, index) => (
                <StepItem
                    key={index}
                    index={index}
                    step={step}
                    onRemove={() => onRemoveStep(index)}
                    onChange={(update) => onChangeStep(index, update)}
                    moves={leafs}
                    connections={connections}
                    connectionsLoading={connectionsLoading}
                />
            ))}

            <AppButton onClick={onAddStep} type="button">
                Add Step
            </AppButton>
        </AppBox>
    );
}

export default StepList;
