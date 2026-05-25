import React from "react";
import {Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts";
import {useMode} from "@/src/context/ThemeContext";

interface PayoffDistributionChartProps {
    outcomes: Array<{label: string; probability: number}>;
}

export function PayoffDistributionChart({outcomes}: PayoffDistributionChartProps) {
    const {theme} = useMode();

    return (
        <div style={{border: `1px solid ${theme.fgc.border.default}`, borderRadius: 10, padding: 10, background: theme.fgc.surface.raised}}>
            <div style={{fontSize: 12, fontWeight: 700, color: theme.fgc.text.secondary, marginBottom: 8}}>Realized Outcome Profile</div>
            <div style={{height: 220}}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={outcomes} margin={{top: 2, right: 8, left: 8, bottom: 2}}>
                        <CartesianGrid stroke={theme.fgc.border.subtle} strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="label" tick={{fill: theme.fgc.text.secondary, fontSize: 11}} stroke={theme.fgc.border.subtle} interval={0} angle={-10} textAnchor="end" height={54} />
                        <YAxis tick={{fill: theme.fgc.text.secondary, fontSize: 11}} stroke={theme.fgc.border.subtle} unit="%" />
                        <Tooltip
                            contentStyle={{
                                border: `1px solid ${theme.fgc.border.default}`,
                                background: theme.fgc.surface.raised,
                                color: theme.fgc.text.primary,
                                borderRadius: 8,
                            }}
                            formatter={(value) => `${Number(value ?? 0).toFixed(2)}%`}
                        />
                        <Bar dataKey="probability" fill={theme.fgc.accent.selected} radius={[8, 8, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
