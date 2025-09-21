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
                {combos.map((combo) => {
                    const moves = combo.moves ?? [];
                    const season = combo.season
                        ? typeof combo.season === "string"
                            ? combo.season
                            : combo.season.name // or `${combo.season.startDate} - ${combo.season.endDate}`
                        : "-";

                    return (
                        <TableRow key={combo.id}>
                            <TableCell>{combo.title}</TableCell>
                            <TableCell>{combo.characterName ?? "-"}</TableCell>
                            <TableCell>{moves.map((m: any) => m.name).join(", ")}</TableCell>
                            <TableCell>{combo.damage ?? "-"}</TableCell>
                            <TableCell>{season}</TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </AppTable>
    );
}
