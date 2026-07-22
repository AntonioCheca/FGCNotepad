import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {CheckCircleOutlineIcon} from "@/src/components/ui/AppIcons";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {SectionCard} from "@/src/components/ui/tactical/SectionCard";

interface ScenarioFinalizeSectionProps {
    canSubmit: boolean;
    submitting: boolean;
    submitLabel: string;
    onSubmit: () => Promise<void>;
}

export function ScenarioFinalizeSection({canSubmit, submitting, submitLabel, onSubmit}: ScenarioFinalizeSectionProps) {
    return (
        <SectionCard title="Finalize" tone="default" variant="finalize">
            <AppBox sx={{display: "flex", gap: 0.6, alignItems: "center", flexWrap: "wrap"}}>
                <CheckCircleOutlineIcon fontSize="small" color={canSubmit ? "success" : "disabled"} />
                <AppTypography variant="body2" color="text.secondary">
                    Ready: {canSubmit ? "yes" : "missing scenario name, attacker, defender, or trigger move"}
                </AppTypography>
            </AppBox>
            <AppBox sx={{display: "flex", justifyContent: "flex-end"}}>
                <AppButton type="button" disabled={submitting} onClick={() => void onSubmit()}>
                    {submitting ? "Saving..." : submitLabel}
                </AppButton>
            </AppBox>
        </SectionCard>
    );
}
