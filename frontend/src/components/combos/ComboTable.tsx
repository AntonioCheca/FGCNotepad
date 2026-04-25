import Link from "next/link";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppChip} from "@/src/components/ui/AppChip";
import {AppPaper} from "@/src/components/ui/AppPaper";
import {AppTable} from "@/src/components/ui/AppTable";
import {AppTableBody} from "@/src/components/ui/AppTableBody";
import {AppTableCell} from "@/src/components/ui/AppTableCell";
import {AppTableContainer} from "@/src/components/ui/AppTableContainer";
import {AppTableHead} from "@/src/components/ui/AppTableHead";
import {AppTableRow} from "@/src/components/ui/AppTableRow";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {ContentFlagButton} from "@/src/components/flags/ContentFlagButton";
import {ComboRow} from "@/src/types/combo";

interface ComboTableProps {
    combos: ComboRow[];
}

export default function ComboTable({combos}: ComboTableProps) {
    if (combos.length === 0) {
        return (
            <AppPaper
                variant="outlined"
                sx={{
                    p: {xs: 2, md: 2.25},
                    borderRadius: 2.5,
                    display: "grid",
                    gap: 0.45,
                    backgroundColor: "fgc.surface.sunken",
                }}
            >
                <AppTypography variant="h6">No combos found</AppTypography>
                <AppTypography variant="body2" color="text.secondary">Try easing requirements or removing one advanced filter.</AppTypography>
            </AppPaper>
        );
    }

    return (
        <AppPaper variant="outlined" sx={{borderRadius: 2.5, overflow: "hidden", borderColor: "fgc.border.default"}}>
            <AppTableContainer sx={{maxHeight: "calc(100vh - 275px)", backgroundColor: "fgc.surface.base"}}>
                <AppTable stickyHeader>
                    <AppTableHead>
                        <AppTableRow>
                            <AppTableCell sx={{fontWeight: 700, backgroundColor: "fgc.surface.sunken"}}>Title</AppTableCell>
                            <AppTableCell sx={{fontWeight: 700, backgroundColor: "fgc.surface.sunken"}}>Character</AppTableCell>
                            <AppTableCell sx={{fontWeight: 700, backgroundColor: "fgc.surface.sunken"}}>Moves</AppTableCell>
                            <AppTableCell sx={{fontWeight: 700, backgroundColor: "fgc.surface.sunken"}}>Damage</AppTableCell>
                            <AppTableCell sx={{fontWeight: 700, backgroundColor: "fgc.surface.sunken"}}>Season</AppTableCell>
                            <AppTableCell sx={{fontWeight: 700, backgroundColor: "fgc.surface.sunken"}}>Audit Status</AppTableCell>
                            <AppTableCell sx={{fontWeight: 700, backgroundColor: "fgc.surface.sunken"}}>Flag</AppTableCell>
                        </AppTableRow>
                    </AppTableHead>
                    <AppTableBody>
                        {combos.map((combo) => {
                            const moves = combo.moves ?? [];
                            const season = combo.season
                                ? typeof combo.season === "string"
                                    ? combo.season
                                    : combo.season.name
                                : "-";

                            return (
                                <AppTableRow
                                    key={combo.id}
                                    hover
                                    sx={{
                                        "&:hover": {
                                            backgroundColor: "fgc.selection.hover",
                                        },
                                    }}
                                >
                                    <AppTableCell>
                                        <Link href={`/combos/${combo.id}`} style={{color: "inherit", textDecoration: "none"}}>
                                            <AppBox
                                                component="span"
                                                sx={{
                                                    fontWeight: 620,
                                                    textDecoration: "underline",
                                                    textDecorationColor: "transparent",
                                                    textUnderlineOffset: "2px",
                                                    '&:hover': {textDecorationColor: "currentColor"},
                                                }}
                                            >
                                                {combo.title}
                                            </AppBox>
                                        </Link>
                                    </AppTableCell>
                                    <AppTableCell>{combo.characterName ?? "-"}</AppTableCell>
                                    <AppTableCell>{moves.join(", ") || "-"}</AppTableCell>
                                    <AppTableCell>{combo.damage ?? "-"}</AppTableCell>
                                    <AppTableCell>{season}</AppTableCell>
                                    <AppTableCell>
                                        {combo.needsTechnicalReview ? (
                                            <AppChip size="small" label="Pending technical review" color="warning" variant="outlined" />
                                        ) : (
                                            <AppChip size="small" label="Fully audited" color="success" variant="outlined" />
                                        )}
                                    </AppTableCell>
                                    <AppTableCell><ContentFlagButton targetType="combo" targetId={combo.id} /></AppTableCell>
                                </AppTableRow>
                            );
                        })}
                    </AppTableBody>
                </AppTable>
            </AppTableContainer>
        </AppPaper>
    );
}
