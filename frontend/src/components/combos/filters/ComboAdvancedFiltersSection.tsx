import type React from "react";

import {AppBox} from "@/src/components/ui/AppBox";
import {AppMenuItem} from "@/src/components/ui/AppMenuItem";
import {AppTextField} from "@/src/components/ui/AppTextField";
import {TriStateFilter} from "@/src/components/ui/tactical/TriStateFilter";
import type {RequirementObjectOption} from "@/src/types/combo";
import type {ComboBooleanFilterValue, ComboDriveWindowFilters, ComboDriveWindowMetric, ComboRequirementFilterKey, ComboRequirementFilters} from "./comboFilterTypes";
import {ComboDriveWindowsFilters} from "./ComboDriveWindowsFilters";

interface ComboAdvancedFiltersSectionProps {
    requirements: ComboRequirementFilters;
    requirementObjectOptions: RequirementObjectOption[];
    driveWindows: ComboDriveWindowFilters;
    minDamage: string;
    maxDamage: string;
    onRequirementToggle: (key: ComboRequirementFilterKey, value: ComboBooleanFilterValue) => void;
    onRequirementObjectChange: (objectName: string, status: string) => void;
    onAddedObjectChange: (objectName: string, status: string) => void;
    onConsumedObjectChange: (objectName: string) => void;
    onAddDriveWindow: (metric: ComboDriveWindowMetric) => void;
    onRemoveDriveWindow: (metric: ComboDriveWindowMetric) => void;
    onDriveWindowRangeChange: (metric: ComboDriveWindowMetric, min?: string, max?: string) => void;
    onMinDamageChange: (value: string) => void;
    onMaxDamageChange: (value: string) => void;
}

const situationFilters: Array<{key: ComboRequirementFilterKey; label: string; ariaLabel?: string}> = [
    {key: "notCrouchingRequired", label: "Opp. not crouching", ariaLabel: "Opponent not crouching"},
    {key: "sideSwitchesRequired", label: "Side switch"},
    {key: "airborneRequired", label: "Airborne"},
    {key: "blockedDriveImpactStunRequired", label: "B. DI Stun", ariaLabel: "Blocked Drive Impact stun"},
    {key: "rawDriveRush", label: "Raw DR", ariaLabel: "Starts with raw Drive Rush"},
];

function FilterGroup({label, children}: {label: string; children: React.ReactNode}) {
    return (
        <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", md: "110px minmax(0, 1fr)"}, gap: {xs: 1, md: 1.5}, alignItems: "center"}}>
            <AppBox sx={{typography: "caption", fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.4}}>{label}</AppBox>
            {children}
        </AppBox>
    );
}

function integerStatusOptions(option: RequirementObjectOption | null): string[] {
    if (option?.status_type !== "integer" || option.max_status === null) {
        return [];
    }

    return Array.from({length: option.max_status}, (_, index) => String(index + 1));
}

