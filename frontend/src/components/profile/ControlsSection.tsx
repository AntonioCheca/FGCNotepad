
import {AppButton} from "@/src/components/ui/AppButton";
import {AppBox} from "@/src/components/ui/AppBox";
import {SectionCard} from "@/src/components/ui/tactical/SectionCard";
import {ComboExecutionModeSelect} from "@/src/components/combos/execution/ComboExecutionModeSelect";
import type {ComboExecutionMode} from "@/src/types/comboExecution";

interface ControlsSectionProps {
    mode: ComboExecutionMode;
    saving: boolean;
    onModeChange: (mode: ComboExecutionMode) => void;
    onSave: () => Promise<void>;
}

export function ControlsSection({mode, saving, onModeChange, onSave}: ControlsSectionProps) {
    return (
        <SectionCard title="Controls" tone="raised">
            <AppBox sx={{display: "flex", gap: 1.5, alignItems: {xs: "stretch", sm: "center"}, flexDirection: {xs: "column", sm: "row"}}}>
                <ComboExecutionModeSelect value={mode} onChange={onModeChange} />
                <AppButton type="button" disabled={saving} onClick={() => void onSave()} sx={{width: {xs: "100%", sm: "auto"}}}>{saving ? "Saving..." : "Save Controls"}</AppButton>
            </AppBox>
        </SectionCard>
    );
}
