import React from "react";
import type {Theme} from "@/src/components/ui/AppThemeUtils";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppCircularProgress} from "@/src/components/ui/AppCircularProgress";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {TuneIcon} from "@/src/components/ui/AppIcons";

interface NeutralStickyBarProps {
    visible: boolean;
    title: string;
    summary: string;
    loading: boolean;
    hasError: boolean;
    onOpenFilters: () => void;
}

/**
 * Compact filter state that stays on screen once the full panel scrolls away. The zero-height sticky slot keeps
 * the bar from shifting the layout when it appears; on phones it leaves room for the fixed navigation button.
 */
export function NeutralStickyBar({visible, title, summary, loading, hasError, onOpenFilters}: NeutralStickyBarProps) {
    return (
        <AppBox sx={{position: "sticky", top: 0, height: 0, zIndex: 1100}} aria-hidden={!visible}>
            <AppBox
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    minHeight: {xs: 68, md: 52},
                    pl: {xs: "44px", sm: "36px", md: 1.5},
                    pr: {xs: 1.5, md: 1.5},
                    py: 0.75,
                    borderBottom: "1px solid",
                    borderColor: (theme: Theme) => theme.fgc.border.default,
                    backgroundColor: (theme: Theme) => theme.fgc.surface.raised,
                    borderRadius: "0 0 12px 12px",
                    boxSizing: "border-box",
                    opacity: visible ? 1 : 0,
                    pointerEvents: visible ? "auto" : "none",
                    transform: visible ? "translateY(0)" : "translateY(-8px)",
                    transition: "opacity 0.15s, transform 0.15s",
                }}
            >
                <AppBox sx={{display: "grid", minWidth: 0, flex: 1}}>
                    <AppTypography variant="body2" sx={{fontWeight: 700, display: {md: "none"}}} noWrap>{title}</AppTypography>
                    <AppTypography variant="body2" color="text.secondary" noWrap sx={{display: {xs: "none", md: "block"}}}>{summary}</AppTypography>
                </AppBox>
                {loading ? <AppCircularProgress size={14} aria-label="Updating stats"/> : null}
                {hasError && !loading ? <AppTypography variant="caption" color="error.main" sx={{flexShrink: 0}}>Update failed</AppTypography> : null}
                <AppButton
                    type="button"
                    size="small"
                    variant="outlined"
                    color="secondary"
                    startIcon={<TuneIcon fontSize="small"/>}
                    onClick={onOpenFilters}
                    tabIndex={visible ? 0 : -1}
                    sx={{flexShrink: 0, minHeight: 40}}
                >
                    Filters
                </AppButton>
            </AppBox>
        </AppBox>
    );
}
