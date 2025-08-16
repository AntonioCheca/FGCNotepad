import {useState, useEffect} from "react";
import {Box, IconButton} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import {WrappedAutocomplete} from "@/src/components/ui/WrappedAutocomplete";
import type {StepDraft, ConnectionType, LeafSequenceOption} from "@/src/types/combo";

interface StepItemProps {
    index: number;
    step: StepDraft;
    onChange: (update: Partial<StepDraft>) => void;
    onRemove: () => void;
    moves: LeafSequenceOption[]; // <-- NEW: all leafs passed from parent
    connections: ConnectionType[];
    connectionsLoading: boolean;
}

export default function StepItem({
                                     index,
                                     step,
                                     onChange,
                                     onRemove,
                                     moves,
                                     connections,
                                     connectionsLoading,
                                 }: StepItemProps) {
    const [movesInputValue, setMovesInputValue] = useState<string>("");

    // Filter the passed moves locally based on input value
    const filteredMoves = moves.filter((m) =>
        m.name.toLowerCase().includes(movesInputValue.toLowerCase())
    );

    return (
        <Box sx={{display: "flex", gap: 1, alignItems: "center"}}>
            <WrappedAutocomplete<LeafSequenceOption>
                label={`Step ${index + 1} Move`}
                options={filteredMoves}
                value={step.move}
                onChange={(v) => onChange({move: v})}
                getOptionLabel={(o) => o?.name ?? ""}
                inputValue={movesInputValue}
                onInputChange={(event, newValue) => setMovesInputValue(newValue)}
                filterOptions={(options) => options} // already filtered manually
                required
                sx={{minWidth: 200}} // make input bigger for UX
            />

            <WrappedAutocomplete<ConnectionType>
                label="Connection"
                options={connections}
                value={step.connection}
                onChange={(v) => onChange({connection: v})}
                getOptionLabel={(o) => o?.name ?? ""}
                loading={connectionsLoading}
                disabled={index === 0} // first step has no connection type
                sx={{minWidth: 150}} // make input bigger
            />

            <IconButton aria-label="Remove step" onClick={onRemove}>
                <DeleteIcon/>
            </IconButton>
        </Box>
    );
}
