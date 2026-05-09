import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppChip} from "@/src/components/ui/AppChip";
import {AppTextField} from "@/src/components/ui/AppTextField";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {WrappedAutocomplete} from "@/src/components/ui/WrappedAutocomplete";
import {SectionCard} from "@/src/components/ui/tactical/SectionCard";
import {ActionBar} from "@/src/components/ui/tactical/ActionBar";
import {InlineNotice} from "@/src/components/ui/tactical/InlineNotice";
import {ToggleRow} from "@/src/components/ui/tactical/ToggleRow";
import {CheckCircleOutlineIcon} from "@/src/components/ui/AppIcons";
import type {
    ComboRequirementsPayload,
    RequirementObjectOption,
} from "@/src/types/combo";
import {
    requirementToggles,
    type RequirementToggleKey,
} from "@/src/components/combos/create/utils/comboForm";

interface SubmitSectionProps {
    title: string;
    damage: string;
    driveCost: string;
    driveGain: string;
    superCost: string;
    superGain: string;
    description: string;
    notes: string;
    canSubmit: boolean;
    showAdvancedConditions: boolean;
    requirements: ComboRequirementsPayload;
    activeRequirementsCount: number;
    requirementObjects: RequirementObjectOption[];
    selectedRequirementObject: RequirementObjectOption | null;
    specificRequirementStatus: string;
    selectedObjectIsInteger: boolean;
    selectedObjectIsBoolean: boolean;
    onTitleChange: (value: string) => void;
    onDamageChange: (value: string) => void;
    onDriveCostChange: (value: string) => void;
    onDriveGainChange: (value: string) => void;
    onSuperCostChange: (value: string) => void;
    onSuperGainChange: (value: string) => void;
    onDescriptionChange: (value: string) => void;
    onNotesChange: (value: string) => void;
    onToggleAdvancedConditions: () => void;
    onResetDraft: () => void;
    onRequirementToggle: (key: RequirementToggleKey, checked: boolean) => void;
    onSpecificRequirementObjectChange: (value: RequirementObjectOption | null) => void;
    onSpecificRequirementStatusChange: (value: string) => void;
}

