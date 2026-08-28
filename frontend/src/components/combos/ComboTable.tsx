import Link from "next/link";
import type React from "react";
import type {ComboSortDirection, ComboSortField} from "./filters/comboFilterTypes";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppChip} from "@/src/components/ui/AppChip";
import {AppMenuItem} from "@/src/components/ui/AppMenuItem";
import {AppPaper} from "@/src/components/ui/AppPaper";
import {AppTable} from "@/src/components/ui/AppTable";
import {AppTableBody} from "@/src/components/ui/AppTableBody";
import {AppTableCell} from "@/src/components/ui/AppTableCell";
import {AppTableContainer} from "@/src/components/ui/AppTableContainer";
import {AppTableHead} from "@/src/components/ui/AppTableHead";
import {AppTableRow} from "@/src/components/ui/AppTableRow";
import {AppTextField} from "@/src/components/ui/AppTextField";
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
        <>
            <ComboMobileSortControls sort={sort} sortDirection={sortDirection} onSortChange={onSortChange} />
            <ComboMobileCards combos={combos} />
            <AppPaper variant="outlined" sx={{display: {xs: "none", lg: "block"}, borderRadius: 2.5, overflow: "hidden", borderColor: "fgc.border.default", minWidth: 0, maxWidth: "100%"}}>
            <AppTableContainer sx={{maxHeight: "calc(100dvh - 275px)", overflowX: "auto", backgroundColor: "fgc.surface.base"}}>
                <AppTable stickyHeader>
                    <AppTableHead>
                        <AppTableRow>
                            <AppTableCell sx={{fontWeight: 700, backgroundColor: "fgc.surface.sunken"}}>Title</AppTableCell>
                            <AppTableCell sx={{fontWeight: 700, backgroundColor: "fgc.surface.sunken"}}>Character</AppTableCell>
                            <AppTableCell sx={{fontWeight: 700, backgroundColor: "fgc.surface.sunken"}}>Starter</AppTableCell>
                            <AppTableCell sx={{fontWeight: 700, backgroundColor: "fgc.surface.sunken"}}>Ender</AppTableCell>
                            <AppTableCell sx={{fontWeight: 700, backgroundColor: "fgc.surface.sunken"}}>Spacing</AppTableCell>
                            <AppTableCell sx={{fontWeight: 700, backgroundColor: "fgc.surface.sunken"}}>Situation</AppTableCell>
                            {sortableHeaders.map(renderSortableHeader)}
                        </AppTableRow>
                    </AppTableHead>
                    <AppTableBody>
                        {combos.map((combo) => {
                            const season = combo.season
                                ? combo.season
                                : "-";
                            const isPendingReview = combo.moderationState === "pending_review";
                            const compatibility = combo.compatibility;
                            const compatibilityColor = compatibility?.status === "compatible" ? "success" : compatibility?.status === "uncertain" ? "warning" : "default";

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
                                    <AppTableCell>{combo.spacing}</AppTableCell>
                                    <AppTableCell>
                                        {compatibility ? (
                                            <AppBox sx={{display: "grid", gap: 0.35, minWidth: 180}}>
                                                <AppChip size="small" color={compatibilityColor} variant="outlined" label={compatibility.status} sx={{width: "fit-content", fontWeight: 700}} />
                                                <AppTypography variant="caption" color="text.secondary">
                                                    {[...(compatibility.reasons ?? []), ...(compatibility.warnings ?? [])][0] ?? "Evaluated for selected situation."}
                                                </AppTypography>
                                            </AppBox>
                                        ) : "-"}
                                    </AppTableCell>
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
        </>
    );
}

function ComboMobileSortControls({sort, sortDirection, onSortChange}: Pick<ComboTableProps, "sort" | "sortDirection" | "onSortChange">) {
    const selectedHeader = sortableHeaders.find((header) => header.field === sort);
    const directionLocked = selectedHeader?.seasonOnlyDesc === true;
    const nextDirection: ComboSortDirection = sortDirection === "desc" ? "asc" : "desc";

    return (
        <AppPaper
            variant="outlined"
            sx={{
                display: {xs: "grid", lg: "none"},
                gridTemplateColumns: "1fr",
                gap: 0.75,
                p: 1,
                mb: 1,
                borderRadius: 2,
                backgroundColor: "fgc.surface.base",
                borderColor: "fgc.border.default",
            }}
        >
            <AppTextField
                select
                label="Sort by"
                size="small"
                value={sort}
                onChange={(event) => {
                    const field = event.target.value as ComboSortField;
                    const header = sortableHeaders.find((candidate) => candidate.field === field);
                    onSortChange(field, header?.seasonOnlyDesc ? "desc" : sortDirection);
                }}
            >
                {sortableHeaders.map((header) => (
                    <AppMenuItem key={header.field} value={header.field}>{formatSortLabel(header.label)}</AppMenuItem>
                ))}
            </AppTextField>
            <AppButton
                type="button"
                variant="outlined"
                color="secondary"
                disabled={directionLocked}
                onClick={() => onSortChange(sort, nextDirection)}
                sx={{minHeight: 44}}
            >
                {sortDirection === "desc" || directionLocked ? "Descending" : "Ascending"}
            </AppButton>
        </AppPaper>
    );
}

function formatSortLabel(label: string | string[]): string {
    return Array.isArray(label) ? label.join(" ") : label;
}

function ComboMobileCards({combos}: {combos: ComboRow[]}) {
    return (
            <AppBox sx={{display: {xs: "grid", lg: "none"}, gap: 0.85}}>
            {combos.map((combo) => {
                const isPendingReview = combo.moderationState === "pending_review";
                const compatibility = combo.compatibility;
                const compatibilityColor = compatibility?.status === "compatible" ? "success" : compatibility?.status === "uncertain" ? "warning" : "default";

                return (
                    <AppPaper key={combo.id} variant="outlined" sx={{p: 1, borderRadius: 2, display: "grid", gap: 0.75, backgroundColor: "fgc.surface.base", borderColor: "fgc.border.default", minWidth: 0}}>
                        <AppBox sx={{display: "grid", gap: 0.35, minWidth: 0}}>
                            <AppBox sx={{display: "flex", gap: 0.65, alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", minWidth: 0}}>
                                <Link href={`/combos/${combo.id}`} style={{color: "inherit", textDecoration: "none"}}>
                                    <AppTypography variant="subtitle1" sx={{fontWeight: 750, textDecoration: "underline", textUnderlineOffset: "2px", overflowWrap: "anywhere"}}>{combo.title}</AppTypography>
                                </Link>
                                {isPendingReview ? <AppChip icon={<PendingActionsIcon fontSize="small" />} size="small" label="Pending" color="warning" variant="outlined" /> : null}
                            </AppBox>
                            <AppTypography variant="body2" color="text.secondary">{combo.characterName ?? "-"}</AppTypography>
                        </AppBox>

                        <AppBox sx={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0.65}}>
                            <ComboMobileFact label="Starter" value={combo.starter ?? "-"} />
                            <ComboMobileFact label="Ender" value={combo.ender ?? "-"} />
                            <ComboMobileFact label="Spacing" value={combo.spacing ?? "-"} />
                            <ComboMobileFact label="Damage" value={combo.damage ?? "-"} />
                        </AppBox>

                        <AppBox sx={{display: "flex", gap: 0.45, flexWrap: "wrap"}}>
                            <AppChip size="small" variant="outlined" label={`Drive ${combo.driveCost ?? "-"}`} />
                            <AppChip size="small" variant="outlined" label={`Super ${combo.superCost ?? "-"}`} />
                            <AppChip size="small" variant="outlined" label={`Season ${combo.season ?? "-"}`} />
                        </AppBox>

                        {compatibility ? (
                            <AppBox sx={{display: "grid", gap: 0.35, p: 0.8, borderRadius: 1.25, backgroundColor: "fgc.surface.sunken"}}>
                                <AppChip size="small" color={compatibilityColor} variant="outlined" label={compatibility.status} sx={{width: "fit-content", fontWeight: 700}} />
                                <AppTypography variant="caption" color="text.secondary">
                                    {[...(compatibility.reasons ?? []), ...(compatibility.warnings ?? [])][0] ?? "Evaluated for selected situation."}
                                </AppTypography>
                            </AppBox>
                        ) : null}
                    </AppPaper>
                );
            })}
        </AppBox>
    );
}

function ComboMobileFact({label, value}: {label: string; value: React.ReactNode}) {
    return (
        <AppBox sx={{display: "grid", gap: 0.1, minWidth: 0}}>
            <AppTypography variant="caption" color="text.secondary" sx={{fontWeight: 700}}>{label}</AppTypography>
            <AppTypography variant="body2" sx={{fontWeight: 650, overflowWrap: "anywhere"}}>{value}</AppTypography>
        </AppBox>
    );
}
