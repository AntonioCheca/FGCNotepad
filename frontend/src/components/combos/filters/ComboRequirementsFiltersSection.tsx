import {AppBox} from "@/src/components/ui/AppBox";
import {AppMenuItem} from "@/src/components/ui/AppMenuItem";
import {AppTextField} from "@/src/components/ui/AppTextField";
import {SectionCard} from "@/src/components/ui/tactical/SectionCard";
import type {RequirementObjectOption} from "@/src/types/combo";
import type {ComboBooleanFilterValue, ComboRequirementFilterKey, ComboRequirementFilters} from "./comboFilterTypes";

interface ComboRequirementsFiltersSectionProps {
    requirements: ComboRequirementFilters;
    requirementObjectOptions: RequirementObjectOption[];
    onRequirementToggle: (key: ComboRequirementFilterKey, value: ComboBooleanFilterValue) => void;
    onRequirementObjectChange: (objectName: string, status: string) => void;
    onAddedObjectChange: (objectName: string, status: string) => void;
    onConsumedObjectChange: (objectName: string) => void;
}

const booleanRequirementFilters: Array<{key: ComboRequirementFilterKey; label: string}> = [
    {key: "isEssential", label: "Essential"},
    {key: "counterHitRequired", label: "Counter hit"},
    {key: "punishCounterRequired", label: "Punish counter"},
    {key: "cornerRequired", label: "Corner"},
    {key: "airborneRequired", label: "Airborne"},
    {key: "notCrouchingRequired", label: "Not crouching"},
    {key: "sideSwitchesRequired", label: "Side switches"},
];

function BooleanRequirementField({filterKey, label, value, onChange}: {filterKey: ComboRequirementFilterKey; label: string; value: ComboBooleanFilterValue; onChange: (key: ComboRequirementFilterKey, value: ComboBooleanFilterValue) => void}) {
    return (
        <AppTextField
            select
            label={label}
            size="small"
            value={value}
            onChange={(event) => onChange(filterKey, event.target.value as ComboBooleanFilterValue)}
        >
            <AppMenuItem value="">Any</AppMenuItem>
            <AppMenuItem value="true">Required</AppMenuItem>
            <AppMenuItem value="false">Not required</AppMenuItem>
        </AppTextField>
    );
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
                {booleanRequirementFilters.map(({key, label}) => (
                    <BooleanRequirementField key={key} filterKey={key} label={label} value={requirements[key]} onChange={onRequirementToggle} />
                ))}
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
                            <AppMenuItem key="false" value="false">Inactive</AppMenuItem>,
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
                            <AppMenuItem key="false" value="false">Not applied</AppMenuItem>,
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
