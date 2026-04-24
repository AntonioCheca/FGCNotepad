import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppChip} from "@/src/components/ui/AppChip";
import {AppTypography} from "@/src/components/ui/AppTypography";
import StepItem from "@/src/components/combos/create/StepItem";
import type {StepDraft, ConnectionType, LeafSequenceOption} from "@/src/types/combo";

interface StepListProps {
    steps: StepDraft[];
    onAddStep: () => void;
    onRemoveStep: (index: number) => void;
    onChangeStep: (index: number, update: Partial<StepDraft>) => void;
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
    const completedStepCount = steps.filter((step, index) => Boolean(step.move?.id) && (index === 0 || Boolean(step.connection?.id))).length;

    return (
        <AppBox sx={{display: "flex", flexDirection: "column", gap: 1}}>
            <AppBox sx={{display: "flex", justifyContent: "space-between", gap: 0.75, flexWrap: "wrap", alignItems: "center"}}>
                <AppTypography variant="body2" color="text.secondary">
                    Route completion: {completedStepCount}/{steps.length}
                </AppTypography>
                <AppChip size="small" variant="outlined" color={steps.length > 0 && completedStepCount === steps.length ? "success" : "default"} label={steps.length === 0 ? "No route" : "Route draft"} />
            </AppBox>

            {steps.length === 0 ? (
                <AppBox
                    sx={{
                        border: "1px dashed",
                        borderColor: "divider",
                        borderRadius: 1.5,
                        p: 1.5,
                        backgroundColor: (theme) => theme.fgc.surface.subtle,
                    }}
                >
                    <AppTypography variant="body2" color="text.secondary">
                        No steps added yet. Start with your first move.
                    </AppTypography>
                </AppBox>
            ) : (
                steps.map((step, index) => (
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
                ))
            )}

            <AppBox sx={{display: "flex", justifyContent: "flex-start"}}>
                <AppButton onClick={onAddStep} type="button" variant="outlined">
                    Add Step
                </AppButton>
            </AppBox>
        </AppBox>
    );
}

export default StepList;
