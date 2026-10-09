import React from "react";
import Link from "next/link";
import {useRouter} from "next/router";

import useCombos from "@/hooks/useCombos";
import useConnections from "@/hooks/useConnections";
import useComboSpacings from "@/hooks/useComboSpacings";
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
import {InlineNotice} from "@/src/components/ui/tactical/InlineNotice";
import {modernDamageModeLabel} from "@/src/types/comboExecution";
import {ResourceLedgerEntry} from "@/src/types/resourceLedger";
import {ComboReadOnlySummary} from "@/src/components/combos/ComboReadOnlySummary";
import {fillDetailsBlocker, useComboFillDetails} from "@/src/components/combos/create/hooks/useComboFillDetails";
import {ComboSetupSection} from "@/src/components/combos/create/sections/ComboSetupSection";
import {ParserVerificationSection} from "@/src/components/combos/create/sections/ParserVerificationSection";
import {SubmitSection} from "@/src/components/combos/create/sections/SubmitSection";
import {ContentFlagButton} from "@/src/components/flags/ContentFlagButton";
import {createEmptyStep, type FormNotice, updateDraftStep, validateComboDraft} from "@/src/components/combos/create/utils/comboForm";
import {applyRequirementToggle, buildRequirementsPayload, emptyRequirements, type RequirementToggleKey} from "@/src/components/combos/create/utils/comboRequirementsForm";
import {buildCreateFullComboPayload} from "@/src/components/combos/create/utils/comboPayload";
import type {
    ComboDetailApi,
    ComboDetailView,
    ComboObjectStateDraft,
    ComboRequirementsPayload,
    ComboStep,
    ConnectionType,
    LeafSequenceOption,
    RequirementObjectOption,
    StepDraft,
    TranslateErrorToken,
    TranslateParsedToken,
} from "@/src/types/combo";
import {mapComboToDetailView} from "@/src/types/combo";

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
        perfect_parry_required: source?.perfect_parry_required ?? false,
        blocked_drive_impact_stun_required: source?.blocked_drive_impact_stun_required ?? false,
        corner_required: source?.corner_required ?? false,
        airborne_required: source?.airborne_required ?? false,
        not_crouching_required: source?.not_crouching_required ?? false,
        side_switches_required: source?.side_switches_required ?? false,
    };

    const objectStates = source?.combo_object_states ?? (source?.requirement_specific_character ? [source.requirement_specific_character] : []);
    if (objectStates.length > 0) {
        requirements.combo_object_states = objectStates;
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

function getObjectStates(combo: ComboDetailView | null): ComboObjectStateDraft[] {
    const objectStates = combo?.requirements?.combo_object_states ?? (combo?.requirements?.requirement_specific_character ? [combo.requirements.requirement_specific_character] : []);

    return objectStates
        .filter((objectState) => typeof objectState.object_key === "string" && objectState.object_key.length > 0)
        .map((objectState) => ({
            object_key: String(objectState.object_key),
            status_required: objectState.status_required === undefined || objectState.status_required === null ? "" : String(objectState.status_required),
            consumed: objectState.consumed === true,
            added_relative: objectState.added_relative === undefined || objectState.added_relative === null ? "" : String(objectState.added_relative),
            added_absolute: objectState.added_absolute === undefined || objectState.added_absolute === null ? "" : String(objectState.added_absolute),
        }));
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

    const {getCombo, updateCombo, deleteCombo, fetchLeafs, fetchRequirementObjects, getResourceLedger} = useCombos();
    const [resourceLedger, setResourceLedger] = React.useState<ResourceLedgerEntry[]>([]);
    const {connections, loading: connectionsLoading, fetchConnections} = useConnections();
    const {spacings: spacingOptions, loading: spacingLoading, fetchComboSpacings} = useComboSpacings();

    const [combo, setCombo] = React.useState<ComboDetailView | null>(null);
    const [leafs, setLeafs] = React.useState<LeafSequenceOption[]>([]);
    const [requirementObjects, setRequirementObjects] = React.useState<RequirementObjectOption[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [editMode, setEditMode] = React.useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
    const [saving, setSaving] = React.useState(false);
    const [toast, setToast] = React.useState<{severity: "success" | "error"; message: string} | null>(null);
    const [notice, setNotice] = React.useState<FormNotice | null>(null);
    const [submitError, setSubmitError] = React.useState<string | null>(null);
    const [shownInClassic, setShownInClassic] = React.useState(false);

    const [title, setTitle] = React.useState("");
    const [damage, setDamage] = React.useState("");
    const [driveCost, setDriveCost] = React.useState("");
    const [driveGain, setDriveGain] = React.useState("");
    const [superCost, setSuperCost] = React.useState("");
    const [superGain, setSuperGain] = React.useState("");
    const [notationInput, setNotationInput] = React.useState("");
    const [parseTokens, setParseTokens] = React.useState<TranslateParsedToken[]>([]);
    const [translateWarnings, setTranslateWarnings] = React.useState<string[]>([]);
    const [translateErrors, setTranslateErrors] = React.useState<TranslateErrorToken[]>([]);
    const [fillingDetails, setFillingDetails] = React.useState(false);
    // True once the editor changes something Fill Details would overwrite, so re-filling asks first.
    const derivedValuesEdited = React.useRef(false);
    const [confirmFillOpen, setConfirmFillOpen] = React.useState(false);
    const [spacingCode, setSpacingCode] = React.useState("");
    const [showAdvancedConditions, setShowAdvancedConditions] = React.useState(true);
    const [requirements, setRequirements] = React.useState<ComboRequirementsPayload>(emptyRequirements);
    const [objectStates, setObjectStates] = React.useState<ComboObjectStateDraft[]>([]);
    const [steps, setSteps] = React.useState<StepDraft[]>([]);
    const [selectedStepIndex, setSelectedStepIndex] = React.useState<number | null>(0);

    const getComboInExecutableMode = React.useCallback(async (id: string): Promise<ComboDetailApi> => {
        const response = await getCombo(id) as ComboDetailApi;
        if (response.executionMode === undefined || response.executionMode === "classic" || response.modernLegal) {
            return response;
        }

        setShownInClassic(true);
        return await getCombo(id, {executionMode: "classic"}) as ComboDetailApi;
    }, [getCombo]);

    const resetDraftFromCombo = React.useCallback((nextCombo: ComboDetailView, nextLeafs: LeafSequenceOption[], nextConnections: ConnectionType[]) => {
        setTitle(nextCombo.title === "-" ? "" : nextCombo.title);
        setDamage(formatField(nextCombo.damage));
        setDriveCost(formatField(nextCombo.driveCost === "-" ? "" : nextCombo.driveCost));
        setDriveGain(formatField(nextCombo.driveGain === "-" ? "" : nextCombo.driveGain));
        setSuperCost(formatField(nextCombo.superCost === "-" ? "" : nextCombo.superCost));
        setSuperGain(formatField(nextCombo.superGain === "-" ? "" : nextCombo.superGain));
        setNotationInput(nextCombo.inputNotation);
        setParseTokens([]);
        setTranslateWarnings([]);
        setTranslateErrors([]);
        derivedValuesEdited.current = false;
        setNotice(null);
        setSubmitError(null);
        setSpacingCode(nextCombo.spacing?.code ?? "");
        setRequirements(getInitialRequirements(nextCombo));
        setObjectStates(getObjectStates(nextCombo));
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

        getResourceLedger(comboId)
            .then((ledger: ResourceLedgerEntry[]) => {
                if (!canceled) {
                    setResourceLedger(ledger);
                }
            })
            .catch(() => {
                if (!canceled) {
                    setResourceLedger([]);
                }
            });

        Promise.all([getComboInExecutableMode(comboId), fetchConnections(), fetchRequirementObjects(), fetchComboSpacings()])
            .then(async ([comboResponse, connectionResponse, requirementResponse]: [ComboDetailApi, ConnectionType[], RequirementObjectOption[], unknown]) => {
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
    }, [comboId, fetchComboSpacings, fetchConnections, fetchLeafs, fetchRequirementObjects, getComboInExecutableMode, getResourceLedger, resetDraftFromCombo]);

    // The legacy single-object fields are never edited here; they always mirror the loaded combo.
    const specificRequirementObject = getSpecificRequirementObjectName(combo);
    const specificRequirementStatus = getSpecificRequirementStatus(combo);
    const selectedRequirementObject = requirementObjects.find((option) => option.name === specificRequirementObject) ?? null;
    const characterRequirementObjects = React.useMemo(
        () => requirementObjects.filter((option) => option.character_name.toLowerCase() === combo?.characterName.toLowerCase()),
        [combo?.characterName, requirementObjects],
    );
    const {fillDetails, estimateDamage} = useComboFillDetails(combo?.executionMode ?? "classic");
    const selectedStep = selectedStepIndex !== null ? steps[selectedStepIndex] ?? null : null;
    const hasFreshParse = parseTokens.length > 0 && parseTokens.length === steps.length;
    const verificationTokens = React.useMemo(() => hasFreshParse ? parseTokens : buildTokens(steps), [hasFreshParse, parseTokens, steps]);
    const tokenToStepIndex = React.useMemo(() => new Map(verificationTokens.map((token, index) => [token.index, index])), [verificationTokens]);
    const errorByIndex = React.useMemo(() => new Map<number, TranslateErrorToken>(hasFreshParse ? translateErrors.map((tokenError) => [tokenError.index, tokenError]) : []), [hasFreshParse, translateErrors]);
    const leafNameById = React.useMemo(() => new Map(leafs.map((leaf) => [leaf.id, leaf.name])), [leafs]);

    const editDerivedValue = (setter: (value: string) => void) => (value: string) => {
        setter(value);
        derivedValuesEdited.current = true;
    };

    const handleChangeStep = (index: number, update: Partial<StepDraft>) => {
        setSteps((previousSteps) => previousSteps.map((currentStep, stepIndex) => stepIndex === index ? updateDraftStep(currentStep, update) : currentStep));
        if (Object.prototype.hasOwnProperty.call(update, "move")) {
            setParseTokens((previousTokens) => previousTokens.map((token, tokenIndex) => tokenIndex === index
                ? {...token, status: update.move?.id ? "parsed" : "pending", child_sequence_id: update.move?.id ?? null, reason: null}
                : token));
        }
        derivedValuesEdited.current = true;
    };

    const handleAddStep = () => {
        setSteps((previousSteps) => [...previousSteps, createEmptyStep()]);
        setParseTokens([]);
        setSelectedStepIndex(steps.length);
        derivedValuesEdited.current = true;
    };

    const handleRemoveStep = (index: number) => {
        setSteps((previousSteps) => previousSteps.filter((_, stepIndex) => stepIndex !== index));
        setParseTokens([]);
        setSelectedStepIndex((current) => current === null ? null : Math.max(0, Math.min(current, steps.length - 2)));
        derivedValuesEdited.current = true;
    };

    const handleRequirementToggle = (key: RequirementToggleKey, checked: boolean) => {
        const next = applyRequirementToggle(requirements, key, checked);
        setRequirements(next);
        derivedValuesEdited.current = true;

        const characterId = combo?.characterId ?? "";
        const affectsDamage = key === "perfect_parry_required" || key === "blocked_drive_impact_stun_required";
        if (affectsDamage && characterId && notationInput.trim() && steps.length > 0) {
            estimateDamage({characterId, notation: notationInput, perfectParry: Boolean(next.perfect_parry_required), blockedDriveImpactStun: Boolean(next.blocked_drive_impact_stun_required)})
                .then((estimatedDamage) => {
                    if (estimatedDamage !== null) {
                        setDamage(estimatedDamage);
                    }
                })
                .catch(() => setNotice({severity: "warning", message: "Damage estimate is currently unavailable."}));
        }
    };

    const runFillDetails = async () => {
        setConfirmFillOpen(false);
        const characterId = combo?.characterId ?? "";
        const blocker = fillDetailsBlocker({characterId, notation: notationInput, leafs});
        if (blocker) {
            setNotice({severity: "error", message: blocker});
            return;
        }

        setFillingDetails(true);
        try {
            const result = await fillDetails({characterId, notation: notationInput, leafs, connections, requirements});
            setSteps(result.steps);
            setParseTokens(result.parsedTokens);
            setTranslateWarnings(result.warnings);
            setTranslateErrors(result.errors);
            setSelectedStepIndex(result.steps.length > 0 ? 0 : null);
            setRequirements(result.requirements);
            if (!title.trim() && result.defaultTitle) {
                setTitle(result.defaultTitle);
            }
            if (result.damage !== null) {
                setDamage(result.damage);
            }
            const resourceSetters = {driveCost: setDriveCost, driveGain: setDriveGain, superCost: setSuperCost, superGain: setSuperGain};
            for (const field of Object.keys(resourceSetters) as Array<keyof typeof resourceSetters>) {
                const value = result.resources[field];
                if (value !== undefined) {
                    resourceSetters[field](value);
                }
            }
            derivedValuesEdited.current = false;
            setNotice(result.notice);
        } catch {
            setNotice({severity: "error", message: "Failed to translate combo notation."});
        } finally {
            setFillingDetails(false);
        }
    };

    const handleFillDetails = () => {
        if (derivedValuesEdited.current) {
            setConfirmFillOpen(true);
            return;
        }

        void runFillDetails();
    };

    const handleSave = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!comboId) {
            return;
        }

        const draftError = validateComboDraft({title, damage, steps});
        if (draftError) {
            setSubmitError(draftError);
            return;
        }

        const requirementsResult = buildRequirementsPayload({requirements, specificRequirementObject, specificRequirementStatus, selectedRequirementObject, objectStates, requirementObjects: characterRequirementObjects});
        if (requirementsResult.error) {
            setSubmitError(requirementsResult.error);
            return;
        }

        setSubmitError(null);
        setSaving(true);
        try {
            const payload = buildCreateFullComboPayload({
                title,
                inputNotation: notationInput,
                damage,
                driveCost,
                driveGain,
                superCost,
                superGain,
                spacingCode,
                requirements: requirementsResult.payload ?? emptyRequirements,
                steps,
            });
            if (payload.metrics && combo) {
                payload.metrics.damageExecutionMode = combo.executionMode;
            }
            const response = await updateCombo(comboId, payload, {executionMode: combo?.executionMode}) as ComboDetailApi;
            const nextCombo = mapComboToDetailView(response);
            setCombo(nextCombo);
            resetDraftFromCombo(nextCombo, leafs, connections);
            setEditMode(false);
            setToast({severity: "success", message: "Combo updated."});
        } catch {
            setSubmitError("Unable to update combo.");
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

    const stepsSection = (
        <ParserVerificationSection
            hasParseResult={steps.length > 0}
            verificationTokens={verificationTokens}
            errorByIndex={errorByIndex}
            tokenToStepIndex={tokenToStepIndex}
            selectedStepIndex={selectedStepIndex}
            steps={steps}
            selectedStep={selectedStep}
            leafNameById={leafNameById}
            leafs={leafs}
            connections={connections}
            connectionsLoading={connectionsLoading}
            translateWarnings={editMode ? translateWarnings : []}
            translateErrors={editMode ? translateErrors : []}
            resourceLedger={editMode ? [] : resourceLedger}
            readOnly={!editMode}
            onSelectStep={setSelectedStepIndex}
            onChangeStep={handleChangeStep}
            onAddStep={handleAddStep}
            onRemoveStep={handleRemoveStep}
        />
    );

    return (
        <AppContainer maxWidth={false}>
            <AppSnackbar open={toast !== null} autoHideDuration={3600} onClose={() => setToast(null)} anchorOrigin={{vertical: "top", horizontal: "center"}}>
                <AppAlert severity={toast?.severity ?? "success"} variant="filled" onClose={() => setToast(null)}>{toast?.message}</AppAlert>
            </AppSnackbar>

            <AppBox component="form" onSubmit={handleSave} sx={{display: "grid", gap: {xs: 1, md: 1.75}, width: "100%", maxWidth: 1160, mx: "auto"}}>
                <AppBox sx={{display: "grid", gap: {xs: 0.8, md: 1.2}, gridTemplateColumns: {xs: "1fr", md: "minmax(0, 1fr) auto"}, alignItems: "start", minWidth: 0}}>
                    <AppTypography variant="h2" sx={{fontWeight: 800, letterSpacing: "-0.035em", lineHeight: 0.95, fontSize: {xs: "clamp(2rem, 12vw, 3.2rem)", md: undefined}, overflowWrap: "anywhere"}}>
                        {combo.characterName}
                    </AppTypography>
                    <AppBox sx={{display: "flex", gap: {xs: 0.65, md: 1}, justifyContent: {xs: "stretch", md: "flex-end"}, flexWrap: "wrap", "& .MuiButton-root": {flex: {xs: "1 1 calc(50% - 6px)", md: "0 0 auto"}}}}>
                        {numericComboId !== null && Number.isFinite(numericComboId) ? <ContentFlagButton targetType="combo" targetId={numericComboId}/> : null}
                        {canModerate && !editMode ? <AppButton type="button" variant="outlined" color="secondary" onClick={() => setEditMode(true)}>Edit</AppButton> : null}
                        {canModerate && editMode ? <AppButton type="button" variant="outlined" color="secondary" onClick={() => { resetDraftFromCombo(combo, leafs, connections); setEditMode(false); }}>Cancel</AppButton> : null}
                        {canModerate && editMode ? <AppButton type="submit" variant="contained" color="primary" disabled={saving}>Save</AppButton> : null}
                        {canModerate ? <AppButton type="button" variant="outlined" color="error" disabled={saving} onClick={() => setDeleteDialogOpen(true)}>Delete</AppButton> : null}
                    </AppBox>
                </AppBox>

                {shownInClassic ? <InlineNotice severity="info">Not possible with Modern controls. Shown with Classic notation and damage.</InlineNotice> : null}

                {editMode ? (
                    <>
                        {notice ? <InlineNotice severity={notice.severity}>{notice.message}</InlineNotice> : null}
                        <ComboSetupSection
                            notationInput={notationInput}
                            canFillDetails={Boolean(notationInput.trim()) && leafs.length > 0}
                            fillingDetails={fillingDetails}
                            onNotationChange={setNotationInput}
                            onFillDetails={handleFillDetails}
                        />
                        {stepsSection}
                        <SubmitSection
                            sectionTitle="Combo Details"
                            submitLabel={null}
                            title={title}
                            damage={damage}
                            damageModeLabel={modernDamageModeLabel(combo.executionMode)}
                            driveCost={driveCost}
                            driveGain={driveGain}
                            superCost={superCost}
                            superGain={superGain}
                            spacingCode={spacingCode}
                            spacingOptions={spacingOptions}
                            spacingLoading={spacingLoading}
                            showAdvancedConditions={showAdvancedConditions}
                            requirements={requirements}
                            requirementObjects={characterRequirementObjects}
                            objectStates={objectStates}
                            submitError={submitError}
                            submitting={saving}
                            onTitleChange={setTitle}
                            onDamageChange={editDerivedValue(setDamage)}
                            onDriveCostChange={editDerivedValue(setDriveCost)}
                            onDriveGainChange={editDerivedValue(setDriveGain)}
                            onSuperCostChange={editDerivedValue(setSuperCost)}
                            onSuperGainChange={editDerivedValue(setSuperGain)}
                            onSpacingChange={setSpacingCode}
                            onToggleAdvancedConditions={() => setShowAdvancedConditions((previous) => !previous)}
                            onResetDraft={() => resetDraftFromCombo(combo, leafs, connections)}
                            onRequirementToggle={handleRequirementToggle}
                            onObjectStatesChange={setObjectStates}
                        />
                    </>
                ) : (
                    <>
                        <ComboReadOnlySummary combo={combo} />
                        {stepsSection}
                    </>
                )}
            </AppBox>

            <AppDialog open={confirmFillOpen} onClose={() => setConfirmFillOpen(false)}>
                <AppDialogTitle>Replace your changes?</AppDialogTitle>
                <AppDialogContent>
                    <AppTypography variant="body2">Fill Details recalculates the steps, damage, resources and starter conditions from the notation, replacing the changes you made to them.</AppTypography>
                </AppDialogContent>
                <AppDialogActions>
                    <AppButton type="button" variant="text" color="secondary" onClick={() => setConfirmFillOpen(false)}>Keep my changes</AppButton>
                    <AppButton type="button" variant="contained" color="primary" onClick={() => void runFillDetails()}>Replace</AppButton>
                </AppDialogActions>
            </AppDialog>

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
