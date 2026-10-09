import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppCheckbox} from "@/src/components/ui/AppCheckbox";
import {AppFormControlLabel} from "@/src/components/ui/AppFormControlLabel";
import {AppMenuItem} from "@/src/components/ui/AppMenuItem";
import {AppTextField} from "@/src/components/ui/AppTextField";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {HelpTip} from "@/src/components/ui/tactical/HelpTip";
import {InlineNotice} from "@/src/components/ui/tactical/InlineNotice";
import {SectionCard} from "@/src/components/ui/tactical/SectionCard";
import type {
    ComboRequirementsPayload,
    ComboObjectStateDraft,
    ComboSpacingOption,
    RequirementObjectOption,
} from "@/src/types/combo";
import {
    isRequirementToggleLocked,
    requirementToggles,
    type RequirementToggleKey,
} from "@/src/components/combos/create/utils/comboForm";

// Every combo needs at least 0.1 Drive to avoid burnout, so that value says nothing about this combo.
const SAFE_DRIVE_BASELINE = 0.1;

interface SubmitSectionProps {
    title: string;
    damage: string;
    damageModeLabel?: string | null;
    driveCost: string;
    driveGain: string;
    minimumDriveCost?: string;
    minimumDriveCostNoBurnout?: string;
    superCost: string;
    superGain: string;
    spacingCode: string;
    spacingOptions: ComboSpacingOption[];
    spacingLoading?: boolean;
    showAdvancedConditions: boolean;
    requirements: ComboRequirementsPayload;
    requirementObjects: RequirementObjectOption[];
    objectStates: ComboObjectStateDraft[];
    submitError?: string | null;
    submitting?: boolean;
    // Editing saves from the page header, so the section drops its own button there.
    submitLabel?: string | null;
    sectionTitle?: string;
    onTitleChange: (value: string) => void;
    onDamageChange: (value: string) => void;
    onDriveCostChange: (value: string) => void;
    onDriveGainChange: (value: string) => void;
    onSuperCostChange: (value: string) => void;
    onSuperGainChange: (value: string) => void;
    onSpacingChange: (value: string) => void;
    onToggleAdvancedConditions: () => void;
    onResetDraft: () => void;
    onRequirementToggle: (key: RequirementToggleKey, checked: boolean) => void;
    onObjectStatesChange: (value: ComboObjectStateDraft[]) => void;
}

function meaningfulDrive(value: string, baseline: number): string | null {
    const parsed = Number(value);
    return value.trim() !== "" && Number.isFinite(parsed) && parsed > baseline ? value : null;
}

