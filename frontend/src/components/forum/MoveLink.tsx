import {useState, useEffect} from "react";
import {TextField} from "@mui/material";
import {Card} from "@mui/material";

import {X} from "lucide-react";

interface Move {
    id: string;
    name: string;
}

interface MoveLinkProps {
    onSelect: (move: Move) => void;
}

export default function MoveLink({onSelect}: MoveLinkProps) {
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState<Move[]>([]);
    const [selectedMove, setSelectedMove] = useState<Move | null>(null);

    useEffect(() => {
        if (query.length < 2) {
            setSuggestions([]);
            return;
        }

        fetch(`/api/moves/search?q=${encodeURIComponent(query)}`)
            .then((res) => res.json())
            .then((data) => setSuggestions(data))
            .catch(() => setSuggestions([]));
    }, [query]);

    const handleSelect = (move: Move) => {
        setSelectedMove(move);
        onSelect(move);
        setQuery("");
        setSuggestions([]);
    };

    return (
        <div className="relative">
            {selectedMove ? (
                <Card className="flex items-center gap-2 p-2">
                    {selectedMove.name}
                    <X
                        className="cursor-pointer"
                        onClick={() => setSelectedMove(null)}
                    />
                </Card>
            ) : (
                <TextField
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search for a move..."
                />
            )}
            {suggestions.length > 0 && (
                <div className="absolute bg-white border rounded shadow-md w-full mt-1">
                    {suggestions.map((move) => (
                        <div
                            key={move.id}
                            className="p-2 hover:bg-gray-200 cursor-pointer"
                            onClick={() => handleSelect(move)}
                        >
                            {move.name}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
