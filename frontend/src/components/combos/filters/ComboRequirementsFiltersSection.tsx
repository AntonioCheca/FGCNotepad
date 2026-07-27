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
    onAddedObjectChange: (objectName: string, status: string) => void;
    onConsumedObjectChange: (objectName: string) => void;
}

export function ComboRequirementsFiltersSection({requirements, requirementObjectOptions, onRequirementToggle, onRequirementObjectChange, onAddedObjectChange, onConsumedObjectChange}: ComboRequirementsFiltersSectionProps) {
    const selectedRequirementObject = requirementObjectOptions.find((option) => option.object_key === requirements.requirementObjectName || option.name === requirements.requirementObjectName) ?? null;
    const selectedAddedObject = requirementObjectOptions.find((option) => option.object_key === requirements.addedObjectName || option.name === requirements.addedObjectName) ?? null;
    const integerStatusOptions = selectedRequirementObject?.status_type === "integer" && selectedRequirementObject.max_status !== null
        ? Array.from({length: selectedRequirementObject.max_status}, (_, index) => String(index + 1))
        : [];
    const addedIntegerStatusOptions = selectedAddedObject?.status_type === "integer" && selectedAddedObject.max_status !== null
        ? Array.from({length: selectedAddedObject.max_status}, (_, index) => String(index + 1))
        : [];
    const consumedOptions = requirementObjectOptions.filter((option) => option.can_be_consumed);
    const addedOptions = requirementObjectOptions.filter((option) => option.can_be_added_relative || option.can_be_added_absolute);

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
                            <AppMenuItem key={option.object_key} value={option.object_key}>{option.display_name}</AppMenuItem>
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
                            <AppMenuItem key="true" value="true">Active</AppMenuItem>,
                        ] : integerStatusOptions.map((value) => (
                            <AppMenuItem key={value} value={value}>{value}</AppMenuItem>
                        ))}
                    </AppTextField>
                </AppBox>
                <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", sm: "1fr 0.85fr"}, gap: 0.75}}>
                    <AppTextField
                        select
                        label="Object added"
                        size="small"
                        value={requirements.addedObjectName}
                        onChange={(event) => onAddedObjectChange(event.target.value, "")}
                    >
                        <AppMenuItem value="">Any added object</AppMenuItem>
                        {addedOptions.map((option) => (
                            <AppMenuItem key={option.object_key} value={option.object_key}>{option.display_name}</AppMenuItem>
                        ))}
                    </AppTextField>
                    <AppTextField
                        select
                        label="Added value"
                        size="small"
                        value={requirements.addedObjectStatus}
                        disabled={!selectedAddedObject}
                        onChange={(event) => onAddedObjectChange(requirements.addedObjectName, event.target.value)}
                    >
                        <AppMenuItem value="">Any</AppMenuItem>
                        {selectedAddedObject?.status_type === "boolean" ? [
                            <AppMenuItem key="true" value="true">Applied</AppMenuItem>,
                        ] : addedIntegerStatusOptions.map((value) => (
                            <AppMenuItem key={value} value={value}>{value}</AppMenuItem>
                        ))}
                    </AppTextField>
                </AppBox>
                <AppTextField
                    select
                    label="Object consumed"
                    size="small"
                    value={requirements.consumedObjectName}
                    onChange={(event) => onConsumedObjectChange(event.target.value)}
                >
                    <AppMenuItem value="">Any consumed object</AppMenuItem>
                    {consumedOptions.map((option) => (
                        <AppMenuItem key={option.object_key} value={option.object_key}>{option.display_name}</AppMenuItem>
                    ))}
                </AppTextField>
            </AppBox>
        </SectionCard>
    );
}
