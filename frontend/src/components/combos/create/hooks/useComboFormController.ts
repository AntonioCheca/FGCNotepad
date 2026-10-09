import {ResourceLedgerEntry} from "@/src/types/resourceLedger";
import {useCallback, useEffect, useMemo, useState} from "react";
import useCombos from "@/hooks/useCombos";
import {useCharacters} from "@/hooks/useCharacters";
import useConnections from "@/hooks/useConnections";
import useComboSpacings from "@/hooks/useComboSpacings";
import usePersistentState from "@/hooks/usePersistentState";
import {useProfileComboExecutionMode} from "@/hooks/useProfileComboExecutionMode";
import {modernDamageModeLabel} from "@/src/types/comboExecution";
import type {
    CharacterOption,
    ComboRequirementsPayload,
    ComboObjectStateDraft,
    LeafSequenceOption,
    RequirementObjectOption,
    StepDraft,
    TranslateErrorToken,
    TranslateParsedToken,
    EstimateComboResourcesResponse,
} from "@/src/types/combo";
import {createEmptyStep, FormNotice, parseNotationTokens, updateDraftStep, validateComboDraft, validateSteps} from "@/src/components/combos/create/utils/comboForm";
import {buildRequirementsPayload, emptyRequirements, applyRequirementToggle, requirementToggles} from "@/src/components/combos/create/utils/comboRequirementsForm";
import {buildCreateFullComboPayload} from "@/src/components/combos/create/utils/comboPayload";
import {type ComboResourceValues, fillDetailsBlocker, toResourceValues, useComboFillDetails} from "@/src/components/combos/create/hooks/useComboFillDetails";

interface UseComboFormControllerProps {
    onSuccess?: () => void;
}