export function ComboAdvancedFiltersSection({
    requirements,
    requirementObjectOptions,
    driveWindows,
    minDamage,
    maxDamage,
    onRequirementToggle,
    onRequirementObjectChange,
    onAddedObjectChange,
    onConsumedObjectChange,
    onAddDriveWindow,
    onRemoveDriveWindow,
    onDriveWindowRangeChange,
    onMinDamageChange,
    onMaxDamageChange,
}: ComboAdvancedFiltersSectionProps) {
    const selectedRequirementObject = requirementObjectOptions.find((option) => option.object_key === requirements.requirementObjectName || option.name === requirements.requirementObjectName) ?? null;
    const selectedAddedObject = requirementObjectOptions.find((option) => option.object_key === requirements.addedObjectName || option.name === requirements.addedObjectName) ?? null;
    const consumedOptions = requirementObjectOptions.filter((option) => option.can_be_consumed);
    const addedOptions = requirementObjectOptions.filter((option) => option.can_be_added_relative || option.can_be_added_absolute);

    return (
        <AppBox sx={{display: "grid", gap: 1.5, pt: 1}}>
            {requirementObjectOptions.length > 0 ? (
                <FilterGroup label="Resources">
                    <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr 1fr", md: "repeat(5, minmax(120px, 1fr))"}, gap: 1}}>
                        <AppTextField select label="Resource" size="small" value={requirements.requirementObjectName} onChange={(event) => onRequirementObjectChange(event.target.value, "")}>
                            <AppMenuItem value="">Any</AppMenuItem>
                            {requirementObjectOptions.map((option) => <AppMenuItem key={option.object_key} value={option.object_key}>{option.display_name}</AppMenuItem>)}
                        </AppTextField>
                        <AppTextField select label="Status" size="small" value={requirements.requirementObjectStatus} disabled={!selectedRequirementObject} onChange={(event) => onRequirementObjectChange(requirements.requirementObjectName, event.target.value)}>
                            <AppMenuItem value="">Any</AppMenuItem>
                            {selectedRequirementObject?.status_type === "boolean" ? [
                                <AppMenuItem key="true" value="true">Active</AppMenuItem>,
                                <AppMenuItem key="false" value="false">Inactive</AppMenuItem>,
                            ] : integerStatusOptions(selectedRequirementObject).map((value) => <AppMenuItem key={value} value={value}>{value}</AppMenuItem>)}
                        </AppTextField>
                        <AppTextField select label="Gains" size="small" value={requirements.addedObjectName} onChange={(event) => onAddedObjectChange(event.target.value, "")}>
                            <AppMenuItem value="">Any</AppMenuItem>
                            {addedOptions.map((option) => <AppMenuItem key={option.object_key} value={option.object_key}>{option.display_name}</AppMenuItem>)}
                        </AppTextField>
                        <AppTextField select label="Gained" size="small" value={requirements.addedObjectStatus} disabled={!selectedAddedObject} onChange={(event) => onAddedObjectChange(requirements.addedObjectName, event.target.value)}>
                            <AppMenuItem value="">Any</AppMenuItem>
                            {selectedAddedObject?.status_type === "boolean" ? [
                                <AppMenuItem key="true" value="true">Applied</AppMenuItem>,
                                <AppMenuItem key="false" value="false">Not applied</AppMenuItem>,
                            ] : integerStatusOptions(selectedAddedObject).map((value) => <AppMenuItem key={value} value={value}>{value}</AppMenuItem>)}
                        </AppTextField>
                        <AppTextField select label="Consumes" size="small" value={requirements.consumedObjectName} onChange={(event) => onConsumedObjectChange(event.target.value)}>
                            <AppMenuItem value="">Any</AppMenuItem>
                            {consumedOptions.map((option) => <AppMenuItem key={option.object_key} value={option.object_key}>{option.display_name}</AppMenuItem>)}
                        </AppTextField>
                    </AppBox>
                </FilterGroup>
            ) : null}

            <FilterGroup label="Situation">
                <AppBox sx={{display: "flex", flexWrap: "wrap", columnGap: 2.5, rowGap: 1}}>
                    {situationFilters.map(({key, label, ariaLabel}) => (
                        <TriStateFilter key={key} label={label} ariaLabel={ariaLabel} value={requirements[key]} onChange={(value) => onRequirementToggle(key, value)} />
                    ))}
                </AppBox>
            </FilterGroup>

            <FilterGroup label="Drive windows">
                <ComboDriveWindowsFilters driveWindows={driveWindows} onAddDriveWindow={onAddDriveWindow} onRemoveDriveWindow={onRemoveDriveWindow} onDriveWindowRangeChange={onDriveWindowRangeChange} />
            </FilterGroup>

            <FilterGroup label="Damage">
                <AppBox sx={{display: "flex", gap: 1}}>
                    <AppTextField label="Min" type="number" size="small" value={minDamage} InputLabelProps={{shrink: true}} onChange={(event) => onMinDamageChange(event.target.value)} sx={{width: {xs: "50%", sm: 120}}} />
                    <AppTextField label="Max" type="number" size="small" value={maxDamage} InputLabelProps={{shrink: true}} onChange={(event) => onMaxDamageChange(event.target.value)} sx={{width: {xs: "50%", sm: 120}}} />
                </AppBox>
            </FilterGroup>
        </AppBox>
    );
}
