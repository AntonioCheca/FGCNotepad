import {useEffect, useMemo, useState} from "react";
import useCombos from "@/hooks/useCombos";
import {useCharacters} from "@/hooks/useCharacters";
import useConnections from "@/hooks/useConnections";
import usePersistentState from "@/hooks/usePersistentState";
import type {
    CharacterOption,
    ComboRequirementsPayload,
    LeafSequenceOption,
    RequirementObjectOption,
    StepDraft,
    TranslateErrorToken,
    TranslateParsedToken,
    TranslateComboNotationResponse,
    EstimateComboDamageResponse,
    EstimateComboResourcesResponse,
} from "@/src/types/combo";
import {
    buildCreateFullComboPayload,
    buildRequirementsPayload,
    emptyRequirements,
    FormNotice,
    getCompletedStepsCount,
    parseNotationTokens,
    requirementToggles,
    toParsedTokens,
    toTranslatedSteps,
    updateDraftStep,
    validateSteps,
} from "@/src/components/combos/create/utils/comboForm";

interface UseComboFormControllerProps {
    onSuccess?: () => void;
}

export function useComboFormController({onSuccess}: UseComboFormControllerProps) {
    const [title, setTitle] = usePersistentState<string>("comboForm.title", "");
    const [character, setCharacter] = usePersistentState<CharacterOption | null>("comboForm.character", null, true);
    const [damage, setDamage] = usePersistentState<string>("comboForm.damage", "");
    const [driveCost, setDriveCost] = usePersistentState<string>("comboForm.driveCost", "");
    const [driveGain, setDriveGain] = usePersistentState<string>("comboForm.driveGain", "");
    const [superCost, setSuperCost] = usePersistentState<string>("comboForm.superCost", "");
    const [superGain, setSuperGain] = usePersistentState<string>("comboForm.superGain", "");
    const [description, setDescription] = usePersistentState<string>("comboForm.description", "");
    const [notes, setNotes] = usePersistentState<string>("comboForm.notes", "");
    const [notationInput, setNotationInput] = usePersistentState<string>("comboForm.notationInput", "");
    const [steps, setSteps] = usePersistentState<StepDraft[]>("comboForm.steps", [], true);
    const [requirements, setRequirements] = usePersistentState<ComboRequirementsPayload>("comboForm.requirements", emptyRequirements);
    const [specificRequirementObject, setSpecificRequirementObject] = usePersistentState<string>("comboForm.requirements.object_name", "");
    const [specificRequirementStatus, setSpecificRequirementStatus] = usePersistentState<string>("comboForm.requirements.status_required", "");
    const [translateWarnings, setTranslateWarnings] = useState<string[]>([]);
    const [translateErrors, setTranslateErrors] = useState<TranslateErrorToken[]>([]);
    const [parseTokens, setParseTokens] = useState<TranslateParsedToken[]>([]);
    const [requirementObjects, setRequirementObjects] = useState<RequirementObjectOption[]>([]);
    const [notice, setNotice] = useState<FormNotice | null>(null);
    const [parseSuccessToastOpen, setParseSuccessToastOpen] = useState(false);
    const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(null);
    const [showAdvancedConditions, setShowAdvancedConditions] = useState<boolean>(false);

    const {fetchLeafs, createFullCombo, translateComboNotation, estimateComboDamage, estimateComboResources, fetchRequirementObjects} = useCombos();
    const [leafs, setLeafs] = useState<LeafSequenceOption[]>([]);

    const {characters: characterOptions, loading: charactersLoading} = useCharacters();
    const {connections, loading: connectionsLoading, fetchConnections} = useConnections();

    useEffect(() => {
        fetchConnections();

        fetchRequirementObjects()
            .then((response) => setRequirementObjects(response ?? []))
            .catch(() => {
                setRequirementObjects([]);
                setNotice({severity: "warning", message: "Requirement metadata could not be loaded. You can still create a basic combo."});
            });
    }, [fetchConnections, fetchRequirementObjects]);

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
        setDescription("");
        setDamage("");
        setDriveCost("");
        setDriveGain("");
        setSuperCost("");
        setSuperGain("");
        setNotes("");
        setNotationInput("");
        setSteps([]);
        setRequirements(emptyRequirements);
        setSpecificRequirementObject("");
        setSpecificRequirementStatus("");
        setTranslateWarnings([]);
        setTranslateErrors([]);
        setParseTokens([]);
        setParseSuccessToastOpen(false);
        setSelectedStepIndex(null);
    };

    const handleChangeStep = (index: number, update: Partial<StepDraft>) => {
        setSteps((previousSteps) =>
            previousSteps.map((currentStep, stepIndex) => {
                if (stepIndex !== index) {
                    return currentStep;
                }

                return updateDraftStep(currentStep, update);
            }),
        );
    };

    const handleRequirementToggle = (key: (typeof requirementToggles)[number]["key"], checked: boolean) => {
        setRequirements((previousRequirements) => {
            const nextRequirements = {...previousRequirements, [key]: checked};

            if (key === "counter_hit_required" && checked) {
                nextRequirements.punish_counter_required = false;
            }

            if (key === "punish_counter_required" && checked) {
                nextRequirements.counter_hit_required = false;
            }

            return nextRequirements;
        });
    };

    const selectedRequirementObject = requirementObjects.find((option) => option.name === specificRequirementObject) ?? null;
    const selectedObjectIsBoolean = selectedRequirementObject?.status_type === "boolean";
    const selectedObjectIsInteger = selectedRequirementObject?.status_type === "integer";

    const handleFillDetails = async () => {
        const characterId = String(character?.id ?? "").trim();
        if (!characterId) {
            setNotice({severity: "error", message: "Select a character before filling details."});
            return;
        }

        if (!notationInput.trim()) {
            setNotice({severity: "error", message: "Enter notation before filling details."});
            return;
        }

        if (leafs.length === 0) {
            setNotice({severity: "error", message: "No leaf moves are loaded for the selected character."});
            return;
        }

        try {
            const translated = (await translateComboNotation({
                characterId,
                notation: notationInput,
            })) as TranslateComboNotationResponse;

            const parsedTokenList = toParsedTokens(translated, notationInput);
            const translatedSteps = toTranslatedSteps(parsedTokenList, translated, leafs, connections);

            setSteps(translatedSteps);
            setTranslateWarnings(translated.warnings ?? []);
            setTranslateErrors(translated.errors ?? []);
            setParseTokens(parsedTokenList);
            setSelectedStepIndex(translatedSteps.length > 0 ? 0 : null);

            if (!title.trim()) {
                const defaultTitle = notationInput.trim().replace(/\s+/g, " ").slice(0, 70);
                if (defaultTitle.length > 0) {
                    setTitle(defaultTitle);
                }
            }

            try {
                const estimation = (await estimateComboDamage({
                    characterId,
                    notation: notationInput,
                    options: {
                        perfectParry: false,
                        driveRushMidCombo: false,
                        driveImpactState: "none",
                        specialCancelIntoSa3: false,
                    },
                })) as EstimateComboDamageResponse;

                if (Number.isFinite(estimation.estimatedDamage)) {
                    setDamage(String(Math.trunc(estimation.estimatedDamage)));
                }
            } catch {
                setNotice({severity: "warning", message: "Notation parsed but damage estimate is currently unavailable."});
            }

            try {
                const resources = (await estimateComboResources({
                    characterId,
                    notation: notationInput,
                })) as EstimateComboResourcesResponse;

                if (Number.isFinite(resources.driveUsed)) {
                    setDriveCost(String(resources.driveUsed));
                }
                if (Number.isFinite(resources.driveGain)) {
                    setDriveGain(String(resources.driveGain));
                }
                if (Number.isFinite(resources.superUsed)) {
                    setSuperCost(String(resources.superUsed));
                }
                if (Number.isFinite(resources.superGain)) {
                    setSuperGain(String(resources.superGain));
                }
            } catch {
                setNotice({severity: "warning", message: "Notation parsed but resource estimate is currently unavailable."});
            }

            if (translatedSteps.length === 0) {
                setNotice({severity: "warning", message: "No valid steps were parsed for this character."});
                return;
            }

            if ((translated.errors ?? []).length > 0) {
                setNotice({severity: "warning", message: "Combo parsed partially. Review warnings and complete missing steps manually."});
                return;
            }

            setNotice(null);
            setParseSuccessToastOpen(true);
        } catch {
            setNotice({severity: "error", message: "Failed to translate combo notation."});
        }
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!title.trim()) {
            setNotice({severity: "error", message: "Title is required."});
            return;
        }

        const stepValidationError = validateSteps(steps);
        if (stepValidationError) {
            setNotice({severity: "error", message: stepValidationError});
            return;
        }

        const requirementsResult = buildRequirementsPayload({
            requirements,
            specificRequirementObject,
            specificRequirementStatus,
            selectedRequirementObject,
        });

        if (requirementsResult.error) {
            setNotice({severity: "error", message: requirementsResult.error});
            return;
        }

        const payload = buildCreateFullComboPayload({
            title,
            description,
            damage,
            driveCost,
            driveGain,
            superCost,
            superGain,
            requirements: requirementsResult.payload,
            steps,
        });

        try {
            await createFullCombo(payload);
            clearDraft();
            setNotice({severity: "success", message: "Combo created successfully."});
            onSuccess?.();
        } catch {
            setNotice({severity: "error", message: "Failed to create combo."});
        }
    };

    const notationTokens = parseNotationTokens(notationInput);
    const completedSteps = getCompletedStepsCount(steps);
    const hasParseResult = parseTokens.length > 0 || steps.length > 0 || translateErrors.length > 0 || translateWarnings.length > 0;
    const activeRequirements = requirementToggles.filter(({key}) => Boolean(requirements[key]));
    const canSubmit = title.trim().length > 0 && steps.length > 0 && completedSteps === steps.length;
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

    return {
        title,
        character,
        damage,
        driveCost,
        driveGain,
        superCost,
        superGain,
        description,
        notes,
        notationInput,
        steps,
        requirements,
        specificRequirementObject,
        specificRequirementStatus,
        translateWarnings,
        translateErrors,
        requirementObjects,
        notice,
        parseSuccessToastOpen,
        selectedStepIndex,
        showAdvancedConditions,
        leafs,
        characterOptions,
        charactersLoading,
        connections,
        connectionsLoading,
        selectedRequirementObject,
        selectedObjectIsBoolean,
        selectedObjectIsInteger,
        hasParseResult,
        activeRequirements,
        canSubmit,
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
        setSuperCost,
        setSuperGain,
        setDescription,
        setNotes,
        setNotationInput,
        setSpecificRequirementObject,
        setSpecificRequirementStatus,
        setParseSuccessToastOpen,
        setSelectedStepIndex,
        setShowAdvancedConditions,
        clearDraft,
        handleChangeStep,
        handleRequirementToggle,
        handleFillDetails,
        handleSubmit,
    };
}
