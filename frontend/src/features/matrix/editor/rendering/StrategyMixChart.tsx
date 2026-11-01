import React from "react";
import {useMode} from "@/src/context/ThemeContext";
import {readableTextOn} from "@/src/components/ui/AppThemeUtils";
import type {MatrixMixDatum} from "../services/matrixInsightService";
import {buildChartPalette} from "./optionColorTags";

interface StrategyMixChartProps {
    title: string;
    data: MatrixMixDatum[];
}

function formatShare(value: number | null): string {
    return value === null ? "–" : `${Math.round(value * 100)}%`;
}

function MixBar({label, options, share, palette}: {label: string; options: MatrixMixDatum[]; share: (option: MatrixMixDatum) => number; palette: string[]}) {
    const {theme} = useMode();

    return (
        <div style={{display: "grid", gap: 3}}>
            <span style={{fontSize: 12, fontWeight: 600, color: theme.fgc.text.secondary}}>{label}</span>
            <div style={{height: 28, border: `1px solid ${theme.fgc.border.default}`, borderRadius: 6, overflow: "hidden", display: "flex", background: theme.fgc.surface.sunken}}>
                {options.map((option) => {
                    const widthPercent = Math.max(0, share(option) * 100);
                    const color = palette[option.colorIndex % palette.length];
                    return widthPercent > 0 ? (
                        <div
                            key={option.id}
                            title={`${option.label} ${formatShare(share(option))}`}
                            style={{width: `${widthPercent}%`, minWidth: 2, background: color, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden"}}
                        >
                            {widthPercent >= 10 ? (
                                <span style={{fontSize: 12, fontWeight: 600, color: readableTextOn(color, theme.palette.common.white, theme.fgc.app.canvas)}}>{formatShare(share(option))}</span>
                            ) : null}
                        </div>
                    ) : null;
                })}
            </div>
        </div>
    );
}

// Nash equilibrium mix next to the mix seen in replays: one color per option in both bars, in the same order.
export function StrategyMixChart({title, data}: StrategyMixChartProps) {
    const {theme} = useMode();
    const options = data.filter((option) => option.frequency > 0 || (option.seen ?? 0) > 0);
    const palette = buildChartPalette(theme, Math.max(data.length, 5));
    const hasSeen = data.some((option) => option.seen !== null);
    const solved = data.some((option) => option.frequency > 0);
    const sampleCounts = data.map((option) => option.seenSampleCount).filter((count): count is number => count !== null);
    const seenLabel = sampleCounts.length > 0 ? `Seen (n=${Math.max(...sampleCounts)})` : "Seen";
    const cell = {fontSize: 12, color: theme.fgc.text.secondary, textAlign: "right" as const, fontVariantNumeric: "tabular-nums" as const};

    return (
        <div data-chart="strategy-mix" style={{boxSizing: "border-box", height: "100%", border: `1px solid ${theme.fgc.border.default}`, borderRadius: 10, padding: 10, background: theme.fgc.surface.raised}}>
            <div style={{fontSize: 14, fontWeight: 700, color: theme.fgc.text.secondary, marginBottom: 8}}>{title}</div>
            <div style={{display: "grid", gap: 8}}>
                <MixBar label="Nash Equilibrium" options={options} share={(option) => option.frequency} palette={palette}/>
                {hasSeen ? <MixBar label={seenLabel} options={options} share={(option) => option.seen ?? 0} palette={palette}/> : null}
            </div>
            {options.length > 0 ? (
                <div style={{display: "grid", gridTemplateColumns: hasSeen ? "minmax(0, 1fr) auto auto" : "minmax(0, 1fr) auto", columnGap: 16, rowGap: 6, marginTop: 10, alignItems: "center"}}>
                    {hasSeen ? (
                        <>
                            <span/>
                            <span style={{...cell, fontWeight: 600}}>Nash Equilibrium</span>
                            <span style={{...cell, fontWeight: 600}}>Seen</span>
                        </>
                    ) : null}
                    {options.map((option) => (
                        <React.Fragment key={option.id}>
                            <span style={{display: "flex", alignItems: "center", gap: 8, minWidth: 0}}>
                                <span style={{width: 8, height: 8, borderRadius: 999, background: palette[option.colorIndex % palette.length], flexShrink: 0}}/>
                                <span style={{fontSize: 12, color: theme.fgc.text.primary, overflowWrap: "anywhere"}}>{option.label}</span>
                            </span>
                            <span style={cell}>{solved ? formatShare(option.frequency) : "–"}</span>
                            {hasSeen ? <span style={cell}>{formatShare(option.seen)}</span> : null}
                        </React.Fragment>
                    ))}
                </div>
            ) : null}
        </div>
    );
}
