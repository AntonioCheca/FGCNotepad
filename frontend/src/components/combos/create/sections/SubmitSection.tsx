import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppChip} from "@/src/components/ui/AppChip";
import {AppMenuItem} from "@/src/components/ui/AppMenuItem";
import {AppTextField} from "@/src/components/ui/AppTextField";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {SectionCard} from "@/src/components/ui/tactical/SectionCard";
import {ActionBar} from "@/src/components/ui/tactical/ActionBar";
import {ToggleRow} from "@/src/components/ui/tactical/ToggleRow";
import {CheckCircleOutlineIcon} from "@/src/components/ui/AppIcons";
import type {
    ComboRequirementsPayload,
    ComboObjectStateDraft,
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
    minimumDriveCost?: string;
    minimumDriveCostNoBurnout?: string;
    superCost: string;
    superGain: string;
    description: string;
    notes: string;
    canSubmit: boolean;
    showAdvancedConditions: boolean;
    requirements: ComboRequirementsPayload;
    activeRequirementsCount: number;
    requirementObjects: RequirementObjectOption[];
    objectStates: ComboObjectStateDraft[];
    readOnly?: boolean;
    submitLabel?: string;
    sectionTitle?: string;
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
    onObjectStatesChange: (value: ComboObjectStateDraft[]) => void;
}