export function SubmitSection({
    title,
    damage,
    driveCost,
    driveGain,
    superCost,
    superGain,
    description,
    notes,
    canSubmit,
    showAdvancedConditions,
    requirements,
    activeRequirementsCount,
    requirementObjects,
    selectedRequirementObject,
    specificRequirementStatus,
    selectedObjectIsInteger,
    selectedObjectIsBoolean,
    onTitleChange,
    onDamageChange,
    onDriveCostChange,
    onDriveGainChange,
    onSuperCostChange,
    onSuperGainChange,
    onDescriptionChange,
    onNotesChange,
    onToggleAdvancedConditions,
    onResetDraft,
    onRequirementToggle,
    onSpecificRequirementObjectChange,
    onSpecificRequirementStatusChange,
}: SubmitSectionProps) {
    return (
        <SectionCard
            title="Submit"
            description="Finalize title and optional metadata, then submit one clean primary action."
            tone="default"
            variant="finalize"
        >
            <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", md: "minmax(0, 1fr) auto"}, gap: 1, alignItems: {xs: "start", md: "center"}}}>
                <AppTextField
                    label="Combo Title"
                    value={title}
                    onChange={(event) => onTitleChange(event.target.value)}
                    required
                    helperText="Auto-filled from notation when possible."
                />
                <AppButton type="submit" variant="contained" color="primary" disabled={!canSubmit} sx={{minWidth: 180, minHeight: 40, alignSelf: {md: "center"}}}>
                    Create Combo
                </AppButton>
            </AppBox>

            <ActionBar>
                <AppButton
                    type="button"
                    variant="text"
                    color="secondary"
                    onClick={onToggleAdvancedConditions}
                    sx={{color: "text.secondary"}}
                >
                    {showAdvancedConditions ? "Hide Advanced" : "Advanced"}
                </AppButton>
                <AppButton type="button" variant="text" color="secondary" onClick={onResetDraft} sx={{color: "text.secondary"}}>
                    Reset Draft
                </AppButton>
            </ActionBar>

            <AppBox sx={{display: "grid", gap: 1, pt: 0.5}}>
                <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", md: "160px minmax(220px, 1fr)"}, gap: 1, alignItems: "center"}}>
                    <AppTextField
                        label="Estimated Damage"
                        value={damage}
                        onChange={(event) => onDamageChange(event.target.value)}
                        inputMode="numeric"
                        required
                    />
                    <AppTypography variant="body2" color="text.secondary">
                        Auto-filled from Fill Details and visible before creation.
                    </AppTypography>
                </AppBox>
                <AppTextField
                    label="Description"
                    value={description}
                    onChange={(event) => onDescriptionChange(event.target.value)}
                />
                <AppTextField
                    label="Notes"
                    value={notes}
                    onChange={(event) => onNotesChange(event.target.value)}
                    helperText="Local notes only."
                />
            </AppBox>

            {showAdvancedConditions ? (
                <AppBox sx={{display: "grid", gap: 1, pt: 0.5}}>
                    <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr 1fr", md: "repeat(4, minmax(110px, 1fr))"}, gap: 1}}>
                        <AppTextField
                            label="Drive Cost"
                            value={driveCost}
                            onChange={(event) => onDriveCostChange(event.target.value)}
                            inputMode="decimal"
                        />
                        <AppTextField
                            label="Drive Gain"
                            value={driveGain}
                            onChange={(event) => onDriveGainChange(event.target.value)}
                            inputMode="decimal"
                        />
                        <AppTextField
                            label="Super Cost"
                            value={superCost}
                            onChange={(event) => onSuperCostChange(event.target.value)}
                            inputMode="decimal"
                        />
                        <AppTextField
                            label="Super Gain"
                            value={superGain}
                            onChange={(event) => onSuperGainChange(event.target.value)}
                            inputMode="decimal"
                        />
                    </AppBox>
                    <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", md: "1fr 1fr"}, gap: 1}}>
                        {requirementToggles.map(({key, label}) => (
                            <ToggleRow
                                key={key}
                                label={label}
                                checked={Boolean(requirements[key])}
                                disabled={
                                    (key === "counter_hit_required" && Boolean(requirements.punish_counter_required))
                                    || (key === "punish_counter_required" && Boolean(requirements.counter_hit_required))
                                }
                                onChange={(checked) => onRequirementToggle(key, checked)}
                            />
                        ))}
                    </AppBox>
                    <AppBox sx={{display: "flex", gap: 0.5, flexWrap: "wrap"}}>
                        <AppChip size="small" variant="outlined" color="info" label={`${activeRequirementsCount} active conditions`} />
                    </AppBox>
                    <WrappedAutocomplete<RequirementObjectOption>
                        label="Specific Requirement Object"
                        options={requirementObjects}
                        value={selectedRequirementObject}
                        onChange={onSpecificRequirementObjectChange}
                        getOptionLabel={(option) => option?.name ?? ""}
                        disableClearable={false}
                        sx={{maxWidth: {md: 460}}}
                    />

                    {selectedObjectIsInteger ? (
                        <AppTextField
                            label="Specific Status Required"
                            value={specificRequirementStatus}
                            onChange={(event) => onSpecificRequirementStatusChange(event.target.value)}
                            inputMode="numeric"
                            helperText={`Value between 1 and ${selectedRequirementObject?.max_status}`}
                            sx={{maxWidth: 220}}
                        />
                    ) : null}

                    {selectedObjectIsBoolean ? (
                        <InlineNotice severity="info">
                            This requirement is boolean and is saved as required active state.
                        </InlineNotice>
                    ) : null}
                </AppBox>
            ) : null}

            <AppBox sx={{display: "flex", gap: 0.6, alignItems: "center", flexWrap: "wrap"}}>
                <CheckCircleOutlineIcon fontSize="small" color={canSubmit ? "success" : "disabled"} />
                <AppTypography variant="body2" color="text.secondary">
                    Ready: {canSubmit ? "yes" : "missing title, step move, or connection"}
                </AppTypography>
            </AppBox>
        </SectionCard>
    );
}
