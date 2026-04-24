import {useEffect, useRef, useState} from "react";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppChip} from "@/src/components/ui/AppChip";
import {AppTextField} from "@/src/components/ui/AppTextField";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {AppCollapse} from "@/src/components/ui/AppCollapse";
import {WrappedAutocomplete} from "@/src/components/ui/WrappedAutocomplete";
import {SectionCard} from "@/src/components/ui/tactical/SectionCard";
import {InlineNotice} from "@/src/components/ui/tactical/InlineNotice";
import {ActionBar} from "@/src/components/ui/tactical/ActionBar";
import {ToggleRow} from "@/src/components/ui/tactical/ToggleRow";
import {
    CheckCircleOutlineIcon,
    ErrorOutlineIcon,
    TimelineIcon,
    WarningAmberIcon,
} from "@/src/components/ui/AppIcons";
import useCombos from "@/hooks/useCombos";
import {useCharacters} from "@/hooks/useCharacters";
import useConnections from "@/hooks/useConnections";
import usePersistentState from "@/hooks/usePersistentState";
import {isDelayConnection} from "@/src/types/combo";
import type {
    StepDraft,
    CreateFullComboPayload,
    ComboRequirementsPayload,
    RequirementObjectOption,
    LeafSequenceOption,
    ConnectionType,
    CharacterOption,
    TranslateParsedToken,
    TranslateErrorToken,
    TranslateComboNotationResponse,
} from "@/src/types/combo";

type RequirementToggleKey =
    | "counter_hit_required"
    | "punish_counter_required"
    | "corner_required"
    | "airborne_required"
    | "mid_screen_required"
    | "not_crouching_required";

type FormNotice = {
    severity: "success" | "info" | "warning" | "error";
    message: string;
};

const requirementToggles: Array<{ key: RequirementToggleKey; label: string }> = [
    {key: "counter_hit_required", label: "Counter Hit Required"},
    {key: "punish_counter_required", label: "Punish Counter Required"},
    {key: "corner_required", label: "Corner Required"},
    {key: "airborne_required", label: "Airborne Required"},
    {key: "mid_screen_required", label: "Mid Screen Required"},
    {key: "not_crouching_required", label: "Opponent Not Crouching"},
];

const emptyRequirements: ComboRequirementsPayload = {
    counter_hit_required: false,
    punish_counter_required: false,
    corner_required: false,
    airborne_required: false,
    mid_screen_required: false,
    not_crouching_required: false,
};

function getDelayLabel(step: StepDraft): string | null {
    if (!isDelayConnection(step.connection)) {
        return null;
    }

    const delayType = step.delay_type ?? "fixed";
    if (delayType === "fixed") {
        const delay = (step.delay_frames ?? "").trim();
        return delay.length > 0 ? `${delay}f` : "Delay ?";
    }

    const min = (step.delay_min_frames ?? "").trim();
    const max = (step.delay_max_frames ?? "").trim();
    const minStatus = step.delay_min_unverified ? "?" : "";
    const maxStatus = step.delay_max_unverified ? "?" : "";

    if (min.length === 0 || max.length === 0) {
        return "Window ?";
    }

    return `${min}${minStatus}-${max}${maxStatus}f`;
}

function parseNotationTokens(notationInput: string): string[] {
    return notationInput
        .split(/[\s,\t\n]+/)
        .map((token) => token.trim())
        .filter((token) => token.length > 0)
        .slice(0, 14);
}

interface ComboFormProps {
    onSuccess?: () => void;
}