export function SubmitSection({
    title,
    damage,
    driveCost,
    driveGain,
    minimumDriveCost = "",
    minimumDriveCostNoBurnout = "",
    superCost,
    superGain,
    description,
    notes,
    canSubmit,
    showAdvancedConditions,
    requirements,
    activeRequirementsCount,
    requirementObjects,
    objectStates,
    readOnly = false,
    submitLabel = "Create Combo",
    sectionTitle = "Submit",
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
    onObjectStatesChange,
}: SubmitSectionProps) {
    const availableObjectOptions = requirementObjects.filter((option) => !objectStates.some((state) => state.object_key === option.object_key));

    const updateObjectState = (index: number, update: Partial<ComboObjectStateDraft>) => {
        onObjectStatesChange(objectStates.map((state, stateIndex) => stateIndex === index ? {...state, ...update} : state));
    };

    const addObjectState = (objectKey: string) => {
        if (!objectKey) {
            return;
        }

        const option = requirementObjects.find((candidate) => candidate.object_key === objectKey);
        if (!option) {
            return;
        }

        onObjectStatesChange([
            ...objectStates,
            {
                object_key: option.object_key,
                status_required: "",
                consumed: false,
                added_relative: "",
                added_absolute: "",
            },
        ]);
    };

    const removeObjectState = (index: number) => {
        onObjectStatesChange(objectStates.filter((_, stateIndex) => stateIndex !== index));
    };

    return (
        <SectionCard
            title={sectionTitle}
            tone="default"
            variant="finalize"
        >
            <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", md: "minmax(0, 1fr) auto"}, gap: 1, alignItems: {xs: "start", md: "center"}}}>
                <AppTextField
                    label="Combo Title"
                    value={title}
                    onChange={(event) => onTitleChange(event.target.value)}
                    required
                    helperText={readOnly ? undefined : "Auto-filled from notation when possible."}
                    disabled={readOnly}
                />
                {!readOnly ? (
                    <AppButton type="submit" variant="contained" color="primary" disabled={!canSubmit} sx={{minWidth: 180, minHeight: 40, alignSelf: {md: "center"}}}>
                        {submitLabel}
                    </AppButton>
                ) : null}
            </AppBox>

            {!readOnly ? <ActionBar>
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
            </ActionBar> : null}

            <AppBox sx={{display: "grid", gap: 1, pt: 0.5}}>
                <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", md: "160px minmax(220px, 1fr)"}, gap: 1, alignItems: "center"}}>
                    <AppTextField
                        label="Estimated Damage"
                        value={damage}
                        onChange={(event) => onDamageChange(event.target.value)}
                        inputMode="numeric"
                        required
                        disabled={readOnly}
                    />
                    {!readOnly ? <AppTypography variant="body2" color="text.secondary">
                        Auto-filled from Fill Details and visible before creation.
                    </AppTypography> : null}
                </AppBox>
                {!readOnly ? (
                    <AppBox sx={{display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center"}}>
                        <AppTypography variant="body2" color="text.secondary">Min Drive: {minimumDriveCost || "-"} bars</AppTypography>
                        <AppTypography variant="body2" color="text.secondary">Safe Drive: {minimumDriveCostNoBurnout || "-"} bars</AppTypography>
                    </AppBox>
                ) : null}
                <AppTextField
                    label="Description"
                    value={description}
                    onChange={(event) => onDescriptionChange(event.target.value)}
                    disabled={readOnly}
                />
                {!readOnly ? (
                    <AppTextField
                        label="Notes"
                        value={notes}
                        onChange={(event) => onNotesChange(event.target.value)}
                        helperText="Local notes only."
                    />
                ) : null}
            </AppBox>

            {showAdvancedConditions ? (
                <AppBox sx={{display: "grid", gap: 1, pt: 0.5}}>
                    <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr 1fr", md: "repeat(4, minmax(110px, 1fr))"}, gap: 1}}>
                        <AppTextField
                            label="Drive Cost"
                            value={driveCost}
                            onChange={(event) => onDriveCostChange(event.target.value)}
                            inputMode="decimal"
                            disabled={readOnly}
                        />
                        <AppTextField
                            label="Drive Gain"
                            value={driveGain}
                            onChange={(event) => onDriveGainChange(event.target.value)}
                            inputMode="decimal"
                            disabled={readOnly}
                        />
                    </AppBox>
                    <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr 1fr", md: "repeat(2, minmax(110px, 1fr))"}, gap: 1, maxWidth: {md: 560}}}>
                        <AppTextField
                            label="Super Cost"
                            value={superCost}
                            onChange={(event) => onSuperCostChange(event.target.value)}
                            inputMode="decimal"
                            disabled={readOnly}
                        />
                        <AppTextField
                            label="Super Gain"
                            value={superGain}
                            onChange={(event) => onSuperGainChange(event.target.value)}
                            inputMode="decimal"
                            disabled={readOnly}
                        />
                    </AppBox>
                    <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", md: "1fr 1fr"}, gap: 1}}>
                        {requirementToggles.map(({key, label}) => (
                            <ToggleRow
                                key={key}
                                label={label}
                                checked={Boolean(requirements[key])}
                                disabled={
                                    readOnly
                                    || (key === "counter_hit_required" && Boolean(requirements.punish_counter_required))
                                    || (key === "punish_counter_required" && Boolean(requirements.counter_hit_required))
                                }
                                onChange={(checked) => onRequirementToggle(key, checked)}
                            />
                        ))}
                    </AppBox>
                    <AppBox sx={{display: "flex", gap: 0.5, flexWrap: "wrap"}}>
                        <AppChip size="small" variant="outlined" color="info" label={`${activeRequirementsCount} active conditions`} />
                    </AppBox>
                    <AppBox sx={{display: "grid", gap: 0.75}}>
                        <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", sm: "minmax(180px, 320px) auto"}, gap: 0.75, alignItems: "center"}}>
                            <AppTextField
                                select
                                size="small"
                                label="Add character object"
                                value=""
                                onChange={(event) => addObjectState(event.target.value)}
                                disabled={readOnly || availableObjectOptions.length === 0}
                            >
                                <AppMenuItem value="">Select object</AppMenuItem>
                                {availableObjectOptions.map((option) => (
                                    <AppMenuItem key={option.object_key} value={option.object_key}>{option.name}</AppMenuItem>
                                ))}
                            </AppTextField>
                            <AppTypography variant="caption" color="text.secondary">
                                {requirementObjects.length === 0 ? "Select a character with object metadata." : `${objectStates.length} object states`}
                            </AppTypography>
                        </AppBox>

                        {objectStates.map((state, index) => {
                            const option = requirementObjects.find((candidate) => candidate.object_key === state.object_key) ?? null;
                            if (!option) {
                                return null;
                            }

                            const numericHelper = option.max_status !== null ? `1-${option.max_status}` : undefined;
                            const requiredValue = option.status_type === "boolean" ? state.status_required === "true" : state.status_required;
                            const relativeValue = option.status_type === "boolean" ? state.added_relative === "true" : state.added_relative;
                            const absoluteValue = option.status_type === "boolean" ? state.added_absolute === "true" : state.added_absolute;

                            return (
                                <AppBox key={state.object_key} sx={{display: "grid", gridTemplateColumns: {xs: "1fr", lg: "minmax(120px, 0.8fr) repeat(4, minmax(120px, 1fr)) auto"}, gap: 0.75, alignItems: "center"}}>
                                    <AppTypography variant="body2" color="text.primary">{option.name}</AppTypography>
                                    {option.status_type === "boolean" ? (
                                        <ToggleRow label="Required" checked={Boolean(requiredValue)} disabled={readOnly} onChange={(checked) => updateObjectState(index, {status_required: checked ? "true" : ""})} />
                                    ) : (
                                        <AppTextField size="small" label="Required" value={requiredValue} helperText={numericHelper} inputMode="numeric" disabled={readOnly} onChange={(event) => updateObjectState(index, {status_required: event.target.value})} />
                                    )}
                                    <ToggleRow label="Consumed" checked={state.consumed} disabled={readOnly || !option.can_be_consumed} onChange={(checked) => updateObjectState(index, {consumed: checked})} />
                                    {option.status_type === "boolean" ? (
                                        <ToggleRow label="Added" checked={Boolean(relativeValue)} disabled={readOnly || !option.can_be_added_relative} onChange={(checked) => updateObjectState(index, {added_relative: checked ? "true" : ""})} />
                                    ) : (
                                        <AppTextField size="small" label="Added relative" value={relativeValue} helperText={numericHelper} inputMode="numeric" disabled={readOnly || !option.can_be_added_relative} onChange={(event) => updateObjectState(index, {added_relative: event.target.value, added_absolute: ""})} />
                                    )}
                                    <AppTextField size="small" label="Added absolute" value={absoluteValue} helperText={numericHelper} inputMode={option.status_type === "integer" ? "numeric" : undefined} disabled={readOnly || !option.can_be_added_absolute} onChange={(event) => updateObjectState(index, {added_absolute: event.target.value, added_relative: ""})} />
                                    {!readOnly ? <AppButton type="button" variant="text" color="secondary" onClick={() => removeObjectState(index)}>Remove</AppButton> : null}
                                </AppBox>
                            );
                        })}
                    </AppBox>
                </AppBox>
            ) : null}

            {!readOnly ? <AppBox sx={{display: "flex", gap: 0.6, alignItems: "center", flexWrap: "wrap"}}>
                <CheckCircleOutlineIcon fontSize="small" color={canSubmit ? "success" : "disabled"} />
                <AppTypography variant="body2" color="text.secondary">
                    Ready: {canSubmit ? "yes" : "missing title, step move, or connection"}
                </AppTypography>
            </AppBox> : null}
        </SectionCard>
    );
}
