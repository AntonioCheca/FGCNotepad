import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppChip} from "@/src/components/ui/AppChip";
import {AppFormControl} from "@/src/components/ui/AppFormControl";
import {AppInputLabel} from "@/src/components/ui/AppInputLabel";
import {AppMenuItem} from "@/src/components/ui/AppMenuItem";
import {AppSelect} from "@/src/components/ui/AppSelect";
import {AppTextField} from "@/src/components/ui/AppTextField";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {SectionCard} from "@/src/components/ui/tactical/SectionCard";
import type {ScenarioCharacterStatusPayload, ScenarioComboContextPayload, ScenarioPositionLock} from "@/hooks/useScenarios";
import type {ScenarioStatusDefinition} from "./scenarioEditorTypes";

interface ScenarioComboEnvironmentSectionProps {
    comboContext: ScenarioComboContextPayload;
    statusObjectName: string;
    statusRequired: string;
    statusCatalog: ScenarioStatusDefinition[];
    onPositionLockChange: (value: ScenarioPositionLock) => void;
    onStatusObjectNameChange: (value: string) => void;
    onStatusRequiredChange: (value: string) => void;
    onAddStatusLock: (status: ScenarioCharacterStatusPayload) => void;
    onRemoveStatusLock: (objectName: string) => void;
    onValidationError: (message: string) => void;
    onClearError: () => void;
}

export function ScenarioComboEnvironmentSection({
    comboContext,
    statusObjectName,
    statusRequired,
    statusCatalog,
    onPositionLockChange,
    onStatusObjectNameChange,
    onStatusRequiredChange,
    onAddStatusLock,
    onRemoveStatusLock,
    onValidationError,
    onClearError,
}: ScenarioComboEnvironmentSectionProps) {
    const selectedStatusDefinition = statusCatalog.find((status) => status.name === statusObjectName) ?? null;

    return (
        <SectionCard
            title="Combo Environment"
            description="Lock only scenario-wide combo assumptions that are part of the setup. Leave normal cases viewer-controlled."
            tone="default"
            variant="input"
        >
            <AppBox sx={{display: "grid", gap: 1}}>
                <AppFormControl size="small">
                    <AppInputLabel id="combo-position-lock-label">Position Lock</AppInputLabel>
                    <AppSelect labelId="combo-position-lock-label" label="Position Lock" value={comboContext.positionLock} onChange={(event) => onPositionLockChange(event.target.value as ScenarioPositionLock)}>
                        <AppMenuItem value="viewer_default_midscreen">Viewer decides, default midscreen</AppMenuItem>
                        <AppMenuItem value="corner">Always corner</AppMenuItem>
                        <AppMenuItem value="midscreen">Always midscreen</AppMenuItem>
                    </AppSelect>
                </AppFormControl>

                <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", md: "minmax(220px, 1fr) minmax(160px, 0.6fr) auto"}, gap: 1, alignItems: "center"}}>
                    <AppFormControl size="small">
                        <AppInputLabel id="combo-status-object-label">Character Status Lock</AppInputLabel>
                        <AppSelect
                            labelId="combo-status-object-label"
                            label="Character Status Lock"
                            value={statusObjectName}
                            onChange={(event) => {
                                onStatusObjectNameChange(event.target.value as string);
                                onStatusRequiredChange("");
                            }}
                        >
                            <AppMenuItem value="">None</AppMenuItem>
                            {statusCatalog.map((status) => <AppMenuItem key={status.name} value={status.name}>{status.name}</AppMenuItem>)}
                        </AppSelect>
                    </AppFormControl>
                    <AppTextField
                        label={selectedStatusDefinition?.status_type === "boolean" ? "Required" : "Count"}
                        size="small"
                        type={selectedStatusDefinition?.status_type === "integer" ? "number" : undefined}
                        value={selectedStatusDefinition?.status_type === "boolean" ? "true" : statusRequired}
                        disabled={!selectedStatusDefinition || selectedStatusDefinition.status_type === "boolean"}
                        inputProps={selectedStatusDefinition?.max_status ? {min: 1, max: selectedStatusDefinition.max_status} : undefined}
                        onChange={(event) => onStatusRequiredChange(event.target.value)}
                    />
                    <AppButton
                        type="button"
                        variant="outlined"
                        color="secondary"
                        disabled={!selectedStatusDefinition || comboContext.characterStatuses.some((status) => status.object_name === statusObjectName)}
                        onClick={() => {
                            if (!selectedStatusDefinition) {
                                return;
                            }

                            const nextValue = selectedStatusDefinition.status_type === "boolean" ? true : Number.parseInt(statusRequired, 10);
                            if (selectedStatusDefinition.status_type === "integer" && (typeof nextValue !== "number" || !Number.isFinite(nextValue) || nextValue < 1)) {
                                onValidationError("Character status count must be at least 1.");
                                return;
                            }

                            onAddStatusLock({object_name: selectedStatusDefinition.name, status_required: nextValue});
                            onStatusObjectNameChange("");
                            onStatusRequiredChange("");
                            onClearError();
                        }}
                    >
                        Add Lock
                    </AppButton>
                </AppBox>

                {comboContext.characterStatuses.length > 0 ? (
                    <AppBox sx={{display: "flex", flexWrap: "wrap", gap: 0.75}}>
                        {comboContext.characterStatuses.map((status) => (
                            <AppChip key={status.object_name} label={`${status.object_name}: ${String(status.status_required)}`} onDelete={() => onRemoveStatusLock(status.object_name)} />
                        ))}
                    </AppBox>
                ) : (
                    <AppTypography variant="body2" color="text.secondary">No character status locks.</AppTypography>
                )}
            </AppBox>
        </SectionCard>
    );
}
