import {useEffect, useState} from "react";
import {Box, TextField} from "@mui/material";
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
    LeafSequenceOption,
    ConnectionType,
    CharacterOption,
    TranslateComboNotationResponse,
} from "@/src/types/combo";

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
    const [translateWarnings, setTranslateWarnings] = useState<string[]>([]);
    const [translateErrors, setTranslateErrors] = useState<string[]>([]);

    const {fetchLeafs, createFullCombo, translateComboNotation} = useCombos();
    const [leafs, setLeafs] = useState<LeafSequenceOption[]>([]);

    const {searchMoves} = useMoves();
    const {characters: characterOptions, loading: charactersLoading} = useCharacters();
    const {connections, loading: connectionsLoading, fetchConnections} = useConnections();

    useEffect(() => {
        console.log("[ComboForm] fetching connections + leafs...");
        fetchConnections();

        fetchLeafs()
            .then((res) => {
                console.log("[ComboForm] fetchLeafs response:", res);
                setLeafs(res ?? []);
            })
            .catch((err) => {
                console.error("[ComboForm] Failed to fetch leafs:", err);
                setLeafs([]);
            });
    }, []);

    useEffect(() => {
        console.log("[ComboForm] connections updated:", connections);
    }, [connections]);

    // Filter moves by selected character
    const filteredLeafs = character
        ? leafs.filter((l) => l.character?.id === character.id)
        : leafs;

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

        const payload: CreateFullComboPayload = {
            name: title,
            description: description || undefined,
            metrics: damage ? {damage: parseInt(damage, 10)} : undefined,
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
            setTranslateWarnings([]);
            setTranslateErrors([]);
            onSuccess?.();
        } catch (err) {
            console.error(err);
            alert("Failed to create combo");
        }
    };

    return (
        <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{display: "flex", flexDirection: "column", gap: 2}}
        >
            <TextField
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

            <TextField
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
                <Box sx={{color: "warning.main", fontSize: 14}}>
                    {translateWarnings.map((warning, index) => (
                        <div key={`warning-${index}`}>- {warning}</div>
                    ))}
                </Box>
            )}

            {translateErrors.length > 0 && (
                <Box sx={{color: "error.main", fontSize: 14}}>
                    {translateErrors.map((error, index) => (
                        <div key={`error-${index}`}>- {error}</div>
                    ))}
                </Box>
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

            <TextField
                label="Damage"
                value={damage}
                onChange={(e) => setDamage(e.target.value)}
                inputMode="numeric"
            />
            <TextField
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
            />
            <TextField
                label="Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                helperText="(Not sent to backend yet)"
            />

            <AppButton type="submit">Create Combo</AppButton>
        </Box>
    );
}
