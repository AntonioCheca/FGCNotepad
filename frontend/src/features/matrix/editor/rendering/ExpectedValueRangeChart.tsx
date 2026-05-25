import React from "react";
import {Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts";
import {useMode} from "@/src/context/ThemeContext";

interface ExpectedValueRangeChartProps {
    expectedValue: number | null;
    expectedValueHpPercent: number | null;
    histogram: Array<{eventLabel: string; payoff: number; likelihood: number}>;
}

export function ExpectedValueRangeChart({expectedValue, expectedValueHpPercent, histogram}: ExpectedValueRangeChartProps) {
    const {theme} = useMode();
    const ev = expectedValue ?? 0;

    return (
        <div style={{border: `1px solid ${theme.fgc.border.default}`, borderRadius: 10, padding: 10, background: theme.fgc.surface.raised}}>
            <div style={{display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 8}}>
                <div style={{fontSize: 14, fontWeight: 700, color: theme.fgc.text.secondary}}>Expected Value Likelihood</div>
                <div style={{fontSize: 12, color: theme.fgc.text.muted}}>Weighted by equilibrium</div>
            </div>
            <div style={{display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8}}>
                <div style={{fontSize: 30, fontWeight: 700, color: ev >= 0 ? theme.fgc.feedback.success : theme.fgc.feedback.error}}>
                    {ev >= 0 ? "+" : ""}{ev.toFixed(2)}
                </div>
                {expectedValueHpPercent !== null ? (
                    <div style={{fontSize: 13, color: theme.fgc.text.secondary}}>
                        ({expectedValueHpPercent >= 0 ? "+" : ""}{expectedValueHpPercent.toFixed(2)}% HP)
                    </div>
                ) : null}
            </div>
            <div style={{height: 280}}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={histogram} margin={{top: 6, right: 12, left: 2, bottom: 8}}>
                        <CartesianGrid stroke={theme.fgc.border.subtle} strokeDasharray="3 3" />
                        <XAxis dataKey="eventLabel" type="category" tick={{fill: theme.fgc.text.secondary, fontSize: 11}} stroke={theme.fgc.border.subtle} interval={0} angle={-10} textAnchor="end" height={56} />
                        <YAxis dataKey="likelihood" tick={{fill: theme.fgc.text.secondary, fontSize: 12}} stroke={theme.fgc.border.subtle} unit="%" />
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
                            labelFormatter={(value) => String(value)}
                        />
                        <Bar dataKey="likelihood" radius={[8, 8, 0, 0]}>
                            {histogram.map((entry) => (
                                <Cell
                                    key={entry.eventLabel}
                                    fill={
                                        entry.payoff < 0
                                            ? theme.fgc.feedback.error
                                            : entry.payoff === 0
                                                ? theme.fgc.accent.selected
                                                : theme.fgc.accent.warning
                                    }
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div style={{fontSize: 12, color: theme.fgc.text.secondary, marginTop: 4}}>
                EV marker: {ev.toFixed(1)}
            </div>
        </div>
    );
}
