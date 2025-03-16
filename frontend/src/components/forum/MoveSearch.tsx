import {useState, useEffect} from "react";
import {Input, List, ListItem, Paper} from "@mui/material";
import {searchMoves} from "@/services/api";

interface MoveSearchProps {
    onSelectMove: (move: { id: string; summary: string }) => void;
}

const MoveSearch = ({onSelectMove}: MoveSearchProps) => {
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState<{ id: string; summary: string }[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
        if (query.length > 1) {
            const data = searchMoves(query);
            setSuggestions(data);
            setShowSuggestions(true);
        } else {
            setShowSuggestions(false);
        }
    }, [query]);

    return (
        <div style={{position: "relative"}}>
            <Input
                placeholder="Search move..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                fullWidth
            />
            {showSuggestions && suggestions.length > 0 && (
                <Paper
                    style={{
                        position: "absolute",
                        zIndex: 10,
                        width: "100%",
                        maxHeight: "200px",
                        overflowY: "auto",
                    }}
                >
                    <List>
                        {suggestions.map((move) => (
                            <ListItem button key={move.id} onClick={() => onSelectMove(move)}>
                                {move.summary}
                            </ListItem>
                        ))}
                    </List>
                </Paper>
            )}
        </div>
    );
};

export default MoveSearch;
