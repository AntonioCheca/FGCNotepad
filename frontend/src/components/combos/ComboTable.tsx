import {AppTable} from "@/src/components/ui/AppTable";
import {AppTableBody} from "@/src/components/ui/AppTableBody";
import {AppTableCell} from "@/src/components/ui/AppTableCell";
import {AppTableHead} from "@/src/components/ui/AppTableHead";
import {AppTableRow} from "@/src/components/ui/AppTableRow";
import {ContentFlagButton} from "@/src/components/flags/ContentFlagButton";

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
                    <AppTableCell>Audit Status</AppTableCell>
                    <AppTableCell>Flag</AppTableCell>
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
                            <AppTableCell>{moves.join(", ")}</AppTableCell>
                            <AppTableCell>{combo.damage ?? "-"}</AppTableCell>
                            <AppTableCell>{season}</AppTableCell>
                            <AppTableCell>
                                {combo.needsTechnicalReview
                                    ? "Usable - pending technical review"
                                    : "Fully audited"}
                            </AppTableCell>
                            <AppTableCell><ContentFlagButton targetType="combo" targetId={combo.id}/></AppTableCell>
                        </AppTableRow>
                    );
                })}
            </AppTableBody>
        </AppTable>
    );
}
