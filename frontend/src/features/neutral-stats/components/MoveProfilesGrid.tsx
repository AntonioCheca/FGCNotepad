import React from "react";
import type {Theme} from "@/src/components/ui/AppThemeUtils";
import {useMode} from "@/src/context/ThemeContext";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppTypography} from "@/src/components/ui/AppTypography";
import type {NeutralMoveProfileCard, NeutralStatsResponse} from "@/src/types/neutralStats";
import {type RechartsModule, useRecharts} from "../useRecharts";

interface MoveProfilesGridProps {
    stats: NeutralStatsResponse;
    showAll: boolean;
    onShowAll: () => void;
}

const CHART_HEIGHT = 128;

function spacingTicks(xMax: number): number[] {
    const step = xMax > 4 ? 1 : 0.5;
    const ticks: number[] = [];
    for (let tick = 0; tick <= xMax + 1e-9; tick += step) {
        ticks.push(Number(tick.toFixed(2)));
    }

    return ticks;
}

function MoveProfileCard({card, stats, recharts, ticks}: {card: NeutralMoveProfileCard; stats: NeutralStatsResponse; recharts: RechartsModule | null; ticks: number[]}) {
    const {theme} = useMode();
    const halfBucket = stats.spacing.bucketSize / 2;
    const data = card.counts.map((count, index) => ({x: stats.spacing.buckets[index].start + halfBucket, count}));
    const uses = `${card.total.toLocaleString()} use${card.total === 1 ? "" : "s"}`;

    return (
        <AppBox
            component="article"
            aria-label={`${card.label}, ${uses}`}
            sx={{display: "grid", gap: 0.5, p: 1.25, border: "1px solid", borderColor: "divider", borderRadius: 1.5, backgroundColor: (theme: Theme) => theme.fgc.surface.base, minWidth: 0}}
        >
            <AppBox sx={{display: "grid", gap: 0.1, minWidth: 0}}>
                <AppTypography variant="subtitle1" sx={{fontWeight: 700, lineHeight: 1.25}} noWrap>{card.label}</AppTypography>
                <AppTypography variant="caption" color="text.secondary" noWrap>{card.name ? `${card.name} – ${uses}` : uses}</AppTypography>
            </AppBox>
            <AppBox sx={{height: CHART_HEIGHT, minWidth: 0}}>
                {recharts ? (
                    <recharts.ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                        <recharts.LineChart data={data} margin={{top: 6, right: 8, bottom: 0, left: -18}}>
                            <recharts.CartesianGrid stroke={theme.fgc.chart.grid} vertical={false}/>
                            <recharts.XAxis
                                dataKey="x"
                                type="number"
                                domain={[0, stats.spacing.xMax]}
                                ticks={ticks}
                                tick={{fill: theme.fgc.chart.axis, fontSize: 10, fontFamily: theme.typography.fontFamily}}
                                stroke={theme.fgc.chart.grid}
                                tickLine={false}
                            />
                            <recharts.YAxis
                                domain={[0, Math.max(stats.moveProfiles.yMax, 1)]}
                                ticks={[0, Math.max(stats.moveProfiles.yMax, 1)]}
                                allowDecimals={false}
                                tick={{fill: theme.fgc.chart.axis, fontSize: 10, fontFamily: theme.typography.fontFamily}}
                                stroke={theme.fgc.chart.grid}
                                tickLine={false}
                                width={44}
                            />
                            {card.maxRange !== null ? (
                                <recharts.ReferenceLine
                                    x={card.maxRange}
                                    stroke={theme.fgc.chart.rangeMarker}
                                    strokeWidth={1.5}
                                    strokeDasharray="4 3"
                                    ifOverflow="hidden"
                                />
                            ) : null}
                            <recharts.Line
                                type="linear"
                                dataKey="count"
                                stroke={theme.fgc.chart.line}
                                strokeWidth={2}
                                dot={false}
                                activeDot={false}
                                isAnimationActive={false}
                            />
                        </recharts.LineChart>
                    </recharts.ResponsiveContainer>
                ) : null}
            </AppBox>
        </AppBox>
    );
}

export function MoveProfilesGrid({stats, showAll, onShowAll}: MoveProfilesGridProps) {
    const recharts = useRecharts();
    const {cards, topLimit} = stats.moveProfiles;
    const visibleCards = showAll ? cards : cards.slice(0, topLimit);
    const ticks = React.useMemo(() => spacingTicks(stats.spacing.xMax), [stats.spacing.xMax]);

    return (
        <AppBox sx={{display: "grid", gap: 1.5, minWidth: 0}}>
            <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(3, minmax(0, 1fr))", xl: "repeat(4, minmax(0, 1fr))"}, gap: 1.25, minWidth: 0}}>
                {visibleCards.map((card) => <MoveProfileCard key={card.key} card={card} stats={stats} recharts={recharts} ticks={ticks}/>)}
            </AppBox>
            {!showAll && cards.length > topLimit ? (
                <AppBox sx={{display: "flex", justifyContent: "center"}}>
                    <AppButton type="button" variant="outlined" color="secondary" onClick={onShowAll}>Show all ({cards.length})</AppButton>
                </AppBox>
            ) : null}
            <AppTypography variant="caption" color="text.secondary" sx={{textAlign: "center"}}>Spacing in game units · uses per spacing bucket · orange dashed line: max range + average opponent hurtbox</AppTypography>
        </AppBox>
    );
}
