import {AppBox} from "@/src/components/ui/AppBox";
import {AppMenuItem} from "@/src/components/ui/AppMenuItem";
import {AppTextField} from "@/src/components/ui/AppTextField";
import {ToggleRow} from "@/src/components/ui/tactical/ToggleRow";
import {SectionCard} from "@/src/components/ui/tactical/SectionCard";
import type {RequirementObjectOption} from "@/src/types/combo";
import type {ComboRequirementFilterKey, ComboRequirementFilters} from "./comboFilterTypes";

interface ComboRequirementsFiltersSectionProps {
    requirements: ComboRequirementFilters;
    requirementObjectOptions: RequirementObjectOption[];
    onRequirementToggle: (key: ComboRequirementFilterKey, checked: boolean) => void;
    onRequirementObjectChange: (objectName: string, status: string) => void;
}

export function ComboRequirementsFiltersSection({requirements, requirementObjectOptions, onRequirementToggle, onRequirementObjectChange}: ComboRequirementsFiltersSectionProps) {
    const selectedRequirementObject = requirementObjectOptions.find((option) => option.name === requirements.requirementObjectName) ?? null;
    const integerStatusOptions = selectedRequirementObject?.status_type === "integer" && selectedRequirementObject.max_status !== null
        ? Array.from({length: selectedRequirementObject.max_status}, (_, index) => String(index + 1))
        : [];

    return (
        <SectionCard title="Requirements" tone="sunken" variant="default">
            <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", md: "1fr 1fr"}, gap: 0.75}}>
                <ToggleRow label="Essential" checked={requirements.isEssential} onChange={(checked) => onRequirementToggle("isEssential", checked)} />
                <ToggleRow label="Counter hit required" checked={requirements.counterHitRequired} onChange={(checked) => onRequirementToggle("counterHitRequired", checked)} />
                <ToggleRow label="Punish counter required" checked={requirements.punishCounterRequired} onChange={(checked) => onRequirementToggle("punishCounterRequired", checked)} />
                <ToggleRow label="Corner required" checked={requirements.cornerRequired} onChange={(checked) => onRequirementToggle("cornerRequired", checked)} />
                <ToggleRow label="Airborne required" checked={requirements.airborneRequired} onChange={(checked) => onRequirementToggle("airborneRequired", checked)} />
                <ToggleRow label="Mid-screen required" checked={requirements.midScreenRequired} onChange={(checked) => onRequirementToggle("midScreenRequired", checked)} />
                <ToggleRow label="Not crouching required" checked={requirements.notCrouchingRequired} onChange={(checked) => onRequirementToggle("notCrouchingRequired", checked)} />
                <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", sm: "1fr 0.85fr"}, gap: 0.75}}>
                    <AppTextField
                        select
                        label="Specific object"
                        size="small"
                        value={requirements.requirementObjectName}
                        onChange={(event) => onRequirementObjectChange(event.target.value, "")}
                    >
                        <AppMenuItem value="">Any object</AppMenuItem>
                        {requirementObjectOptions.map((option) => (
                            <AppMenuItem key={option.name} value={option.name}>{option.name}</AppMenuItem>
                        ))}
                    </AppTextField>
                    <AppTextField
                        select
                        label="Status"
                        size="small"
                        value={requirements.requirementObjectStatus}
                        disabled={!selectedRequirementObject}
                        onChange={(event) => onRequirementObjectChange(requirements.requirementObjectName, event.target.value)}
                    >
                        <AppMenuItem value="">Any</AppMenuItem>
                        {selectedRequirementObject?.status_type === "boolean" ? [
                            <AppMenuItem key="true" value="true">Required</AppMenuItem>,
                            <AppMenuItem key="false" value="false">Not required</AppMenuItem>,
                        ] : integerStatusOptions.map((value) => (
                            <AppMenuItem key={value} value={value}>{value}</AppMenuItem>
                        ))}
                    </AppTextField>
                </AppBox>
            </AppBox>
        </SectionCard>
    );
}
