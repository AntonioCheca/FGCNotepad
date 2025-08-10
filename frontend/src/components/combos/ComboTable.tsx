import {AppTable} from "@/src/components/ui/AppTable";
import {TableBody, TableCell, TableHead, TableRow} from "@mui/material";

interface ComboTableProps {
    combos: any[];
}

export default function ComboTable({combos}: ComboTableProps) {
    return (
        <AppTable>
            <TableHead>
                <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell>Character</TableCell>
                    <TableCell>Moves</TableCell>
                    <TableCell>Damage</TableCell>
                    <TableCell>Season</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {combos.map((combo) => (
                    <TableRow key={combo.id}>
                        <TableCell>{combo.title}</TableCell>
                        <TableCell>{combo.characterName}</TableCell>
                        <TableCell>{combo.moves.map((m: any) => m.name).join(", ")}</TableCell>
                        <TableCell>{combo.damage}</TableCell>
                        <TableCell>{combo.season}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </AppTable>
    );
}