export function useComboFormController({onSuccess}: UseComboFormControllerProps) {
    const [title, setTitle] = usePersistentState<string>("comboForm.title", "");
    const [character, setCharacter] = usePersistentState<CharacterOption | null>("comboForm.character", null, true);
    const [damage, setDamage] = usePersistentState<string>("comboForm.damage", "");
    const [driveCost, setDriveCost] = usePersistentState<string>("comboForm.driveCost", "");
    const [driveGain, setDriveGain] = usePersistentState<string>("comboForm.driveGain", "");
    const [minimumDriveCost, setMinimumDriveCost] = usePersistentState<string>("comboForm.minimumDriveCost", "");
    const [minimumDriveCostNoBurnout, setMinimumDriveCostNoBurnout] = usePersistentState<string>("comboForm.minimumDriveCostNoBurnout", "");
    const [superCost, setSuperCost] = usePersistentState<string>("comboForm.superCost", "");
    const [superGain, setSuperGain] = usePersistentState<string>("comboForm.superGain", "");
    const [spacingCode, setSpacingCode] = usePersistentState<string>("comboForm.spacingCode", "");
    const [notationInput, setNotationInput] = usePersistentState<string>("comboForm.notationInput", "");
    const [steps, setSteps] = usePersistentState<StepDraft[]>("comboForm.steps", [], true);
    const [requirements, setRequirements] = usePersistentState<ComboRequirementsPayload>("comboForm.requirements", emptyRequirements);
    const [specificRequirementObject, setSpecificRequirementObject] = usePersistentState<string>("comboForm.requirements.object_name", "");
    const [specificRequirementStatus, setSpecificRequirementStatus] = usePersistentState<string>("comboForm.requirements.status_required", "");
    const [objectStates, setObjectStates] = usePersistentState<ComboObjectStateDraft[]>("comboForm.requirements.object_states", [], true);
    const [translateWarnings, setTranslateWarnings] = useState<string[]>([]);
    const [translateErrors, setTranslateErrors] = useState<TranslateErrorToken[]>([]);
    const [parseTokens, setParseTokens] = useState<TranslateParsedToken[]>([]);
    const [requirementObjects, setRequirementObjects] = useState<RequirementObjectOption[]>([]);
    const [notice, setNotice] = useState<FormNotice | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [parseSuccessToastOpen, setParseSuccessToastOpen] = useState(false);
    const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(null);
    const [showAdvancedConditions, setShowAdvancedConditions] = useState<boolean>(false);

    const {mode: executionMode} = useProfileComboExecutionMode();
    const {fetchLeafs, createFullCombo, estimateComboResources, fetchRequirementObjects, previewResourceLedger} = useCombos();
    const {fillDetails, estimateDamage} = useComboFillDetails(executionMode);
    const [resourceLedger, setResourceLedger] = useState<ResourceLedgerEntry[]>([]);
    const [leafs, setLeafs] = useState<LeafSequenceOption[]>([]);

    const {characters: characterOptions, loading: charactersLoading} = useCharacters();
    const {connections, loading: connectionsLoading, fetchConnections} = useConnections();
    const {spacings: spacingOptions, loading: spacingLoading, fetchComboSpacings} = useComboSpacings();

    useEffect(() => {
        fetchConnections();
        fetchComboSpacings();

        fetchRequirementObjects()
            .then((response) => setRequirementObjects(response ?? []))
            .catch(() => {
                setRequirementObjects([]);
                setNotice({severity: "warning", message: "Requirement metadata could not be loaded. You can still create a basic combo."});
            });
    }, [fetchComboSpacings, fetchConnections, fetchRequirementObjects]);

    const characterRequirementObjects = useMemo(() => {
        const characterName = character?.name ?? "";
        if (!characterName) {
            return [];
        }

        return requirementObjects.filter((option) => option.character_name.toLowerCase() === characterName.toLowerCase());
    }, [character?.name, requirementObjects]);

    useEffect(() => {
        const selectedCharacterId = character?.id;
        if (!selectedCharacterId) {
            setLeafs([]);
            return;
        }

        fetchLeafs(String(selectedCharacterId))
            .then((response) => {
                setLeafs(response ?? []);
            })
            .catch(() => {
                setLeafs([]);
                setNotice({severity: "error", message: "Leaf moves failed to load for this character."});
            });
    }, [character?.id, fetchLeafs]);

    useEffect(() => {
        if (leafs.length === 0) {
            return;
        }

        setSteps((previousSteps) =>
            previousSteps.map((draftStep) => ({
                ...draftStep,
                move: leafs.find((leaf) => leaf.id === draftStep.move?.id) ?? null,
            })),
        );
    }, [leafs, setSteps]);

    const clearDraft = () => {
        setTitle("");
        setDamage("");
        setDriveCost("");
        setDriveGain("");
        setMinimumDriveCost("");
        setMinimumDriveCostNoBurnout("");
        setSuperCost("");
        setSuperGain("");
        setSpacingCode("");
        setNotationInput("");
        setSteps([]);
        setRequirements(emptyRequirements);
        setSpecificRequirementObject("");
        setSpecificRequirementStatus("");
        setObjectStates([]);
        setTranslateWarnings([]);
        setTranslateErrors([]);
        setParseTokens([]);
        setParseSuccessToastOpen(false);
        setSelectedStepIndex(null);
        setSubmitError(null);
    };

    const applyResourceValues = useCallback((values: ComboResourceValues) => {
        const setters = {driveCost: setDriveCost, driveGain: setDriveGain, minimumDriveCost: setMinimumDriveCost, minimumDriveCostNoBurnout: setMinimumDriveCostNoBurnout, superCost: setSuperCost, superGain: setSuperGain};
        for (const [field, value] of Object.entries(values) as Array<[keyof typeof setters, string]>) {
            setters[field](value);
        }
    }, [setDriveCost, setDriveGain, setMinimumDriveCost, setMinimumDriveCostNoBurnout, setSuperCost, setSuperGain]);

    const handleChangeStep = (index: number, update: Partial<StepDraft>) => {
        setSteps((previousSteps) =>
            previousSteps.map((currentStep, stepIndex) => {
                if (stepIndex !== index) {
                    return currentStep;
                }

                return updateDraftStep(currentStep, update);
            }),
        );

        if (Object.prototype.hasOwnProperty.call(update, "move")) {
            setParseTokens((previousTokens) => previousTokens.map((token, tokenIndex) => {
                if (tokenIndex !== index) {
                    return token;
                }

                return {
                    ...token,
                    status: update.move?.id ? "parsed" : "pending",
                    child_sequence_id: update.move?.id ?? null,
                    reason: null,
                };
            }));
        }
    };

    const handleAddStep = () => {
        setSteps((previousSteps) => [...previousSteps, createEmptyStep()]);
        setParseTokens((previousTokens) => [
            ...previousTokens,
            {
                index: previousTokens.length + 1,
                token: "Manual",
                normalizedToken: "MANUAL",
                status: "pending",
                child_sequence_id: null,
                reason: null,
            },
        ]);
        setSelectedStepIndex(steps.length);
    };

    const handleRemoveStep = (index: number) => {
        setSteps((previousSteps) => previousSteps.filter((_, stepIndex) => stepIndex !== index));
        setParseTokens((previousTokens) => previousTokens
            .filter((_, tokenIndex) => tokenIndex !== index)
            .map((token, tokenIndex) => ({...token, index: tokenIndex + 1})));
        setTranslateErrors((previousErrors) => previousErrors
            .filter((error) => error.index !== index + 1)
            .map((error) => error.index > index + 1 ? {...error, index: error.index - 1} : error));

        setSelectedStepIndex((currentIndex) => {
            const nextLength = Math.max(steps.length - 1, 0);
            if (nextLength === 0) {
                return null;
            }
            if (currentIndex === null) {
                return Math.min(index, nextLength - 1);
            }
            if (currentIndex === index) {
                return Math.min(index, nextLength - 1);
            }
            if (currentIndex > index) {
                return currentIndex - 1;
            }

            return currentIndex;
        });
    };

    const refreshDamageEstimate = async (characterId: string, perfectParry: boolean, blockedDriveImpactStun: boolean) => {
        try {
            const estimatedDamage = await estimateDamage({characterId, notation: notationInput, perfectParry, blockedDriveImpactStun});
            if (estimatedDamage !== null) {
                setDamage(estimatedDamage);
            }
        } catch {
            setNotice({severity: "warning", message: "Notation parsed but damage estimate is currently unavailable."});
        }
    };

    const handleRequirementToggle = (key: (typeof requirementToggles)[number]["key"], checked: boolean) => {
        setRequirements((previousRequirements) => applyRequirementToggle(previousRequirements, key, checked));

        const characterId = String(character?.id ?? "").trim();
        const affectsDamage = key === "perfect_parry_required" || key === "blocked_drive_impact_stun_required";
        if (affectsDamage && characterId && notationInput.trim() && steps.length > 0) {
            const next = applyRequirementToggle(requirements, key, checked);
            void refreshDamageEstimate(characterId, Boolean(next.perfect_parry_required), Boolean(next.blocked_drive_impact_stun_required));
        }
    };

    const selectedRequirementObject = requirementObjects.find((option) => option.name === specificRequirementObject) ?? null;
    const selectedObjectIsBoolean = selectedRequirementObject?.status_type === "boolean";
    const selectedObjectIsInteger = selectedRequirementObject?.status_type === "integer";

    const handleFillDetails = async () => {
        const characterId = String(character?.id ?? "").trim();
        const blocker = fillDetailsBlocker({characterId, notation: notationInput, leafs});
        if (blocker) {
            setNotice({severity: "error", message: blocker});
            return;
        }

        try {
            const result = await fillDetails({characterId, notation: notationInput, leafs, connections, requirements});
            setSteps(result.steps);
            setTranslateWarnings(result.warnings);
            setTranslateErrors(result.errors);
            setParseTokens(result.parsedTokens);
            setSelectedStepIndex(result.steps.length > 0 ? 0 : null);
            setRequirements(result.requirements);
            if (!title.trim() && result.defaultTitle) {
                setTitle(result.defaultTitle);
            }
            if (result.damage !== null) {
                setDamage(result.damage);
            }
            applyResourceValues(result.resources);
            setNotice(result.notice);
            setParseSuccessToastOpen(result.notice === null);
        } catch {
            setNotice({severity: "error", message: "Failed to translate combo notation."});
        }
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        const draftError = validateComboDraft({title, damage, steps});
        if (draftError) {
            setSubmitError(draftError);
            return;
        }

        const requirementsResult = buildRequirementsPayload({
            requirements,
            specificRequirementObject,
            specificRequirementStatus,
            selectedRequirementObject,
            objectStates,
            requirementObjects: characterRequirementObjects,
        });

        if (requirementsResult.error) {
            setSubmitError(requirementsResult.error);
            return;
        }

        const payload = buildCreateFullComboPayload({
            title,
            inputNotation: notationInput,
            damage,
            driveCost,
            driveGain,
            minimumDriveCost,
            minimumDriveCostNoBurnout,
            superCost,
            superGain,
            spacingCode,
            requirements: requirementsResult.payload,
            steps,
        });
        if (payload.metrics) {
            payload.metrics.damageExecutionMode = executionMode;
        }

        setSubmitError(null);
        setSubmitting(true);
        try {
            await createFullCombo(payload);
            clearDraft();
            setNotice({severity: "success", message: "Combo created successfully."});
            onSuccess?.();
        } catch {
            setSubmitError("Failed to create combo.");
        } finally {
            setSubmitting(false);
        }
    };

    const notationTokens = parseNotationTokens(notationInput);
    const hasParseResult = parseTokens.length > 0 || steps.length > 0 || translateErrors.length > 0 || translateWarnings.length > 0;
    const errorByIndex = useMemo(
        () => new Map<number, TranslateErrorToken>(translateErrors.map((error) => [error.index, error])),
        [translateErrors],
    );
    const leafNameById = useMemo(
        () => new Map<number, string>(leafs.map((leaf) => [leaf.id, leaf.name])),
        [leafs],
    );
    const verificationTokens = parseTokens.length > 0
        ? parseTokens
        : notationTokens.map((token, index) => ({
            index: index + 1,
            token,
            normalizedToken: token,
            status: "pending",
            child_sequence_id: null,
            reason: null,
        }));
    const tokenToStepIndex = useMemo(() => {
        const map = new Map<number, number>();
        verificationTokens.forEach((token, tokenIndex) => {
            if (tokenIndex < steps.length) {
                map.set(token.index, tokenIndex);
            }
        });
        return map;
    }, [steps.length, verificationTokens]);
    const selectedStep = selectedStepIndex !== null ? steps[selectedStepIndex] ?? null : null;

    useEffect(() => {
        const characterId = String(character?.id ?? "").trim();
        if (!characterId || validateSteps(steps) !== null) {
            setMinimumDriveCost("");
            setMinimumDriveCostNoBurnout("");
            return;
        }

        let canceled = false;
        estimateComboResources({
            characterId,
            steps: steps.map((step, index) => ({
                child_sequence_id: step.move?.id ?? 0,
                ordinal_in_combo: index + 1,
                connection_type_id: step.connection?.id ?? null,
            })),
        })
            .then((resources: EstimateComboResourcesResponse) => {
                if (!canceled) {
                    applyResourceValues(toResourceValues(resources));
                }
            })
            .catch(() => {
                if (!canceled) {
                    setMinimumDriveCost("");
                    setMinimumDriveCostNoBurnout("");
                }
            });

        return () => {
            canceled = true;
        };
    }, [applyResourceValues, character?.id, estimateComboResources, setMinimumDriveCost, setMinimumDriveCostNoBurnout, steps]);

    useEffect(() => {
        if (validateSteps(steps) !== null) {
            setResourceLedger([]);
            return;
        }

        const starts: Record<string, number> = {};
        for (const state of objectStates) {
            const required = state.status_required === "true" ? 1 : Number.parseInt(state.status_required, 10);
            if (state.object_key && Number.isFinite(required)) {
                starts[state.object_key] = required;
            }
        }

        let canceled = false;
        previewResourceLedger({leafSequenceIds: steps.map((step) => step.move?.id ?? 0), starts})
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

        return () => {
            canceled = true;
        };
    }, [objectStates, previewResourceLedger, steps]);

    return {
        resourceLedger,
        damageModeLabel: modernDamageModeLabel(executionMode),
        title,
        character,
        damage,
        driveCost,
        driveGain,
        minimumDriveCost,
        minimumDriveCostNoBurnout,
        superCost,
        superGain,
        spacingCode,
        notationInput,
        steps,
        requirements,
        specificRequirementObject,
        specificRequirementStatus,
        translateWarnings,
        translateErrors,
        requirementObjects,
        characterRequirementObjects,
        objectStates,
        notice,
        submitError,
        submitting,
        parseSuccessToastOpen,
        selectedStepIndex,
        showAdvancedConditions,
        leafs,
        characterOptions,
        charactersLoading,
        connections,
        connectionsLoading,
        spacingOptions,
        spacingLoading,
        selectedRequirementObject,
        selectedObjectIsBoolean,
        selectedObjectIsInteger,
        hasParseResult,
        errorByIndex,
        leafNameById,
        verificationTokens,
        tokenToStepIndex,
        selectedStep,
        setTitle,
        setCharacter,
        setDamage,
        setDriveCost,
        setDriveGain,
        setMinimumDriveCost,
        setMinimumDriveCostNoBurnout,
        setSuperCost,
        setSuperGain,
        setSpacingCode,
        setNotationInput,
        setSpecificRequirementObject,
        setSpecificRequirementStatus,
        setObjectStates,
        setParseSuccessToastOpen,
        setSelectedStepIndex,
        setShowAdvancedConditions,
        clearDraft,
        handleChangeStep,
        handleAddStep,
        handleRemoveStep,
        handleRequirementToggle,
        handleFillDetails,
        handleSubmit,
    };
}
