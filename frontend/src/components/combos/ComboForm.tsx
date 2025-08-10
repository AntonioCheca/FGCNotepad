import {useState} from "react";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppTypography} from "@/src/components/ui/AppTypography";
import useMoves from "@/hooks/useMoves";
import {useCharacters} from "@/hooks/useCharacters";
import {Box, CircularProgress, TextField} from "@mui/material";
import {WrappedAutocomplete} from "@/src/components/ui/WrappedAutocomplete";

interface ComboFormProps {
    onSubmit: (data: any) => void;
}

export default function ComboForm({onSubmit}: ComboFormProps) {
    const [title, setTitle] = useState("");
    const [character, setCharacter] = useState<any>(null);

    // Moves state
    const [selectedMoves, setSelectedMoves] = useState<any[]>([]);
    const [moveOptions, setMoveOptions] = useState<any[]>([]);
    const [movesInputValue, setMovesInputValue] = useState("");
    const [movesLoading, setMovesLoading] = useState(false);

    const [damage, setDamage] = useState("");
    const [oki, setOki] = useState("");
    const [description, setDescription] = useState("");
    const [notes, setNotes] = useState("");

    const {searchMoves} = useMoves();
    const {characters: characterOptions, loading: charactersLoading} = useCharacters();

    // Async search for moves
    const handleMoveSearch = async (input: string) => {
        if (!input) return [];
        const res = await searchMoves(input);
        if (!res || !Array.isArray(res.data)) {
            console.warn("searchMoves returned invalid data:", res);
            return [];
        }
        return res.data;
    };

    // Called when user types in the moves input field
    const handleMovesInputChange = async (newInputValue: string, reason: string) => {
        setMovesInputValue(newInputValue);

        if (reason === "clear" || newInputValue === "") {
            setMoveOptions([]);
            return;
        }

        setMovesLoading(true);
        try {
            const results = await handleMoveSearch(newInputValue);
            setMoveOptions(Array.isArray(results) ? results : []);
        } catch (error) {
            setMoveOptions([]);
            console.error("Move search failed", error);
        } finally {
            setMovesLoading(false);
        }
    };

    // Form submit handler
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        onSubmit({
            title,
            characterId: character?.id ?? null,
            moves: selectedMoves.map((m) => m.id),
            damage: damage || null,
            oki: oki || null,
            description: description || null,
            notes: notes || null,
        });
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

            <WrappedAutocomplete
                label="Character"
                options={characterOptions ?? []}
                loading={charactersLoading}
                value={character}
                onChange={(_, value) => setCharacter(value)}
                getOptionLabel={(option: any) => option.name}
                required
                disableClearable={false}
            />

            <WrappedAutocomplete
                label="Moves"
                multiple
                options={moveOptions}
                loading={movesLoading}
                value={selectedMoves}
                onChange={(_, newValue) => setSelectedMoves(newValue)}
                inputValue={movesInputValue}
                onInputChange={(_, newInputValue, reason) => handleMovesInputChange(newInputValue, reason)}
                getOptionLabel={(option: any) => option.name || ""}
                filterOptions={(options) => options} // disable built-in filtering to rely on server
                required
            />

            <TextField label="Damage" value={damage} onChange={(e) => setDamage(e.target.value)}/>
            <TextField label="Oki" value={oki} onChange={(e) => setOki(e.target.value)}/>
            <TextField label="Description" value={description} onChange={(e) => setDescription(e.target.value)}/>
            <TextField label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)}/>

            <AppButton type="submit">Create Combo</AppButton>
        </Box>
    );
}
