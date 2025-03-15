import {Chip} from "@mui/material";

interface MoveReferenceBlockProps {
    initialMoveId: string;
}

export default function MoveReferenceBlock({initialMoveId}: MoveReferenceBlockProps) {
    return (
        <Chip
            label={initialMoveId}
            size="small"
            sx={{
                display: "inline-flex", // Ensures it stays inline
                verticalAlign: "middle", // Aligns properly with surrounding text
                mx: 0.5, // Adds slight spacing between words
                fontSize: "0.875rem",
                fontWeight: "bold",
            }}
        />
    );
}
