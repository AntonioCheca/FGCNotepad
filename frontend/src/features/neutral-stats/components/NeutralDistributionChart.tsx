import React from "react";
import type {Theme} from "@/src/components/ui/AppThemeUtils";
import {useMode} from "@/src/context/ThemeContext";
import {AppBox} from "@/src/components/ui/AppBox";
import type {NeutralStatsResponse} from "@/src/types/neutralStats";
import {distributionColors} from "../neutralChartColors";
import {useRecharts} from "../useRecharts";
import {NeutralDistributionLegend} from "./NeutralDistributionLegend";

const BAR_FILL_OPACITY = 0.88;

export function NeutralDistributionChart({stats}: {stats: NeutralStatsResponse}) {
    const {theme} = useMode();
    const recharts = useRecharts();
    const series = stats.distribution.series;
    const colors = React.useMemo(() => distributionColors(series, theme), [series, theme]);
    const [hidden, setHidden] = React.useState<ReadonlySet<string>>(() => new Set());
    const toggle = React.useCallback((key: string) => setHidden((current) => {
        const next = new Set(current);
        if (!next.delete(key)) {
            next.add(key);
        }

        return next;
    }), []);
    const data = React.useMemo(() => stats.spacing.buckets.map((bucket, index) => {
        const row: Record<string, number> = {start: bucket.start};
        for (const entry of series) {
            row[entry.key] = entry.values[index] ?? 0;
        }

        return row;
    }), [stats.spacing.buckets, series]);

    return (
        <AppBox
            sx={{
                display: "grid",
                gridTemplateColumns: {xs: "minmax(0, 1fr)", lg: "minmax(0, 3fr) minmax(320px, 2fr)"},
                width: {xs: "100%", lg: "70%"},
                border: "1px solid",
                borderColor: (theme: Theme) => theme.fgc.border.subtle,
                borderRadius: 1.5,
                backgroundColor: (theme: Theme) => theme.fgc.surface.base,
                minWidth: 0,
            }}
        >
            <AppBox sx={{height: {xs: 280, md: 400}, minWidth: 0, p: {xs: 1, md: 1.5}}}>
                {recharts ? (
                    <recharts.ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                        <recharts.BarChart data={data} margin={{top: 8, right: 8, bottom: 20, left: 4}} barCategoryGap={1}>
                            <recharts.CartesianGrid stroke={theme.fgc.chart.grid} vertical={false}/>
                            <recharts.XAxis
                                dataKey="start"
                                tick={{fill: theme.fgc.chart.axis, fontSize: 11, fontFamily: theme.typography.fontFamily}}
                                stroke={theme.fgc.chart.grid}
                                tickLine={false}
                                interval="preserveStartEnd"
                                minTickGap={16}
                                label={{value: "Spacing (game units, bucket start)", position: "insideBottom", offset: -12, fill: theme.fgc.chart.axis, fontSize: 11, fontFamily: theme.typography.fontFamily}}
                            />
                            <recharts.YAxis
                                domain={[0, 100]}
                                ticks={[0, 25, 50, 75, 100]}
                                tick={{fill: theme.fgc.chart.axis, fontSize: 11, fontFamily: theme.typography.fontFamily}}
                                stroke={theme.fgc.chart.grid}
                                tickLine={false}
                                width={52}
                                unit="%"
                                label={{value: "Relative neutral activity (%)", angle: -90, position: "insideLeft", offset: 12, dy: 80, fill: theme.fgc.chart.axis, fontSize: 11, fontFamily: theme.typography.fontFamily}}
                            />
                            {series.filter((entry) => !hidden.has(entry.key)).map((entry) => (
                                <recharts.Bar
                                    key={entry.key}
                                    dataKey={entry.key}
                                    name={entry.label}
                                    stackId="neutral"
                                    fill={colors[entry.key]}
                                    fillOpacity={BAR_FILL_OPACITY}
                                    stroke={theme.fgc.surface.base}
                                    strokeWidth={0.75}
                                    isAnimationActive={false}
                                />
                            ))}
                        </recharts.BarChart>
                    </recharts.ResponsiveContainer>
                ) : null}
            </AppBox>
            <AppBox
                sx={{
                    minWidth: 0,
                    px: {xs: 1.25, md: 1.75},
                    py: {xs: 1.25, md: 1.5},
                    borderTop: {xs: "1px solid", lg: "none"},
                    borderLeft: {xs: "none", lg: "1px solid"},
                    borderColor: (theme: Theme) => theme.fgc.border.subtle,
                }}
            >
                <NeutralDistributionLegend series={series} colors={colors} swatchOpacity={BAR_FILL_OPACITY} hidden={hidden} onToggle={toggle} onShowAll={() => setHidden(new Set())}/>
            </AppBox>
        </AppBox>
    );
}
