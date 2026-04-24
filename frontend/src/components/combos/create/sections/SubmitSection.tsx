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
    description: string;
    notes: string;
    canSubmit: boolean;
    showOptionalDetails: boolean;
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
    onDescriptionChange: (value: string) => void;
    onNotesChange: (value: string) => void;
    onToggleOptionalDetails: () => void;
    onToggleAdvancedConditions: () => void;
    onResetDraft: () => void;
    onRequirementToggle: (key: RequirementToggleKey, checked: boolean) => void;
    onSpecificRequirementObjectChange: (value: RequirementObjectOption | null) => void;
    onSpecificRequirementStatusChange: (value: string) => void;
}

export function SubmitSection({
    title,
    damage,
    description,
    notes,
    canSubmit,
    showOptionalDetails,
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
    onDescriptionChange,
    onNotesChange,
    onToggleOptionalDetails,
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
                    onClick={onToggleOptionalDetails}
                    sx={{color: "text.secondary"}}
                >
                    {showOptionalDetails ? "Hide Optional Details" : "Optional Details"}
                </AppButton>
                <AppButton
                    type="button"
                    variant="text"
                    color="secondary"
                    onClick={onToggleAdvancedConditions}
                    sx={{color: "text.secondary"}}
                >
                    {showAdvancedConditions ? "Hide Advanced Conditions" : "Advanced Conditions"}
                </AppButton>
                <AppButton type="button" variant="text" color="secondary" onClick={onResetDraft} sx={{color: "text.secondary"}}>
                    Reset Draft
                </AppButton>
            </ActionBar>

            {showOptionalDetails ? (
                <AppBox sx={{display: "grid", gap: 1, pt: 0.5}}>
                    <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", md: "120px 1fr"}, gap: 1}}>
                        <AppTextField
                            label="Damage"
                            value={damage}
                            onChange={(event) => onDamageChange(event.target.value)}
                            inputMode="numeric"
                        />
                        <AppTextField
                            label="Description"
                            value={description}
                            onChange={(event) => onDescriptionChange(event.target.value)}
                        />
                    </AppBox>
                    <AppTextField
                        label="Notes"
                        value={notes}
                        onChange={(event) => onNotesChange(event.target.value)}
                        helperText="Local notes only."
                    />
                </AppBox>
            ) : null}

            {showAdvancedConditions ? (
                <AppBox sx={{display: "grid", gap: 1, pt: 0.5}}>
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
