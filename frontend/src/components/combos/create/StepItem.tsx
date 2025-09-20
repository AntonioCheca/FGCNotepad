import {useState} from "react";
import {Box, IconButton} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import {WrappedAutocomplete} from "@/src/components/ui/WrappedAutocomplete";
import type {StepDraft, ConnectionType, LeafSequenceOption} from "@/src/types/combo";

interface StepItemProps {
    index: number;
    step: StepDraft;
    onChange: (update: Partial<StepDraft>) => void;
    onRemove: () => void;
    moves: LeafSequenceOption[];
    connections: ConnectionType[];
    connectionsLoading: boolean;
}

export default function StepItem({
                                     index,
                                     step,
                                     onChange,
                                     onRemove,
                                     moves = [],
                                     connections,
                                     connectionsLoading,
                                 }: StepItemProps) {
    const [movesInputValue, setMovesInputValue] = useState<string>("");

    const filteredMoves = moves.filter((m) =>
        m.name.toLowerCase().includes(movesInputValue.toLowerCase())
    );

    return (
        <Box sx={{display: "flex", gap: 1, alignItems: "center"}}>
            <WrappedAutocomplete<ConnectionType>
                label="Connection"
                options={connections}
                value={step.connection}
                onChange={(v) => onChange({connection: v})}
                getOptionLabel={(o) => o?.name ?? ""}
                loading={connectionsLoading}
                disabled={false}
                sx={{flex: 1, minWidth: 150}}
            />

            <WrappedAutocomplete<LeafSequenceOption>
                label={`Step ${index + 1} Move`}
                options={filteredMoves}
                value={step.move}
                onChange={(v) => onChange({move: v})}
                getOptionLabel={(o) => o?.name ?? ""}
                inputValue={movesInputValue}
                onInputChange={(event, newValue) => setMovesInputValue(newValue)}
                filterOptions={(options) => options}
                required
                sx={{flex: 1, minWidth: 200}}
            />

            <IconButton aria-label="Remove step" onClick={onRemove}>
                <DeleteIcon/>
            </IconButton>
        </Box>
    );
}
