import {AppTable} from "@/src/components/ui/AppTable";
import {AppTableBody} from "@/src/components/ui/AppTableBody";
import {AppTableCell} from "@/src/components/ui/AppTableCell";
import {AppTableHead} from "@/src/components/ui/AppTableHead";
import {AppTableRow} from "@/src/components/ui/AppTableRow";

interface ComboTableProps {
    combos: any[];
}

export default function ComboTable({combos}: ComboTableProps) {
    return (
        <AppTable>
            <AppTableHead>
                <AppTableRow>
                    <AppTableCell>Title</AppTableCell>
                    <AppTableCell>Character</AppTableCell>
                    <AppTableCell>Moves</AppTableCell>
                    <AppTableCell>Damage</AppTableCell>
                    <AppTableCell>Season</AppTableCell>
                </AppTableRow>
            </AppTableHead>
            <AppTableBody>
                {combos.map((combo) => {
                    const moves = combo.moves ?? [];
                    const season = combo.season
                        ? typeof combo.season === "string"
                            ? combo.season
                            : combo.season.name // or `${combo.season.startDate} - ${combo.season.endDate}`
                        : "-";

                    return (
                        <AppTableRow key={combo.id}>
                            <AppTableCell>{combo.title}</AppTableCell>
                            <AppTableCell>{combo.characterName ?? "-"}</AppTableCell>
                            <AppTableCell>{moves.map((m: any) => m.name).join(", ")}</AppTableCell>
                            <AppTableCell>{combo.damage ?? "-"}</AppTableCell>
                            <AppTableCell>{season}</AppTableCell>
                        </AppTableRow>
                    );
                })}
            </AppTableBody>
        </AppTable>
    );
}
