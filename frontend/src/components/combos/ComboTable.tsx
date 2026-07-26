import Link from "next/link";
import type {ComboSortDirection, ComboSortField} from "./filters/comboFilterTypes";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppChip} from "@/src/components/ui/AppChip";
import {AppPaper} from "@/src/components/ui/AppPaper";
import {AppTable} from "@/src/components/ui/AppTable";
import {AppTableBody} from "@/src/components/ui/AppTableBody";
import {AppTableCell} from "@/src/components/ui/AppTableCell";
import {AppTableContainer} from "@/src/components/ui/AppTableContainer";
import {AppTableHead} from "@/src/components/ui/AppTableHead";
import {AppTableRow} from "@/src/components/ui/AppTableRow";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {ArrowDownwardIcon, ArrowUpwardIcon, PendingActionsIcon} from "@/src/components/ui/AppIcons";
import {ComboRow} from "@/src/types/combo";

interface ComboTableProps {
    combos: ComboRow[];
    sort: ComboSortField;
    sortDirection: ComboSortDirection;
    onSortChange: (field: ComboSortField, direction: ComboSortDirection) => void;
}

const sortableHeaders: Array<{field: ComboSortField; label: string | string[]; seasonOnlyDesc?: boolean}> = [
    {field: "damage", label: "Damage"},
    {field: "resourceAdjustedDamage", label: ["Res.", "Adj."]},
    {field: "driveCost", label: "Drive"},
    {field: "minimumDriveCost", label: ["Min", "Drive"]},
    {field: "minimumDriveCostNoBurnout", label: ["Safe", "Drive"]},
    {field: "superCost", label: "Super"},
    {field: "driveGain", label: ["Drive", "Gain"]},
    {field: "superGain", label: ["Super", "Gain"]},
    {field: "seasonStartDate", label: "Season", seasonOnlyDesc: true},
];

export default function ComboTable({combos, sort, sortDirection, onSortChange}: ComboTableProps) {
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

    const renderSortableHeader = ({field, label, seasonOnlyDesc}: {field: ComboSortField; label: string | string[]; seasonOnlyDesc?: boolean}) => {
        const active = sort === field;
        const nextDirection: ComboSortDirection = seasonOnlyDesc ? "desc" : active && sortDirection === "desc" ? "asc" : "desc";
        const Icon = active && sortDirection === "asc" && !seasonOnlyDesc ? ArrowUpwardIcon : ArrowDownwardIcon;
        const labelLines = Array.isArray(label) ? label : [label];

        return (
            <AppTableCell key={field} sx={{fontWeight: 700, backgroundColor: "fgc.surface.sunken", whiteSpace: "nowrap"}}>
                <AppButton
                    type="button"
                    variant="text"
                    size="small"
                    color="secondary"
                    onClick={() => onSortChange(field, nextDirection)}
                    endIcon={<Icon fontSize="small" />}
                    sx={{
                        minWidth: 0,
                        px: 0.35,
                        color: active ? "fgc.accent.selected" : "text.primary",
                        fontWeight: 800,
                        lineHeight: 1.05,
                        textAlign: "center",
                        "& .MuiButton-endIcon": {ml: 0.25},
                    }}
                >
                    <AppBox component="span" sx={{display: "grid", gap: 0.05}}>
                        {labelLines.map((line) => <AppBox key={line} component="span">{line}</AppBox>)}
                    </AppBox>
                </AppButton>
            </AppTableCell>
        );
    };

    return (
        <AppPaper variant="outlined" sx={{borderRadius: 2.5, overflow: "hidden", borderColor: "fgc.border.default"}}>
            <AppTableContainer sx={{maxHeight: "calc(100vh - 275px)", backgroundColor: "fgc.surface.base"}}>
                <AppTable stickyHeader>
                    <AppTableHead>
                        <AppTableRow>
                            <AppTableCell sx={{fontWeight: 700, backgroundColor: "fgc.surface.sunken"}}>Title</AppTableCell>
                            <AppTableCell sx={{fontWeight: 700, backgroundColor: "fgc.surface.sunken"}}>Character</AppTableCell>
                            <AppTableCell sx={{fontWeight: 700, backgroundColor: "fgc.surface.sunken"}}>Starter</AppTableCell>
                            <AppTableCell sx={{fontWeight: 700, backgroundColor: "fgc.surface.sunken"}}>Ender</AppTableCell>
                            {sortableHeaders.map(renderSortableHeader)}
                        </AppTableRow>
                    </AppTableHead>
                    <AppTableBody>
                        {combos.map((combo) => {
                            const season = combo.season
                                ? combo.season
                                : "-";
                            const isPendingReview = combo.moderationState === "pending_review";

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
                                        <AppBox sx={{display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap"}}>
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
                                            {isPendingReview ? (
                                                <AppChip
                                                    icon={<PendingActionsIcon fontSize="small" />}
                                                    size="small"
                                                    label="Pending review"
                                                    color="warning"
                                                    variant="outlined"
                                                    sx={{fontWeight: 700}}
                                                />
                                            ) : null}
                                        </AppBox>
                                    </AppTableCell>
                                    <AppTableCell>{combo.characterName ?? "-"}</AppTableCell>
                                    <AppTableCell>{combo.starter ?? "-"}</AppTableCell>
                                    <AppTableCell>{combo.ender ?? "-"}</AppTableCell>
                                    <AppTableCell>{combo.damage ?? "-"}</AppTableCell>
                                    <AppTableCell>{combo.resourceAdjustedDamage ?? "-"}</AppTableCell>
                                    <AppTableCell>{combo.driveCost ?? "-"}</AppTableCell>
                                    <AppTableCell>{combo.minimumDriveCost ?? "-"}</AppTableCell>
                                    <AppTableCell>{combo.minimumDriveCostNoBurnout ?? "-"}</AppTableCell>
                                    <AppTableCell>{combo.superCost ?? "-"}</AppTableCell>
                                    <AppTableCell>{combo.driveGain ?? "-"}</AppTableCell>
                                    <AppTableCell>{combo.superGain ?? "-"}</AppTableCell>
                                    <AppTableCell>{season}</AppTableCell>
                                </AppTableRow>
                            );
                        })}
                    </AppTableBody>
                </AppTable>
            </AppTableContainer>
        </AppPaper>
    );
}
