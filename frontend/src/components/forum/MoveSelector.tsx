import {useState} from "react";
import MoveLink from "@/src/components/forum/MoveLink";
import {Card, Chip, IconButton} from "@mui/material";
import {Close} from "@mui/icons-material";

interface Move {
    id: string;
    name: string;
}

interface MoveSelectorProps {
    onSelectMove: (move: Move) => void;
}

export default function MoveSelector({onSelectMove}: MoveSelectorProps) {
    const [selectedMoves, setSelectedMoves] = useState<Move[]>([]);

    const handleSelect = (move: Move) => {
        if (!selectedMoves.find((m) => m.id === move.id)) {
            setSelectedMoves([...selectedMoves, move]);
            onSelectMove(move);
        }
    };

    const handleRemove = (id: string) => {
        setSelectedMoves(selectedMoves.filter((m) => m.id !== id));
    };

    return (
        <Card className="p-2 space-y-2">
            <MoveLink onSelect={handleSelect}/>
            <div className="flex flex-wrap gap-2">
                {selectedMoves.map((move) => (
                    <Chip
                        key={move.id}
                        label={move.name}
                        onDelete={() => handleRemove(move.id)}
                        deleteIcon={<IconButton size="small"><Close fontSize="small"/></IconButton>}
                    />
                ))}
            </div>
        </Card>
    );
}
