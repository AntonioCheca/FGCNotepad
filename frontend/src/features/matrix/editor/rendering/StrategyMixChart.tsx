import React from "react";
import {useMode} from "@/src/context/ThemeContext";
import {buildChartPalette} from "./optionColorTags";

interface StrategyMixChartProps {
    title: string;
    data: Array<{label: string; frequency: number}>;
}

export function StrategyMixChart({title, data}: StrategyMixChartProps) {
    const {theme} = useMode();
    const segments = data.filter((item) => item.frequency > 0).sort((a, b) => b.frequency - a.frequency);
    const palette = buildChartPalette(theme, Math.max(segments.length, 5));

    return (
        <div style={{border: `1px solid ${theme.fgc.border.default}`, borderRadius: 10, padding: 10, background: theme.fgc.surface.raised}}>
            <div style={{fontSize: 14, fontWeight: 700, color: theme.fgc.text.secondary, marginBottom: 8}}>{title}</div>
            <div style={{height: 62, border: `1px solid ${theme.fgc.border.default}`, borderRadius: 8, overflow: "hidden", display: "flex", background: theme.fgc.surface.sunken}}>
                {segments.map((segment, index) => {
                    const widthPercent = Math.max(0, Number((segment.frequency * 100).toFixed(2)));
                    return (
                        <div
                            key={segment.label}
                            style={{
                                width: `${widthPercent}%`,
                                background: palette[index],
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                minWidth: widthPercent > 0 ? 2 : 0,
                                padding: widthPercent >= 8 ? "0 4px" : 0,
                                boxSizing: "border-box",
                            }}
                            title={`${segment.label} ${(segment.frequency * 100).toFixed(2)}%`}
                        >
                            {widthPercent >= 8 ? (
                                <span style={{fontSize: 12, color: theme.fgc.text.primary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"}}>
                                    {segment.label} {(segment.frequency * 100).toFixed(1)}%
                                </span>
                            ) : null}
                        </div>
                    );
                })}
            </div>
            <div style={{display: "grid", gridTemplateColumns: "1fr", gap: 6, marginTop: 8}}>
                {segments.slice(0, 5).map((segment, index) => (
                    <div key={segment.label} style={{display: "flex", alignItems: "center", gap: 8, minWidth: 0}}>
                        <span style={{width: 8, height: 8, borderRadius: 999, background: palette[index], flexShrink: 0}} />
                        <span style={{fontSize: 12, color: theme.fgc.text.secondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}>
                            {segment.label} {(segment.frequency * 100).toFixed(1)}%
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
