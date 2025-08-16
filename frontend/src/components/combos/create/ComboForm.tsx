import {useEffect, useState} from "react";
import {Box, TextField} from "@mui/material";
import {AppButton} from "@/src/components/ui/AppButton";
import {WrappedAutocomplete} from "@/src/components/ui/WrappedAutocomplete";
import useMoves from "@/hooks/useMoves";
import {useCharacters} from "@/hooks/useCharacters";
import useConnections from "@/hooks/useConnections";
import useCombos from "@/hooks/useCombos";
import {StepList} from "@/src/components/combos/create/StepList";
import type {
    StepDraft,
    CreateFullComboPayload,
    LeafSequenceOption,
    ConnectionType,
} from "@/src/types/combo";

interface ComboFormProps {
    onSuccess?: () => void;
}

export default function ComboForm({onSuccess}: ComboFormProps) {
    const [title, setTitle] = useState<string>("");
    const [character, setCharacter] = useState<any>(null); // kept for UX parity; not used in payload yet
    const [damage, setDamage] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [notes, setNotes] = useState<string>(""); // not sent (no backend field yet)
    const [steps, setSteps] = useState<StepDraft[]>([]);
    const {fetchLeafs} = useCombos();
    const [leafs, setLeafs] = useState<LeafSequenceOption[]>([]);

    const {searchMoves} = useMoves();
    const {characters: characterOptions, loading: charactersLoading} = useCharacters();
    const {connections, loading: connectionsLoading, fetchConnections} = useConnections();
    const {createFullCombo} = useCombos();

    useEffect(() => {
        fetchConnections();
        fetchLeafs().then(setLeafs).catch(console.error);
    }, []);

    const handleAddStep = () =>
        setSteps((prev) => [...prev, {move: null, connection: null}]);

    const handleRemoveStep = (index: number) =>
        setSteps((prev) => prev.filter((_, i) => i !== index));

    const handleChangeStep = (
        index: number,
        update: Partial<StepDraft>
    ) =>
        setSteps((prev) => prev.map((s, i) => (i === index ? {...s, ...update} : s)));

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
                connection_type_id: idx === 0 ? null : (s.connection as ConnectionType | null)?.id ?? null,
            })),
        };

        try {
            await createFullCombo(payload);
            alert("Combo created successfully!");
            // reset minimal fields
            setTitle("");
            setDescription("");
            setDamage("");
            setNotes("");
            setSteps([]);
            onSuccess?.();
        } catch (err) {
            console.error(err);
            alert("Failed to create combo");
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{display: "flex", flexDirection: "column", gap: 2}}>
            <TextField
                label="Combo Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
            />

            {/* Character (optional; not sent today) */}
            <WrappedAutocomplete<any>
                label="Character"
                options={characterOptions ?? []}
                loading={charactersLoading}
                value={character}
                onChange={(value) => setCharacter(value)} // ✅ only 1 arg now
                getOptionLabel={(option: any) => option?.name ?? ""}
                disableClearable={false}
            />

            <StepList
                steps={steps}
                onAddStep={handleAddStep}
                onRemoveStep={handleRemoveStep}
                onChangeStep={handleChangeStep}
                searchMoves={searchMoves}
                connections={connections}
                connectionsLoading={connectionsLoading}
                moves={leafs} // ← pass leafs here
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