export default function ComboForm({onSuccess}: ComboFormProps) {
    const createEmptyStep = (): StepDraft => ({
        move: null,
        connection: null,
        delay_type: "fixed",
        delay_frames: "",
        delay_min_frames: "",
        delay_max_frames: "",
        delay_min_unverified: false,
        delay_max_unverified: false,
    });

    const [title, setTitle] = usePersistentState<string>("comboForm.title", "");
    const [character, setCharacter] = usePersistentState<CharacterOption | null>("comboForm.character", null, true);
    const [damage, setDamage] = usePersistentState<string>("comboForm.damage", "");
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
    const [renderedNotice, setRenderedNotice] = useState<FormNotice | null>(null);
    const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(null);
    const [showOptionalDetails, setShowOptionalDetails] = useState<boolean>(false);
    const [showAdvancedConditions, setShowAdvancedConditions] = useState<boolean>(false);
    const noticeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const {fetchLeafs, createFullCombo, translateComboNotation, fetchRequirementObjects} = useCombos();
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

    useEffect(() => {
        if (notice) {
            setRenderedNotice(notice);
        }
    }, [notice]);

    useEffect(() => {
        if (noticeTimeoutRef.current) {
            clearTimeout(noticeTimeoutRef.current);
            noticeTimeoutRef.current = null;
        }

        if (notice?.message !== "Notation parsed into editable steps.") {
            return;
        }

        noticeTimeoutRef.current = setTimeout(() => {
            setNotice((currentNotice) =>
                currentNotice?.message === "Notation parsed into editable steps." ? null : currentNotice,
            );
            noticeTimeoutRef.current = null;
        }, 5500);

        return () => {
            if (noticeTimeoutRef.current) {
                clearTimeout(noticeTimeoutRef.current);
                noticeTimeoutRef.current = null;
            }
        };
    }, [notice]);

    const clearDraft = () => {
        setTitle("");
        setDescription("");
        setDamage("");
        setNotes("");
        setNotationInput("");
        setSteps([]);
        setRequirements(emptyRequirements);
        setSpecificRequirementObject("");
        setSpecificRequirementStatus("");
        setTranslateWarnings([]);
        setTranslateErrors([]);
        setParseTokens([]);
        setSelectedStepIndex(null);
    };

    const handleChangeStep = (index: number, update: Partial<StepDraft>) => {
        setSteps((previousSteps) =>
            previousSteps.map((currentStep, stepIndex) => {
                if (stepIndex !== index) {
                    return currentStep;
                }

                const nextStep: StepDraft = {
                    ...createEmptyStep(),
                    ...currentStep,
                    ...update,
                };

                if (Object.prototype.hasOwnProperty.call(update, "connection") && !isDelayConnection(nextStep.connection)) {
                    return {
                        ...nextStep,
                        delay_type: "fixed",
                        delay_frames: "",
                        delay_min_frames: "",
                        delay_max_frames: "",
                        delay_min_unverified: false,
                        delay_max_unverified: false,
                    };
                }

                if (isDelayConnection(nextStep.connection) && !nextStep.delay_type) {
                    return {
                        ...nextStep,
                        delay_type: "fixed",
                    };
                }

                return nextStep;
            }),
        );
    };

    const handleRequirementToggle = (key: RequirementToggleKey, checked: boolean) => {
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

    const filteredLeafs = leafs;

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

        if (filteredLeafs.length === 0) {
            setNotice({severity: "error", message: "No leaf moves are loaded for the selected character."});
            return;
        }

        try {
            const translated = (await translateComboNotation({
                characterId,
                notation: notationInput,
            })) as TranslateComboNotationResponse;

            const leafById = new Map<string, LeafSequenceOption>(
                leafs.map((leaf) => [String(leaf.id), leaf]),
            );
            const connectionById = new Map<string, ConnectionType>(
                connections.map((connection) => [String(connection.id), connection]),
            );

            const parsedTokenList: TranslateParsedToken[] = (translated.parsedTokens ?? []).length > 0
                ? translated.parsedTokens
                : parseNotationTokens(notationInput).map((token, index) => ({
                    index: index + 1,
                    token,
                    normalizedToken: token,
                    status: "pending",
                    child_sequence_id: null,
                    reason: null,
                }));

            let recognizedStepCursor = 0;
            const translatedSteps: StepDraft[] = parsedTokenList.map((token) => {
                if (token.child_sequence_id === null) {
                    return createEmptyStep();
                }

                const translatedStep = translated.steps[recognizedStepCursor];
                recognizedStepCursor += 1;

                return {
                    ...createEmptyStep(),
                    move: leafById.get(String(token.child_sequence_id)) ?? null,
                    connection: translatedStep?.connection_type_id
                        ? connectionById.get(String(translatedStep.connection_type_id)) ?? null
                        : null,
                };
            });

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

            if (translatedSteps.length === 0) {
                setNotice({severity: "warning", message: "No valid steps were parsed for this character."});
                return;
            }

            if ((translated.errors ?? []).length > 0) {
                setNotice({severity: "warning", message: "Combo parsed partially. Review warnings and complete missing steps manually."});
                return;
            }

            setNotice({severity: "info", message: "Notation parsed into editable steps."});
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

        if (steps.length === 0) {
            setNotice({severity: "error", message: "Add at least one step."});
            return;
        }

        for (let stepIndex = 0; stepIndex < steps.length; stepIndex += 1) {
            const currentStep = steps[stepIndex];
            if (!currentStep.move?.id) {
                setNotice({severity: "error", message: `Step ${stepIndex + 1}: select a move.`});
                return;
            }

            if (stepIndex > 0 && !currentStep.connection?.id) {
                setNotice({severity: "error", message: `Step ${stepIndex + 1}: select a connection type.`});
                return;
            }

            if (isDelayConnection(currentStep.connection)) {
                const delayType = currentStep.delay_type ?? "fixed";

                if (delayType === "fixed") {
                    const delayFrames = (currentStep.delay_frames ?? "").trim();
                    if (!/^[0-9]+$/.test(delayFrames)) {
                        setNotice({severity: "error", message: `Step ${stepIndex + 1}: delay frames must be a non-negative integer.`});
                        return;
                    }
                } else {
                    const delayMin = (currentStep.delay_min_frames ?? "").trim();
                    const delayMax = (currentStep.delay_max_frames ?? "").trim();

                    if (!/^[0-9]+$/.test(delayMin) || !/^[0-9]+$/.test(delayMax)) {
                        setNotice({severity: "error", message: `Step ${stepIndex + 1}: delay min/max must be non-negative integers.`});
                        return;
                    }

                    if (Number.parseInt(delayMin, 10) > Number.parseInt(delayMax, 10)) {
                        setNotice({severity: "error", message: `Step ${stepIndex + 1}: delay min cannot be greater than delay max.`});
                        return;
                    }
                }
            }
        }

        const hasBooleanRequirement = requirementToggles.some(({key}) => Boolean(requirements[key]));
        const objectName = specificRequirementObject.trim();
        const statusRequiredRaw = specificRequirementStatus.trim();
        const hasAnySpecificCharacterInput = objectName.length > 0 || statusRequiredRaw.length > 0;

        if (statusRequiredRaw.length > 0 && !objectName) {
            setNotice({severity: "error", message: "Select a requirement object before entering a status."});
            return;
        }

        if (objectName.length > 0 && !selectedRequirementObject) {
            setNotice({severity: "error", message: "Invalid requirement object selected."});
            return;
        }

        let specificStatusPayload: string | number | boolean | undefined;

        if (selectedObjectIsBoolean) {
            specificStatusPayload = true;
        }

        if (selectedObjectIsInteger) {
            if (!/^[0-9]+$/.test(statusRequiredRaw)) {
                setNotice({severity: "error", message: "This requirement needs a numeric status."});
                return;
            }

            const numericStatus = Number.parseInt(statusRequiredRaw, 10);
            const maxStatus = selectedRequirementObject?.max_status ?? null;

            if (numericStatus < 1 || (maxStatus !== null && numericStatus > maxStatus)) {
                setNotice({severity: "error", message: `Status must be between 1 and ${maxStatus}.`});
                return;
            }

            specificStatusPayload = numericStatus;
        }

        if (objectName.length > 0 && specificStatusPayload === undefined) {
            setNotice({severity: "error", message: "Requirement status is invalid."});
            return;
        }

        const requirementsPayload: ComboRequirementsPayload | undefined =
            hasBooleanRequirement || hasAnySpecificCharacterInput
                ? {
                    ...emptyRequirements,
                    ...requirements,
                    requirement_specific_character: objectName.length > 0
                        ? {
                            object_name: objectName,
                            status_required: specificStatusPayload as string | number | boolean,
                        }
                        : undefined,
                }
                : undefined;

        const payload: CreateFullComboPayload = {
            name: title,
            description: description || undefined,
            metrics: damage ? {damage: Number.parseInt(damage, 10)} : undefined,
            requirements: requirementsPayload,
            steps: steps.map((step, index) => {
                const baseStep = {
                    child_sequence_id: (step.move as LeafSequenceOption).id,
                    ordinal_in_combo: index + 1,
                    connection_type_id: (step.connection as ConnectionType | null)?.id ?? null,
                };

                if (!isDelayConnection(step.connection)) {
                    return baseStep;
                }

                if ((step.delay_type ?? "fixed") === "window") {
                    const delayMinUnverified = Boolean(step.delay_min_unverified);
                    const delayMaxUnverified = Boolean(step.delay_max_unverified);

                    return {
                        ...baseStep,
                        delay_min_frames: Number.parseInt((step.delay_min_frames ?? "0").trim(), 10),
                        delay_max_frames: Number.parseInt((step.delay_max_frames ?? "0").trim(), 10),
                        ...(delayMinUnverified ? {delay_min_unverified: true} : {}),
                        ...(delayMaxUnverified ? {delay_max_unverified: true} : {}),
                    };
                }

                return {
                    ...baseStep,
                    delay_frames: Number.parseInt((step.delay_frames ?? "0").trim(), 10),
                };
            }),
        };

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
    const completedSteps = steps.filter((step, index) => Boolean(step.move?.id) && (index === 0 || Boolean(step.connection?.id))).length;
    const hasParseResult = parseTokens.length > 0 || steps.length > 0 || translateErrors.length > 0 || translateWarnings.length > 0;
    const activeRequirements = requirementToggles.filter(({key}) => Boolean(requirements[key]));
    const canSubmit = title.trim().length > 0 && steps.length > 0 && completedSteps === steps.length;
    const errorByIndex = new Map<number, TranslateErrorToken>(translateErrors.map((error) => [error.index, error]));
    const leafNameById = new Map<number, string>(filteredLeafs.map((leaf) => [leaf.id, leaf.name]));
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
    const tokenToStepIndex = new Map<number, number>();
    verificationTokens.forEach((token, tokenIndex) => {
        if (tokenIndex < steps.length) {
            tokenToStepIndex.set(token.index, tokenIndex);
        }
    });
    const selectedStep = selectedStepIndex !== null ? steps[selectedStepIndex] ?? null : null;

    return (
        <AppBox component="form" onSubmit={handleSubmit} sx={{display: "grid", gap: 1.25, maxWidth: 1040}}>
            <AppCollapse
                in={Boolean(notice)}
                timeout={320}
                easing={{enter: "ease-out", exit: "ease-in"}}
                unmountOnExit
                onExited={() => setRenderedNotice(null)}
            >
                <AppBox>
                    {renderedNotice ? <InlineNotice severity={renderedNotice.severity}>{renderedNotice.message}</InlineNotice> : null}
                </AppBox>
            </AppCollapse>

            <SectionCard
                title="Rapid Combo Ingestion"
                tone="sunken"
            >
                <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", md: "260px minmax(0, 1fr) auto"}, gap: 1, alignItems: "stretch"}}>
                    <WrappedAutocomplete<CharacterOption>
                        label="Character"
                        options={characterOptions ?? []}
                        loading={charactersLoading}
                        value={character}
                        onChange={(value) => setCharacter(value)}
                        getOptionLabel={(option: CharacterOption) => option?.name ?? ""}
                        disableClearable={false}
                        sx={{
                            '& .MuiFormControl-root': {
                                margin: 0,
                            },
                            '& .MuiInputBase-root': {
                                minHeight: 40,
                            },
                        }}
                    />
                    <AppTextField
                        label="Combo Notation"
                        value={notationInput}
                        onChange={(event) => setNotationInput(event.target.value)}
                        margin="none"
                        multiline={false}
                        placeholder="2LK 2LK 2LP 236HP"
                        sx={{
                            '& .MuiInputBase-root': {
                                minHeight: 40,
                            },
                        }}
                    />
                    <AppButton
                        type="button"
                        variant="contained"
                        color="primary"
                        onClick={handleFillDetails}
                        disabled={!character?.id || !notationInput.trim() || filteredLeafs.length === 0}
                        sx={{
                            minWidth: 160,
                            minHeight: 40,
                            backgroundColor: (theme) => theme.fgc.action.ghost,
                            color: "warning.contrastText",
                            ':hover': {
                                backgroundColor: (theme) => theme.palette.warning.light,
                            },
                        }}
                    >
                        Fill Details
                    </AppButton>
                </AppBox>

            </SectionCard>

            {hasParseResult ? (
                <SectionCard
                    title="Parser Verification"
                    tone="raised"
                >
                    <AppBox sx={{display: "grid", gap: 1, gridTemplateColumns: {xs: "1fr", lg: "minmax(0, 1fr) 300px"}, alignItems: {xs: "start", lg: "center"}}}>
                        <AppBox sx={{display: "flex", gap: 0.5, flexWrap: "wrap", alignItems: "center"}}>
                            {verificationTokens.map((token, index) => {
                                const tokenError = errorByIndex.get(token.index);
                                const recognized = token.child_sequence_id !== null;
                                const mappedStepIndex = tokenToStepIndex.get(token.index);
                                const matchingStep = mappedStepIndex !== undefined ? steps[mappedStepIndex] : null;
                                const delayLabel = matchingStep ? getDelayLabel(matchingStep) : null;
                                const isSelected = mappedStepIndex !== undefined && mappedStepIndex === selectedStepIndex;

                                return (
                                    <AppBox key={`${token.token}-${token.index}-${index}`} sx={{display: "inline-flex", gap: 0.5, alignItems: "center"}}>
                                        <AppBox
                                            onClick={() => {
                                                if (mappedStepIndex !== undefined) {
                                                    setSelectedStepIndex(mappedStepIndex);
                                                }
                                            }}
                                            sx={{
                                                display: "grid",
                                                gap: 0.2,
                                                py: 0.45,
                                                px: 0.65,
                                                borderRadius: 1,
                                                border: "1px solid",
                                                borderColor: isSelected
                                                    ? "fgc.selection.active"
                                                    : tokenError
                                                        ? "error.main"
                                                        : recognized
                                                            ? "fgc.border.subtle"
                                                            : "warning.main",
                                                backgroundColor: (theme) => {
                                                    if (isSelected) {
                                                        return theme.fgc.surface.selected;
                                                    }

                                                    if (tokenError) {
                                                        return theme.fgc.surface.sunken;
                                                    }

                                                    return recognized ? theme.fgc.surface.interactive : theme.fgc.surface.subtle;
                                                },
                                                minWidth: 96,
                                                cursor: mappedStepIndex !== undefined ? "pointer" : "default",
                                            }}
                                        >
                                            <AppTypography variant="caption" sx={{fontWeight: 700}}>
                                                {token.token}
                                            </AppTypography>
                                            <AppTypography variant="caption" color={recognized ? "text.secondary" : "warning.main"}>
                                                {recognized
                                                    ? (leafNameById.get(token.child_sequence_id as number) ?? "Recognized")
                                                    : `? (${tokenError?.token ?? token.token})`}
                                            </AppTypography>
                                            {matchingStep?.connection?.name ? (
                                                <AppTypography variant="caption" color="text.secondary">
                                                    {matchingStep.connection.name}{delayLabel ? ` • ${delayLabel}` : ""}
                                                </AppTypography>
                                            ) : null}
                                        </AppBox>
                                        {index < verificationTokens.length - 1 ? <TimelineIcon fontSize="inherit" /> : null}
                                    </AppBox>
                                );
                            })}
                        </AppBox>

                        <AppBox
                            sx={{
                                display: "grid",
                                gap: 0.75,
                                p: 0.9,
                                borderRadius: 1,
                                border: "1px solid",
                                borderColor: "fgc.border.subtle",
                                backgroundColor: (theme) => theme.fgc.surface.interactive,
                            }}
                        >
                            <AppTypography variant="subtitle2" sx={{fontWeight: 650}}>
                                {selectedStep ? `Edit Parsed Step ${selectedStepIndex! + 1}` : "Step Editor"}
                            </AppTypography>

                            {selectedStep ? (
                                <>
                                    <WrappedAutocomplete<LeafSequenceOption>
                                        label="Move"
                                        options={filteredLeafs}
                                        value={selectedStep.move}
                                        onChange={(value) => handleChangeStep(selectedStepIndex as number, {move: value})}
                                        getOptionLabel={(option) => option?.name ?? ""}
                                        disableClearable={false}
                                    />
                                    <WrappedAutocomplete<ConnectionType>
                                        label="Connection"
                                        options={connections}
                                        value={selectedStep.connection}
                                        onChange={(value) => handleChangeStep(selectedStepIndex as number, {connection: value})}
                                        getOptionLabel={(option) => option?.name ?? ""}
                                        loading={connectionsLoading}
                                        disableClearable={false}
                                    />

                                    {isDelayConnection(selectedStep.connection) ? (
                                        <>
                                            <AppBox sx={{display: "flex", gap: 0.5}}>
                                                <AppButton
                                                    type="button"
                                                    size="small"
                                                    variant={(selectedStep.delay_type ?? "fixed") === "fixed" ? "contained" : "outlined"}
                                                    onClick={() => handleChangeStep(selectedStepIndex as number, {delay_type: "fixed"})}
                                                >
                                                    Fixed
                                                </AppButton>
                                                <AppButton
                                                    type="button"
                                                    size="small"
                                                    variant={(selectedStep.delay_type ?? "fixed") === "window" ? "contained" : "outlined"}
                                                    onClick={() => handleChangeStep(selectedStepIndex as number, {delay_type: "window"})}
                                                >
                                                    Window
                                                </AppButton>
                                            </AppBox>

                                            {(selectedStep.delay_type ?? "fixed") === "fixed" ? (
                                                <AppTextField
                                                    label="Delay Frames"
                                                    value={selectedStep.delay_frames ?? ""}
                                                    onChange={(event) => handleChangeStep(selectedStepIndex as number, {delay_frames: event.target.value})}
                                                    inputMode="numeric"
                                                />
                                            ) : (
                                                <AppBox sx={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0.75}}>
                                                    <AppTextField
                                                        label="Delay Min"
                                                        value={selectedStep.delay_min_frames ?? ""}
                                                        onChange={(event) => handleChangeStep(selectedStepIndex as number, {delay_min_frames: event.target.value})}
                                                        inputMode="numeric"
                                                    />
                                                    <AppTextField
                                                        label="Delay Max"
                                                        value={selectedStep.delay_max_frames ?? ""}
                                                        onChange={(event) => handleChangeStep(selectedStepIndex as number, {delay_max_frames: event.target.value})}
                                                        inputMode="numeric"
                                                    />
                                                </AppBox>
                                            )}
                                        </>
                                    ) : null}
                                </>
                            ) : (
                                <AppTypography variant="body2" color="text.secondary">
                                    Select a token to edit move and connection details.
                                </AppTypography>
                            )}
                        </AppBox>
                    </AppBox>

                    {translateWarnings.length > 0 ? (
                        <InlineNotice severity="warning">
                            <AppBox sx={{display: "grid", gap: 0.35}}>
                                {translateWarnings.map((warning, index) => (
                                    <AppTypography key={`warning-${index}`} variant="body2" sx={{display: "flex", gap: 0.5, alignItems: "center"}}>
                                        <WarningAmberIcon fontSize="inherit" />
                                        {warning}
                                    </AppTypography>
                                ))}
                            </AppBox>
                        </InlineNotice>
                    ) : null}

                    {translateErrors.length > 0 ? (
                        <InlineNotice severity="error">
                            <AppBox sx={{display: "grid", gap: 0.35}}>
                                {translateErrors.map((error) => (
                                    <AppTypography key={`${error.index}-${error.token}`} variant="body2" sx={{display: "flex", gap: 0.5, alignItems: "center"}}>
                                        <ErrorOutlineIcon fontSize="inherit" />
                                        Token {error.index} ({error.token}): {error.message}
                                    </AppTypography>
                                ))}
                            </AppBox>
                        </InlineNotice>
                    ) : null}
                </SectionCard>
            ) : null}

            <SectionCard
                title="Submit"
                tone="sunken"
            >
                <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", md: "minmax(0, 1fr) auto"}, gap: 1, alignItems: {xs: "start", md: "center"}}}>
                    <AppTextField
                        label="Combo Title"
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        required
                        helperText="Auto-filled from notation when possible."
                    />
                    <AppButton type="submit" variant="contained" color="primary" disabled={!canSubmit} sx={{minWidth: 180, minHeight: 40, alignSelf: {md: "center"}}}>
                        Create Combo
                    </AppButton>
                </AppBox>

                <ActionBar>
                    <AppButton type="button" variant="outlined" onClick={() => setShowOptionalDetails((prev) => !prev)}>
                        {showOptionalDetails ? "Hide Optional Details" : "Optional Details"}
                    </AppButton>
                    <AppButton type="button" variant="outlined" onClick={() => setShowAdvancedConditions((prev) => !prev)}>
                        {showAdvancedConditions ? "Hide Advanced Conditions" : "Advanced Conditions"}
                    </AppButton>
                    <AppButton type="button" variant="outlined" color="secondary" onClick={clearDraft}>
                        Reset Draft
                    </AppButton>
                </ActionBar>

                {showOptionalDetails ? (
                    <AppBox sx={{display: "grid", gap: 1, pt: 0.5}}>
                        <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", md: "120px 1fr"}, gap: 1}}>
                            <AppTextField
                                label="Damage"
                                value={damage}
                                onChange={(event) => setDamage(event.target.value)}
                                inputMode="numeric"
                            />
                            <AppTextField
                                label="Description"
                                value={description}
                                onChange={(event) => setDescription(event.target.value)}
                            />
                        </AppBox>
                        <AppTextField
                            label="Notes"
                            value={notes}
                            onChange={(event) => setNotes(event.target.value)}
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
                                    onChange={(checked) => handleRequirementToggle(key, checked)}
                                />
                            ))}
                        </AppBox>
                        <AppBox sx={{display: "flex", gap: 0.5, flexWrap: "wrap"}}>
                            <AppChip size="small" variant="outlined" label={`${activeRequirements.length} active conditions`} />
                        </AppBox>
                        <WrappedAutocomplete<RequirementObjectOption>
                            label="Specific Requirement Object"
                            options={requirementObjects}
                            value={selectedRequirementObject}
                            onChange={(value) => {
                                setSpecificRequirementObject(value?.name ?? "");
                                setSpecificRequirementStatus("");
                            }}
                            getOptionLabel={(option) => option?.name ?? ""}
                            disableClearable={false}
                            sx={{maxWidth: {md: 460}}}
                        />

                        {selectedObjectIsInteger ? (
                            <AppTextField
                                label="Specific Status Required"
                                value={specificRequirementStatus}
                                onChange={(event) => setSpecificRequirementStatus(event.target.value)}
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
        </AppBox>
    );
}
