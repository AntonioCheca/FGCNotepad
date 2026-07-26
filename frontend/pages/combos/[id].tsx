import React from "react";
import Link from "next/link";
import {useRouter} from "next/router";

import useCombos from "@/hooks/useCombos";
import useConnections from "@/hooks/useConnections";
import AuthContext from "@/services/AuthContext";
import {AppAlert} from "@/src/components/ui/AppAlert";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppCircularProgress} from "@/src/components/ui/AppCircularProgress";
import {AppContainer} from "@/src/components/ui/AppContainer";
import {AppDialog} from "@/src/components/ui/AppDialog";
import {AppDialogActions} from "@/src/components/ui/AppDialogActions";
import {AppDialogContent} from "@/src/components/ui/AppDialogContent";
import {AppDialogTitle} from "@/src/components/ui/AppDialogTitle";
import {AppSnackbar} from "@/src/components/ui/AppSnackbar";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {ParserVerificationSection} from "@/src/components/combos/create/sections/ParserVerificationSection";
import {SubmitSection} from "@/src/components/combos/create/sections/SubmitSection";
import {ContentFlagButton} from "@/src/components/flags/ContentFlagButton";
import {
    buildCreateFullComboPayload,
    buildRequirementsPayload,
    emptyRequirements,
    requirementToggles,
    updateDraftStep,
    validateSteps,
    type RequirementToggleKey,
} from "@/src/components/combos/create/utils/comboForm";
import type {
    ComboDetailApi,
    ComboDetailView,
    ComboRequirementsPayload,
    ComboStep,
    ConnectionType,
    LeafSequenceOption,
    RequirementObjectOption,
    StepDraft,
    TranslateParsedToken,
} from "@/src/types/combo";
import {mapComboToDetailView} from "@/src/types/combo";

function getAuditStatusLabel(needsTechnicalReview: boolean): string {
    return needsTechnicalReview ? "Usable - pending technical review" : "Fully audited";
}

function formatField(value: number | string | null | undefined): string {
    if (value === null || value === undefined || value === "") {
        return "";
    }

    return String(value);
}

function getInitialRequirements(combo: ComboDetailView | null): ComboRequirementsPayload {
    const source = combo?.requirements;
    const requirements: ComboRequirementsPayload = {
        ...emptyRequirements,
        counter_hit_required: source?.counter_hit_required ?? false,
        punish_counter_required: source?.punish_counter_required ?? false,
        corner_required: source?.corner_required ?? false,
        airborne_required: source?.airborne_required ?? false,
        mid_screen_required: source?.mid_screen_required ?? false,
        not_crouching_required: source?.not_crouching_required ?? false,
    };

    if (source?.requirement_specific_character?.object_name && source.requirement_specific_character.status_required !== undefined) {
        requirements.requirement_specific_character = {
            object_name: source.requirement_specific_character.object_name,
            status_required: source.requirement_specific_character.status_required,
        };
    }

    return requirements;
}

function getSpecificRequirementObjectName(combo: ComboDetailView | null): string {
    return combo?.requirements?.requirement_specific_character?.object_name ?? "";
}

function getSpecificRequirementStatus(combo: ComboDetailView | null): string {
    const status = combo?.requirements?.requirement_specific_character?.status_required;
    return status === undefined || status === null ? "" : String(status);
}

