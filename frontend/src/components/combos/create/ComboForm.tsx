import {useEffect, useState} from "react";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppTextField} from "@/src/components/ui/AppTextField";
import {AppButton} from "@/src/components/ui/AppButton";
import {WrappedAutocomplete} from "@/src/components/ui/WrappedAutocomplete";
import useMoves from "@/hooks/useMoves";
import {useCharacters} from "@/hooks/useCharacters";
import useConnections from "@/hooks/useConnections";
import useCombos from "@/hooks/useCombos";
import {StepList} from "@/src/components/combos/create/StepList";
import usePersistentState from "@/hooks/usePersistentState"; // ✅ import here
import type {
    StepDraft,
    CreateFullComboPayload,
    ComboRequirementsPayload,
    RequirementObjectOption,
    LeafSequenceOption,
    ConnectionType,
    CharacterOption,
    TranslateComboNotationResponse,
} from "@/src/types/combo";

type RequirementToggleKey =
    | "counter_hit_required"
    | "punish_counter_required"
    | "corner_required"
    | "airborne_required"
    | "mid_screen_required"
    | "not_crouching_required";

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

interface ComboFormProps {
    onSuccess?: () => void;
}

export default function ComboForm({onSuccess}: ComboFormProps) {
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
    const [translateErrors, setTranslateErrors] = useState<string[]>([]);
    const [requirementObjects, setRequirementObjects] = useState<RequirementObjectOption[]>([]);

    const {fetchLeafs, createFullCombo, translateComboNotation, fetchRequirementObjects} = useCombos();
    const [leafs, setLeafs] = useState<LeafSequenceOption[]>([]);

    const {searchMoves} = useMoves();
    const {characters: characterOptions, loading: charactersLoading} = useCharacters();
    const {connections, loading: connectionsLoading, fetchConnections} = useConnections();

    useEffect(() => {
        console.log("[ComboForm] fetching connections...");
        fetchConnections();

        fetchRequirementObjects()
            .then((res) => setRequirementObjects(res ?? []))
            .catch((err) => {
                console.error("[ComboForm] Failed to fetch requirement objects:", err);
                setRequirementObjects([]);
            });
    }, []);

    useEffect(() => {
        const selectedCharacterId = character?.id;
        if (!selectedCharacterId) {
            setLeafs([]);
            return;
        }

        fetchLeafs(String(selectedCharacterId))
            .then((res) => {
                console.log("[ComboForm] fetchLeafs response:", res);
                setLeafs(res ?? []);
            })
            .catch((err) => {
                console.error("[ComboForm] Failed to fetch leafs:", err);
                setLeafs([]);
            });
    }, [character?.id]);

    useEffect(() => {
        console.log("[ComboForm] connections updated:", connections);
    }, [connections]);

    const filteredLeafs = leafs;

    useEffect(() => {
        if (leafs.length === 0) return; // wait for backend data
        setSteps((prev) =>
            prev.map((s) => ({
                ...s,
                move: leafs.find((l) => l.id === s.move?.id) ?? null
            }))
        );
    }, [leafs]);

    const handleAddStep = () =>
        setSteps((prev) => [...prev, {move: null, connection: null}]);

    const handleRemoveStep = (index: number) =>
        setSteps((prev) => prev.filter((_, i) => i !== index));

    const handleChangeStep = (index: number, update: Partial<StepDraft>) =>
        setSteps((prev) => prev.map((s, i) => (i === index ? {...s, ...update} : s)));

    const handleRequirementToggle = (key: RequirementToggleKey, checked: boolean) => {
        setRequirements((prev) => {
            const next = {...prev, [key]: checked};

            if (key === "counter_hit_required" && checked) {
                next.punish_counter_required = false;
            }

            if (key === "punish_counter_required" && checked) {
                next.counter_hit_required = false;
            }

            return next;
        });
    };

    const selectedRequirementObject = requirementObjects.find((option) => option.name === specificRequirementObject) ?? null;
    const selectedObjectIsBoolean = selectedRequirementObject?.status_type === "boolean";
    const selectedObjectIsInteger = selectedRequirementObject?.status_type === "integer";

    const handleFillDetails = async () => {
        const characterId = String(character?.id ?? "").trim();
        if (!characterId) {
            alert("Select a character before filling details.");
            return;
        }

        if (!notationInput.trim()) {
            alert("Enter notation before filling details.");
            return;
        }

        if (filteredLeafs.length === 0) {
            alert("No leaf moves are loaded for the selected character.");
            return;
        }

        try {
            const translated = await translateComboNotation({
                characterId,
                notation: notationInput,
            }) as TranslateComboNotationResponse;

            const leafById = new Map<string, LeafSequenceOption>(
                leafs.map((leaf) => [String(leaf.id), leaf])
            );
            const connectionById = new Map<string, ConnectionType>(
                connections.map((connection) => [String(connection.id), connection])
            );

            const translatedSteps: StepDraft[] = translated.steps
                .map((step) => ({
                    move: leafById.get(String(step.child_sequence_id)) ?? null,
                    connection: step.connection_type_id
                        ? connectionById.get(String(step.connection_type_id)) ?? null
                        : null,
                }))
                .filter((step) => step.move !== null);

            setSteps(translatedSteps);
            setTranslateWarnings(translated.warnings ?? []);
            setTranslateErrors((translated.errors ?? []).map((error) => `Token ${error.index} (${error.token}): ${error.message}`));

            if (translatedSteps.length === 0) {
                alert("Could not parse any valid move for this character.");
                return;
            }

            if ((translated.errors ?? []).length > 0) {
                alert("Combo parsed partially. Review warnings and complete missing steps manually.");
            }
        } catch (err) {
            console.error(err);
            alert("Failed to translate combo notation");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim()) {
            alert("Title is required.");
            return;
        }
        if (steps.length === 0) {
            alert("Add at least one step.");
            return;
        }
        for (let i = 0; i < steps.length; i++) {
            const s = steps[i];
            if (!s.move?.id) {
                alert(`Step ${i + 1}: select a move.`);
                return;
            }
            if (i > 0 && !s.connection?.id) {
                alert(`Step ${i + 1}: select a connection type.`);
                return;
            }
        }

        const hasBooleanRequirement = requirementToggles.some(({key}) => Boolean(requirements[key]));
        const objectName = specificRequirementObject.trim();
        const statusRequiredRaw = specificRequirementStatus.trim();
        const hasAnySpecificCharacterInput = objectName.length > 0 || statusRequiredRaw.length > 0;

        if (statusRequiredRaw.length > 0 && !objectName) {
            alert("Select a requirement object before entering a status.");
            return;
        }

        if (objectName.length > 0 && !selectedRequirementObject) {
            alert("Invalid requirement object selected.");
            return;
        }

        let specificStatusPayload: string | number | boolean | undefined;

        if (selectedObjectIsBoolean) {
            specificStatusPayload = true;
        }

        if (selectedObjectIsInteger) {
            if (!/^[0-9]+$/.test(statusRequiredRaw)) {
                alert("This requirement needs a numeric status.");
                return;
            }

            const numericStatus = parseInt(statusRequiredRaw, 10);
            const maxStatus = selectedRequirementObject?.max_status ?? null;
            if (numericStatus < 1 || (maxStatus !== null && numericStatus > maxStatus)) {
                alert(`Status must be between 1 and ${maxStatus}.`);
                return;
            }

            specificStatusPayload = numericStatus;
        }

        if (objectName.length > 0 && specificStatusPayload === undefined) {
            alert("Requirement status is invalid.");
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
            metrics: damage ? {damage: parseInt(damage, 10)} : undefined,
            requirements: requirementsPayload,
            steps: steps.map((s, idx) => ({
                child_sequence_id: (s.move as LeafSequenceOption).id,
                ordinal_in_combo: idx + 1,
                connection_type_id:
                    (s.connection as ConnectionType | null)?.id ?? null,
            })),
        };

        console.log("[ComboForm] payload:", payload);

        try {
            await createFullCombo(payload);
            alert("Combo created successfully!");
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
            onSuccess?.();
        } catch (err) {
            console.error(err);
            alert("Failed to create combo");
        }
    };

    return (
        <AppBox
            component="form"
            onSubmit={handleSubmit}
            sx={{display: "flex", flexDirection: "column", gap: 2}}
        >
            <AppTextField
                label="Combo Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
            />

            <WrappedAutocomplete<CharacterOption>
                label="Character"
                options={characterOptions ?? []}
                loading={charactersLoading}
                value={character}
                onChange={(value) => setCharacter(value)}
                getOptionLabel={(option: CharacterOption) => option?.name ?? ""}
                disableClearable={false}
            />

            <AppTextField
                label="Numpad Notation"
                value={notationInput}
                onChange={(e) => setNotationInput(e.target.value)}
                multiline
                minRows={2}
                helperText="Supported separators: comma, spaces, tabs, new lines. Supported connectors: XX, TC."
            />

            <AppButton
                type="button"
                onClick={handleFillDetails}
                disabled={!character?.id || !notationInput.trim() || filteredLeafs.length === 0}
            >
                Fill Details
            </AppButton>

            {translateWarnings.length > 0 && (
                <AppBox sx={{color: "warning.main", fontSize: 14}}>
                    {translateWarnings.map((warning, index) => (
                        <div key={`warning-${index}`}>- {warning}</div>
                    ))}
                </AppBox>
            )}

            {translateErrors.length > 0 && (
                <AppBox sx={{color: "error.main", fontSize: 14}}>
                    {translateErrors.map((error, index) => (
                        <div key={`error-${index}`}>- {error}</div>
                    ))}
                </AppBox>
            )}

            <StepList
                steps={steps}
                onAddStep={handleAddStep}
                onRemoveStep={handleRemoveStep}
                onChangeStep={handleChangeStep}
                searchMoves={searchMoves}
                connections={connections}
                connectionsLoading={connectionsLoading}
                leafs={filteredLeafs ?? []} // ✅ filtered by character
            />

            <AppTextField
                label="Damage"
                value={damage}
                onChange={(e) => setDamage(e.target.value)}
                inputMode="numeric"
            />

            <AppBox sx={{border: "1px solid", borderColor: "divider", borderRadius: 1, p: 2, display: "flex", flexDirection: "column", gap: 1}}>
                <strong>Combo Requirements (optional)</strong>
                {requirementToggles.map(({key, label}) => (
                    <label key={key} style={{display: "flex", alignItems: "center", gap: 8}}>
                        <input
                            type="checkbox"
                            checked={Boolean(requirements[key])}
                            disabled={
                                (key === "counter_hit_required" && Boolean(requirements.punish_counter_required))
                                || (key === "punish_counter_required" && Boolean(requirements.counter_hit_required))
                            }
                            onChange={(event) => handleRequirementToggle(key, event.target.checked)}
                        />
                        {label}
                    </label>
                ))}

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
                />

                {selectedObjectIsInteger && (
                    <AppTextField
                        label="Specific Status Required"
                        value={specificRequirementStatus}
                        onChange={(e) => setSpecificRequirementStatus(e.target.value)}
                        inputMode="numeric"
                        helperText={`Value between 1 and ${selectedRequirementObject?.max_status}`}
                    />
                )}

                {selectedObjectIsBoolean && (
                    <AppBox sx={{fontSize: 14, color: "text.secondary"}}>
                        This requirement is boolean and will be saved as required active state.
                    </AppBox>
                )}
            </AppBox>

            <AppTextField
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
            />
            <AppTextField
                label="Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                helperText="(Not sent to backend yet)"
            />

            <AppButton type="submit">Create Combo</AppButton>
        </AppBox>
    );
}