export function SubmitSection({
    title,
    damage,
    damageModeLabel = null,
    driveCost,
    driveGain,
    minimumDriveCost = "",
    minimumDriveCostNoBurnout = "",
    superCost,
    superGain,
    spacingCode,
    spacingOptions,
    spacingLoading = false,
    showAdvancedConditions,
    requirements,
    requirementObjects,
    objectStates,
    submitError = null,
    submitting = false,
    submitLabel = "Create Combo",
    sectionTitle = "Submit",
    onTitleChange,
    onDamageChange,
    onDriveCostChange,
    onDriveGainChange,
    onSuperCostChange,
    onSuperGainChange,
    onSpacingChange,
    onToggleAdvancedConditions,
    onResetDraft,
    onRequirementToggle,
    onObjectStatesChange,
}: SubmitSectionProps) {
    const minimumDrive = meaningfulDrive(minimumDriveCost, 0);
    const safeDrive = meaningfulDrive(minimumDriveCostNoBurnout, SAFE_DRIVE_BASELINE);

    return (
        <SectionCard title={sectionTitle}>
            <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", md: submitLabel ? "minmax(0, 1fr) auto" : "minmax(0, 1fr)"}, gap: 1, alignItems: "center"}}>
                <AppTextField label="Combo Title" value={title} onChange={(event) => onTitleChange(event.target.value)} InputLabelProps={{required: true}} />
                {submitLabel ? (
                    <AppButton type="submit" variant="contained" color="primary" disabled={submitting} sx={{minWidth: {xs: 0, md: 180}, minHeight: 40, width: {xs: "100%", md: "auto"}}}>
                        {submitLabel}
                    </AppButton>
                ) : null}
            </AppBox>

            {submitError ? <InlineNotice severity="error">{submitError}</InlineNotice> : null}

            <AppBox sx={{display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center"}}>
                <AppTextField
                    label={damageModeLabel ? `Damage (${damageModeLabel})` : "Damage"}
                    value={damage}
                    onChange={(event) => onDamageChange(event.target.value)}
                    inputMode="numeric"
                    InputLabelProps={{required: true}}
                    sx={{width: {xs: "100%", sm: 170}}}
                />
                <AppBox sx={{display: "inline-flex", alignItems: "center", gap: 0.5, width: {xs: "100%", sm: "auto"}}}>
                    <AppTextField select label="Spacing" value={spacingCode} onChange={(event) => onSpacingChange(event.target.value)} disabled={spacingLoading} sx={{width: {xs: "100%", sm: 200}}}>
                        <AppMenuItem value="">Unclassified</AppMenuItem>
                        {spacingOptions.map((option) => (
                            <AppMenuItem key={option.code} value={option.code}>{option.name}</AppMenuItem>
                        ))}
                    </AppTextField>
                    {spacingCode === "punish_tip" ? <HelpTip text="The starter connects because the punished move has an extended hurtbox, farther than the starter's normal tip range." /> : null}
                </AppBox>
                {minimumDrive ? <AppTypography variant="body2" color="text.secondary">Min Drive {minimumDrive}</AppTypography> : null}
                {safeDrive ? <AppTypography variant="body2" color="text.secondary">Safe Drive {safeDrive}</AppTypography> : null}
            </AppBox>

            <AppBox role="group" aria-label="Conditions" sx={{display: "flex", flexWrap: "wrap", columnGap: 1.5, rowGap: 0}}>
                {requirementToggles.map(({key, label, ariaLabel}) => (
                    <AppFormControlLabel
                        key={key}
                        label={label}
                        sx={{mr: 0, "& .MuiFormControlLabel-label": {fontWeight: 600}}}
                        control={(
                            <AppCheckbox
                                size="small"
                                checked={Boolean(requirements[key])}
                                disabled={isRequirementToggleLocked(requirements, key)}
                                onChange={(event) => onRequirementToggle(key, event.target.checked)}
                                inputProps={{"aria-label": ariaLabel}}
                            />
                        )}
                    />
                ))}
            </AppBox>

            <AppBox sx={{display: "flex", gap: 1, flexWrap: "wrap"}}>
                <AppButton type="button" variant="text" color="secondary" onClick={onToggleAdvancedConditions} aria-expanded={showAdvancedConditions}>
                    {showAdvancedConditions ? "Hide Resources" : "Resources"}
                </AppButton>
                <AppButton type="button" variant="text" color="secondary" onClick={onResetDraft}>
                    Reset Draft
                </AppButton>
            </AppBox>

            {showAdvancedConditions ? (
                <AppBox sx={{display: "grid", gap: 1}}>
                    <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr 1fr", md: "repeat(4, minmax(110px, 150px))"}, gap: 1}}>
                        <AppTextField label="Drive Cost" value={driveCost} onChange={(event) => onDriveCostChange(event.target.value)} inputMode="decimal" />
                        <AppTextField label="Drive Gain" value={driveGain} onChange={(event) => onDriveGainChange(event.target.value)} inputMode="decimal" />
                        <AppTextField label="Super Cost" value={superCost} onChange={(event) => onSuperCostChange(event.target.value)} inputMode="decimal" />
                        <AppTextField label="Super Gain" value={superGain} onChange={(event) => onSuperGainChange(event.target.value)} inputMode="decimal" />
                    </AppBox>
                    <ObjectStatesEditor requirementObjects={requirementObjects} objectStates={objectStates} onObjectStatesChange={onObjectStatesChange} />
                </AppBox>
            ) : null}
        </SectionCard>
    );
}

interface ObjectStatesEditorProps {
    requirementObjects: RequirementObjectOption[];
    objectStates: ComboObjectStateDraft[];
    onObjectStatesChange: (value: ComboObjectStateDraft[]) => void;
}

function ObjectStatesEditor({requirementObjects, objectStates, onObjectStatesChange}: ObjectStatesEditorProps) {
    if (requirementObjects.length === 0) {
        return null;
    }

    const availableObjectOptions = requirementObjects.filter((option) => !objectStates.some((state) => state.object_key === option.object_key));

    const updateObjectState = (index: number, update: Partial<ComboObjectStateDraft>) => {
        onObjectStatesChange(objectStates.map((state, stateIndex) => stateIndex === index ? {...state, ...update} : state));
    };

    const addObjectState = (objectKey: string) => {
        const option = requirementObjects.find((candidate) => candidate.object_key === objectKey);
        if (!option) {
            return;
        }

        onObjectStatesChange([...objectStates, {object_key: option.object_key, status_required: "", consumed: false, added_relative: "", added_absolute: ""}]);
    };

    return (
        <AppBox sx={{display: "grid", gap: 0.75}}>
            {availableObjectOptions.length > 0 ? (
                <AppTextField select size="small" label="Add character resource" value="" onChange={(event) => addObjectState(event.target.value)} sx={{width: {xs: "100%", sm: 280}}}>
                    {availableObjectOptions.map((option) => (
                        <AppMenuItem key={option.object_key} value={option.object_key}>{option.name}</AppMenuItem>
                    ))}
                </AppTextField>
            ) : null}

            {objectStates.map((state, index) => {
                const option = requirementObjects.find((candidate) => candidate.object_key === state.object_key) ?? null;
                if (!option) {
                    return null;
                }

                const numericHelper = option.max_status !== null ? `1-${option.max_status}` : undefined;
                const isBoolean = option.status_type === "boolean";

                return (
                    <AppBox key={state.object_key} sx={{display: "grid", gridTemplateColumns: {xs: "1fr 1fr", lg: "minmax(120px, 0.8fr) repeat(4, minmax(110px, 1fr)) auto"}, gap: 0.75, alignItems: "center"}}>
                        <AppTypography variant="body2" sx={{fontWeight: 700, gridColumn: {xs: "1 / -1", lg: "auto"}}}>{option.name}</AppTypography>
                        {isBoolean ? (
                            <CompactCheckbox label="Required" checked={state.status_required === "true"} onChange={(checked) => updateObjectState(index, {status_required: checked ? "true" : ""})} />
                        ) : (
                            <AppTextField size="small" label="Required" value={state.status_required} helperText={numericHelper} inputMode="numeric" onChange={(event) => updateObjectState(index, {status_required: event.target.value})} />
                        )}
                        <CompactCheckbox label="Consumed" checked={state.consumed} disabled={!option.can_be_consumed} onChange={(checked) => updateObjectState(index, {consumed: checked})} />
                        {isBoolean ? (
                            <CompactCheckbox label="Added" checked={state.added_relative === "true"} disabled={!option.can_be_added_relative} onChange={(checked) => updateObjectState(index, {added_relative: checked ? "true" : ""})} />
                        ) : (
                            <AppTextField size="small" label="Added relative" value={state.added_relative} helperText={numericHelper} inputMode="numeric" disabled={!option.can_be_added_relative} onChange={(event) => updateObjectState(index, {added_relative: event.target.value, added_absolute: ""})} />
                        )}
                        <AppTextField size="small" label="Added absolute" value={state.added_absolute} helperText={numericHelper} inputMode={isBoolean ? undefined : "numeric"} disabled={!option.can_be_added_absolute} onChange={(event) => updateObjectState(index, {added_absolute: event.target.value, added_relative: ""})} />
                        <AppButton type="button" variant="text" color="secondary" onClick={() => onObjectStatesChange(objectStates.filter((_, stateIndex) => stateIndex !== index))}>Remove</AppButton>
                    </AppBox>
                );
            })}
        </AppBox>
    );
}

function CompactCheckbox({label, checked, disabled, onChange}: {label: string; checked: boolean; disabled?: boolean; onChange: (checked: boolean) => void}) {
    return (
        <AppFormControlLabel
            label={label}
            sx={{mr: 0}}
            control={<AppCheckbox size="small" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} />}
        />
    );
}