function mapStepToDraft(step: ComboStep, combo: ComboDetailView, leafs: LeafSequenceOption[], connections: ConnectionType[]): StepDraft {
    const fallbackMove = step.child_sequence_id
        ? {
            id: step.child_sequence_id,
            name: step.child_sequence_name ?? "Unknown move",
            character: {id: combo.characterId ?? "", name: combo.characterName},
        }
        : null;
    const move = leafs.find((leaf) => leaf.id === step.child_sequence_id) ?? fallbackMove;
    const connection = connections.find((current) => current.id === step.connection_type_id)
        ?? (step.connection_type_id ? {id: step.connection_type_id, name: step.connection_type_name ?? ""} : null);
    const hasDelay = step.delay_min_frames !== null || step.delay_max_frames !== null;
    const fixedDelay = hasDelay && step.delay_min_frames === step.delay_max_frames;

    return {
        move,
        connection,
        delay_type: fixedDelay ? "fixed" : "window",
        delay_frames: fixedDelay ? formatField(step.delay_min_frames) : "",
        delay_min_frames: !fixedDelay ? formatField(step.delay_min_frames) : "",
        delay_max_frames: !fixedDelay ? formatField(step.delay_max_frames) : "",
        delay_min_unverified: step.delay_min_unverified,
        delay_max_unverified: step.delay_max_unverified,
    };
}

function buildTokens(steps: StepDraft[]): TranslateParsedToken[] {
    return steps.map((step, index) => ({
        index: index + 1,
        token: step.move?.name ?? `Step ${index + 1}`,
        normalizedToken: step.move?.name ?? `STEP_${index + 1}`,
        status: step.move?.id ? "parsed" : "pending",
        child_sequence_id: step.move?.id ?? null,
        reason: null,
    }));
}

