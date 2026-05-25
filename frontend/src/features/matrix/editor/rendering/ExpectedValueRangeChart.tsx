import React from "react";
import {Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts";
import {useMode} from "@/src/context/ThemeContext";

interface ExpectedValueRangeChartProps {
    expectedValue: number | null;
    histogram: Array<{eventLabel: string; payoff: number; likelihood: number}>;
}

export function ExpectedValueRangeChart({expectedValue, histogram}: ExpectedValueRangeChartProps) {
    const {theme} = useMode();
    const ev = expectedValue ?? 0;
    const chartData = [...histogram].sort((a, b) => a.payoff - b.payoff);
    const minPayoff = chartData.length > 0 ? Math.min(...chartData.map((item) => item.payoff)) : -250;
    const maxPayoff = chartData.length > 0 ? Math.max(...chartData.map((item) => item.payoff)) : 250;

    return (
        <div style={{border: `1px solid ${theme.fgc.border.default}`, borderRadius: 10, padding: 10, background: theme.fgc.surface.raised}}>
            <div style={{display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 8}}>
                <div style={{fontSize: 14, fontWeight: 700, color: theme.fgc.text.secondary}}>Expected Value</div>
            </div>
            <div style={{display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8}}>
                <div style={{fontSize: 30, fontWeight: 700, color: ev >= 0 ? theme.fgc.feedback.success : theme.fgc.feedback.error}}>
                    {ev >= 0 ? "+" : ""}{ev.toFixed(2)}
                </div>
            </div>
            <div style={{height: 280}}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{top: 20, right: 12, left: 2, bottom: 8}} barSize={26}>
                        <CartesianGrid stroke={theme.fgc.border.subtle} strokeDasharray="3 3" />
                        <XAxis
                            dataKey="payoff"
                            type="number"
                            tick={{fill: theme.fgc.text.secondary, fontSize: 11}}
                            stroke={theme.fgc.border.subtle}
                            domain={[minPayoff - 250, maxPayoff + 250]}
                            tickFormatter={(value) => Number(value).toFixed(0)}
                        />
                        <YAxis dataKey="likelihood" tick={{fill: theme.fgc.text.secondary, fontSize: 12}} stroke={theme.fgc.border.subtle} unit="%" />
                        <ReferenceLine
                            x={ev}
                            stroke={theme.fgc.feedback.info}
                            strokeWidth={2}
                            strokeDasharray="4 3"
                            label={{value: "EV", position: "insideTop", fill: "#ffffff", fontSize: 13, fontWeight: 700, offset: 6}}
                        />
                        <Tooltip
                            contentStyle={{
                                border: `1px solid ${theme.fgc.border.default}`,
                                background: theme.fgc.surface.raised,
                                color: theme.fgc.text.primary,
                                borderRadius: 8,
                            }}
                            itemStyle={{color: theme.fgc.text.primary}}
                            labelStyle={{color: theme.fgc.text.primary}}
                            formatter={(value) => `${Number(value ?? 0).toFixed(3)}%`}
                            labelFormatter={(value, payload) => {
                                const row = payload?.[0]?.payload as {eventLabel?: string; payoff?: number} | undefined;
                                const payoff = row?.payoff ?? Number(value ?? 0);
                                if (row?.eventLabel) {
                                    return `${row.eventLabel} (${payoff.toFixed(0)})`;
                                }
                                return String(payoff.toFixed(0));
                            }}
                        />
                        <Bar dataKey="likelihood">
                            {histogram.map((entry) => (
                                <Cell
                                    key={entry.eventLabel}
                                    fill={
                                        entry.payoff < 0
                                            ? theme.fgc.feedback.error
                                            : entry.payoff === 0
                                                ? theme.fgc.accent.selected
                                                : theme.fgc.accent.parser
                                    }
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
