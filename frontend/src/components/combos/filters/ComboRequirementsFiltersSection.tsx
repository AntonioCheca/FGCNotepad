import {AppBox} from "@/src/components/ui/AppBox";
import {ToggleRow} from "@/src/components/ui/tactical/ToggleRow";
import {SectionCard} from "@/src/components/ui/tactical/SectionCard";
import type {ComboRequirementFilterKey, ComboRequirementFilters} from "./comboFilterTypes";

interface ComboRequirementsFiltersSectionProps {
    requirements: ComboRequirementFilters;
    onRequirementToggle: (key: ComboRequirementFilterKey, checked: boolean) => void;
}

export function ComboRequirementsFiltersSection({requirements, onRequirementToggle}: ComboRequirementsFiltersSectionProps) {
    return (
        <SectionCard title="Requirements" description="Lower-priority context filters for niche scenarios and routing checks." tone="sunken" variant="default">
            <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", md: "1fr 1fr"}, gap: 0.75}}>
                <ToggleRow label="Essential" checked={requirements.isEssential} onChange={(checked) => onRequirementToggle("isEssential", checked)} />
                <ToggleRow label="Counter hit required" checked={requirements.counterHitRequired} onChange={(checked) => onRequirementToggle("counterHitRequired", checked)} />
                <ToggleRow label="Punish counter required" checked={requirements.punishCounterRequired} onChange={(checked) => onRequirementToggle("punishCounterRequired", checked)} />
                <ToggleRow label="Corner required" checked={requirements.cornerRequired} onChange={(checked) => onRequirementToggle("cornerRequired", checked)} />
                <ToggleRow label="Airborne required" checked={requirements.airborneRequired} onChange={(checked) => onRequirementToggle("airborneRequired", checked)} />
                <ToggleRow label="Mid-screen required" checked={requirements.midScreenRequired} onChange={(checked) => onRequirementToggle("midScreenRequired", checked)} />
                <ToggleRow label="Not crouching required" checked={requirements.notCrouchingRequired} onChange={(checked) => onRequirementToggle("notCrouchingRequired", checked)} />
            </AppBox>
        </SectionCard>
    );
}