export default function ComboDetailPage() {
    const router = useRouter();
    const authContext = React.useContext(AuthContext);
    if (!authContext) {
        throw new Error("AuthContext must be used within an AuthProvider");
    }

    const {id} = router.query;
    const comboId = typeof id === "string" ? id : null;
    const numericComboId = comboId ? Number.parseInt(comboId, 10) : null;
    const canModerate = authContext.canModerate;

    const {getCombo, updateCombo, deleteCombo, fetchLeafs, fetchRequirementObjects} = useCombos();
    const {connections, loading: connectionsLoading, fetchConnections} = useConnections();

    const [combo, setCombo] = React.useState<ComboDetailView | null>(null);
    const [leafs, setLeafs] = React.useState<LeafSequenceOption[]>([]);
    const [requirementObjects, setRequirementObjects] = React.useState<RequirementObjectOption[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [editMode, setEditMode] = React.useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
    const [saving, setSaving] = React.useState(false);
    const [toast, setToast] = React.useState<{severity: "success" | "error"; message: string} | null>(null);

    const [title, setTitle] = React.useState("");
    const [damage, setDamage] = React.useState("");
    const [driveCost, setDriveCost] = React.useState("");
    const [driveGain, setDriveGain] = React.useState("");
    const [superCost, setSuperCost] = React.useState("");
    const [superGain, setSuperGain] = React.useState("");
    const [description, setDescription] = React.useState("");
    const [notes, setNotes] = React.useState("");
    const [showAdvancedConditions, setShowAdvancedConditions] = React.useState(true);
    const [requirements, setRequirements] = React.useState<ComboRequirementsPayload>(emptyRequirements);
    const [specificRequirementObject, setSpecificRequirementObject] = React.useState("");
    const [specificRequirementStatus, setSpecificRequirementStatus] = React.useState("");
    const [steps, setSteps] = React.useState<StepDraft[]>([]);
    const [selectedStepIndex, setSelectedStepIndex] = React.useState<number | null>(0);

    const resetDraftFromCombo = React.useCallback((nextCombo: ComboDetailView, nextLeafs: LeafSequenceOption[], nextConnections: ConnectionType[]) => {
        setTitle(nextCombo.title === "-" ? "" : nextCombo.title);
        setDamage(formatField(nextCombo.damage));
        setDriveCost(formatField(nextCombo.driveCost === "-" ? "" : nextCombo.driveCost));
        setDriveGain(formatField(nextCombo.driveGain === "-" ? "" : nextCombo.driveGain));
        setSuperCost(formatField(nextCombo.superCost === "-" ? "" : nextCombo.superCost));
        setSuperGain(formatField(nextCombo.superGain === "-" ? "" : nextCombo.superGain));
        setDescription(nextCombo.description);
        setNotes("");
        setRequirements(getInitialRequirements(nextCombo));
        setSpecificRequirementObject(getSpecificRequirementObjectName(nextCombo));
        setSpecificRequirementStatus(getSpecificRequirementStatus(nextCombo));
        const nextSteps = nextCombo.steps.map((step) => mapStepToDraft(step, nextCombo, nextLeafs, nextConnections));
        setSteps(nextSteps);
        setSelectedStepIndex(nextSteps.length > 0 ? 0 : null);
    }, []);

    React.useEffect(() => {
        if (!comboId) {
            return;
        }

        let canceled = false;
        setLoading(true);
        setError(null);

        Promise.all([getCombo(comboId), fetchConnections(), fetchRequirementObjects()])
            .then(async ([comboResponse, connectionResponse, requirementResponse]: [ComboDetailApi, ConnectionType[], RequirementObjectOption[]]) => {
                const nextCombo = mapComboToDetailView(comboResponse);
                const nextLeafs = nextCombo.characterId ? await fetchLeafs(nextCombo.characterId) : [];
                if (canceled) {
                    return;
                }

                setCombo(nextCombo);
                setLeafs(nextLeafs ?? []);
                setRequirementObjects(requirementResponse ?? []);
                resetDraftFromCombo(nextCombo, nextLeafs ?? [], connectionResponse ?? []);
            })
            .catch(() => {
                if (!canceled) {
                    setError("Unable to load combo.");
                }
            })
            .finally(() => {
                if (!canceled) {
                    setLoading(false);
                }
            });

        return () => {
            canceled = true;
        };
    }, [comboId, fetchConnections, fetchLeafs, fetchRequirementObjects, getCombo, resetDraftFromCombo]);

    const selectedRequirementObject = requirementObjects.find((option) => option.name === specificRequirementObject) ?? null;
    const selectedObjectIsBoolean = selectedRequirementObject?.status_type === "boolean";
    const selectedObjectIsInteger = selectedRequirementObject?.status_type === "integer";
    const activeRequirementsCount = requirementToggles.filter(({key}) => Boolean(requirements[key])).length + (specificRequirementObject ? 1 : 0);
    const selectedStep = selectedStepIndex !== null ? steps[selectedStepIndex] ?? null : null;
    const verificationTokens = React.useMemo(() => buildTokens(steps), [steps]);
    const tokenToStepIndex = React.useMemo(() => new Map(steps.map((_, index) => [index + 1, index])), [steps]);
    const leafNameById = React.useMemo(() => new Map(steps.flatMap((step) => step.move?.id ? [[step.move.id, step.move.name]] : [])), [steps]);
    const canSubmit = Boolean(title.trim()) && !validateSteps(steps) && Boolean(damage.trim());

    const handleChangeStep = (index: number, update: Partial<StepDraft>) => {
        setSteps((previousSteps) => previousSteps.map((currentStep, stepIndex) => stepIndex === index ? updateDraftStep(currentStep, update) : currentStep));
    };

    const handleAddStep = () => {
        setSteps((previousSteps) => [...previousSteps, {move: null, connection: null, delay_type: "fixed", delay_frames: "", delay_min_frames: "", delay_max_frames: "", delay_min_unverified: false, delay_max_unverified: false}]);
        setSelectedStepIndex(steps.length);
    };

    const handleRemoveStep = (index: number) => {
        setSteps((previousSteps) => previousSteps.filter((_, stepIndex) => stepIndex !== index));
        setSelectedStepIndex((current) => current === null ? null : Math.max(0, Math.min(current, steps.length - 2)));
    };

    const handleRequirementToggle = (key: RequirementToggleKey, checked: boolean) => {
        setRequirements((previous) => ({
            ...previous,
            [key]: checked,
            ...(key === "counter_hit_required" && checked ? {punish_counter_required: false} : {}),
            ...(key === "punish_counter_required" && checked ? {counter_hit_required: false} : {}),
        }));
    };

    const handleSave = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!comboId) {
            return;
        }

        const stepError = validateSteps(steps);
        if (stepError) {
            setToast({severity: "error", message: stepError});
            return;
        }

        const requirementsResult = buildRequirementsPayload({requirements, specificRequirementObject, specificRequirementStatus, selectedRequirementObject});
        if (requirementsResult.error) {
            setToast({severity: "error", message: requirementsResult.error});
            return;
        }

        setSaving(true);
        try {
            const payload = buildCreateFullComboPayload({
                title,
                description,
                damage,
                driveCost,
                driveGain,
                superCost,
                superGain,
                requirements: requirementsResult.payload ?? emptyRequirements,
                steps,
            });
            const response = await updateCombo(comboId, payload) as ComboDetailApi;
            const nextCombo = mapComboToDetailView(response);
            setCombo(nextCombo);
            resetDraftFromCombo(nextCombo, leafs, connections);
            setEditMode(false);
            setToast({severity: "success", message: "Combo updated."});
        } catch {
            setToast({severity: "error", message: "Unable to update combo."});
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!comboId) {
            return;
        }

        setSaving(true);
        try {
            await deleteCombo(comboId);
            await router.push("/combos");
        } catch {
            setToast({severity: "error", message: "Unable to delete combo."});
        } finally {
            setSaving(false);
            setDeleteDialogOpen(false);
        }
    };

    if (loading) {
        return (
            <AppContainer maxWidth={false}>
                <AppCircularProgress sx={{display: "block", margin: "auto", mt: 4}}/>
            </AppContainer>
        );
    }

    if (error || !combo || !comboId) {
        return (
            <AppContainer maxWidth={false}>
                <AppTypography color="error">{error ?? "Combo not found."}</AppTypography>
                <AppBox sx={{mt: 1.5}}>
                    <Link href="/combos" style={{textDecoration: "none"}}>
                        <AppTypography variant="body2">Back to Search Combos</AppTypography>
                    </Link>
                </AppBox>
            </AppContainer>
        );
    }

    return (
        <AppContainer maxWidth={false}>
            <AppSnackbar open={toast !== null} autoHideDuration={3600} onClose={() => setToast(null)} anchorOrigin={{vertical: "top", horizontal: "center"}}>
                <AppAlert severity={toast?.severity ?? "success"} variant="filled" onClose={() => setToast(null)}>{toast?.message}</AppAlert>
            </AppSnackbar>

            <AppBox component="form" onSubmit={handleSave} sx={{display: "grid", gap: {xs: 1.5, md: 1.75}, width: "100%", maxWidth: 1160, mx: "auto"}}>
                <AppBox sx={{display: "grid", gap: 1, gridTemplateColumns: {xs: "1fr", md: "minmax(0, 1fr) auto"}, alignItems: "start"}}>
                    <AppBox sx={{display: "grid", gap: 0.5}}>
                        <AppTypography variant="h4">{combo.title}</AppTypography>
                        <AppTypography variant="body2" color="text.secondary">
                            {combo.characterName} · {getAuditStatusLabel(combo.needsTechnicalReview)} · Seasons {combo.seasonLabels.length > 0 ? combo.seasonLabels.join(", ") : "-"}
                        </AppTypography>
                        <AppTypography variant="body2" color="text.secondary">
                            Damage {combo.damage} · Resource-adjusted {combo.resourceAdjustedDamage} · Drive {combo.driveCost}/{combo.driveGain} · Super {combo.superCost}/{combo.superGain}
                        </AppTypography>
                    </AppBox>
                    <AppBox sx={{display: "flex", gap: 1, justifyContent: {xs: "flex-start", md: "flex-end"}, flexWrap: "wrap"}}>
                        {numericComboId !== null && Number.isFinite(numericComboId) ? <ContentFlagButton targetType="combo" targetId={numericComboId}/> : null}
                        {canModerate && !editMode ? <AppButton type="button" variant="outlined" color="secondary" onClick={() => setEditMode(true)}>Edit</AppButton> : null}
                        {canModerate && editMode ? <AppButton type="button" variant="outlined" color="secondary" onClick={() => { resetDraftFromCombo(combo, leafs, connections); setEditMode(false); }}>Cancel</AppButton> : null}
                        {canModerate && editMode ? <AppButton type="submit" variant="contained" color="primary" disabled={!canSubmit || saving}>Save</AppButton> : null}
                        {canModerate ? <AppButton type="button" variant="outlined" color="error" disabled={saving} onClick={() => setDeleteDialogOpen(true)}>Delete</AppButton> : null}
                    </AppBox>
                </AppBox>

                <ParserVerificationSection
                    hasParseResult={steps.length > 0}
                    verificationTokens={verificationTokens}
                    errorByIndex={new Map()}
                    tokenToStepIndex={tokenToStepIndex}
                    selectedStepIndex={selectedStepIndex}
                    steps={steps}
                    selectedStep={selectedStep}
                    leafNameById={leafNameById}
                    leafs={leafs}
                    connections={connections}
                    connectionsLoading={connectionsLoading}
                    translateWarnings={[]}
                    translateErrors={[]}
                    readOnly={!editMode}
                    onSelectStep={setSelectedStepIndex}
                    onChangeStep={handleChangeStep}
                    onAddStep={handleAddStep}
                    onRemoveStep={handleRemoveStep}
                />

                <SubmitSection
                    sectionTitle="Combo Details"
                    title={title}
                    damage={damage}
                    driveCost={driveCost}
                    driveGain={driveGain}
                    superCost={superCost}
                    superGain={superGain}
                    description={description}
                    notes={notes}
                    canSubmit={canSubmit && !saving}
                    showAdvancedConditions={showAdvancedConditions}
                    requirements={requirements}
                    activeRequirementsCount={activeRequirementsCount}
                    requirementObjects={requirementObjects}
                    selectedRequirementObject={selectedRequirementObject}
                    specificRequirementStatus={specificRequirementStatus}
                    selectedObjectIsInteger={selectedObjectIsInteger}
                    selectedObjectIsBoolean={selectedObjectIsBoolean}
                    readOnly={!editMode}
                    submitLabel="Save Combo"
                    onTitleChange={setTitle}
                    onDamageChange={setDamage}
                    onDriveCostChange={setDriveCost}
                    onDriveGainChange={setDriveGain}
                    onSuperCostChange={setSuperCost}
                    onSuperGainChange={setSuperGain}
                    onDescriptionChange={setDescription}
                    onNotesChange={setNotes}
                    onToggleAdvancedConditions={() => setShowAdvancedConditions((previous) => !previous)}
                    onResetDraft={() => resetDraftFromCombo(combo, leafs, connections)}
                    onRequirementToggle={handleRequirementToggle}
                    onSpecificRequirementObjectChange={(value) => {
                        setSpecificRequirementObject(value?.name ?? "");
                        setSpecificRequirementStatus("");
                    }}
                    onSpecificRequirementStatusChange={setSpecificRequirementStatus}
                />

                <Link href="/combos" style={{textDecoration: "none"}}>
                    <AppTypography variant="body2">Back to Search Combos</AppTypography>
                </Link>
            </AppBox>

            <AppDialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <AppDialogTitle>Delete Combo</AppDialogTitle>
                <AppDialogContent>
                    <AppTypography variant="body2">This removes the combo permanently.</AppTypography>
                </AppDialogContent>
                <AppDialogActions>
                    <AppButton type="button" variant="text" color="secondary" onClick={() => setDeleteDialogOpen(false)}>Cancel</AppButton>
                    <AppButton type="button" variant="contained" color="error" disabled={saving} onClick={handleDelete}>Delete</AppButton>
                </AppDialogActions>
            </AppDialog>
        </AppContainer>
    );
}
