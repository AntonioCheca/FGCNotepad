import React from "react";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppTextField} from "@/src/components/ui/AppTextField";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {CharacterResource} from "@/src/types/characterResource";
import {FrameDataModerationMove, MoveResourceEffect} from "@/src/types/frameDataModeration";

interface MoveResourceEffectsSectionProps {
    moves: FrameDataModerationMove[];
    resources: CharacterResource[];
    pendingMoveId: string | null;
    onSave: (move: FrameDataModerationMove, effects: Array<{resourceId: number; mode: "relative" | "set"; amount: number}>) => void;
}

function formatEffect(effect: MoveResourceEffect | undefined): string {
    if (!effect) {
        return "";
    }

    return effect.mode === "set" ? `=${effect.amount}` : effect.amount > 0 ? `+${effect.amount}` : String(effect.amount);
}

function parseEffect(text: string): {mode: "relative" | "set"; amount: number} | null | "invalid" {
    const trimmed = text.trim();
    if (trimmed === "") {
        return null;
    }

    const match = /^(=|\+|-)?\s*(\d+)$/.exec(trimmed);
    if (!match) {
        return "invalid";
    }

    const amount = Number(match[2]);
    if (match[1] === "=") {
        return {mode: "set", amount};
    }

    return amount === 0 ? null : {mode: "relative", amount: match[1] === "-" ? -amount : amount};
}

export function MoveResourceEffectsSection({moves, resources, pendingMoveId, onSave}: MoveResourceEffectsSectionProps) {
    const [drafts, setDrafts] = React.useState<Record<string, string>>({});
    const [invalidKey, setInvalidKey] = React.useState<string | null>(null);

    const draftFor = (move: FrameDataModerationMove, resource: CharacterResource): string => {
        const key = `${move.moveId}:${resource.id}`;
        return key in drafts ? drafts[key] : formatEffect(move.resourceEffects?.find((effect) => effect.resourceId === resource.id));
    };

    const commit = (move: FrameDataModerationMove, resource: CharacterResource) => {
        const key = `${move.moveId}:${resource.id}`;
        if (!(key in drafts)) {
            return;
        }

        const parsed = parseEffect(drafts[key]);
        if (parsed === "invalid") {
            setInvalidKey(key);
            return;
        }

        setInvalidKey(null);
        const effects = resources.flatMap((candidate) => {
            const next = candidate.id === resource.id ? parsed : parseEffect(draftFor(move, candidate));
            return next && next !== "invalid" ? [{resourceId: candidate.id, ...next}] : [];
        });
        onSave(move, effects);
        setDrafts((current) => {
            const {[key]: _removed, ...rest} = current;
            return rest;
        });
    };

    return (
        <AppBox sx={{display: "grid", gap: 1}}>
            <AppTypography variant="caption" color="text.secondary">+1 gains, -1 spends, =2 sets the value. Empty means no effect.</AppTypography>
            <AppBox sx={{display: "grid", gap: 0.75}}>
                {moves.map((move) => (
                    <AppBox
                        key={move.moveId}
                        sx={{display: "grid", gridTemplateColumns: {xs: "1fr", sm: `minmax(160px, 1fr) repeat(${resources.length}, minmax(96px, 140px))`}, gap: 1, alignItems: "center", border: "1px solid", borderColor: "fgc.border.default", borderRadius: 1.25, px: 1.25, py: 0.75, backgroundColor: "fgc.surface.subtle"}}
                    >
                        <AppTypography variant="body2" sx={{fontWeight: 650}}>{move.numpadNotation}</AppTypography>
                        {resources.map((resource) => {
                            const key = `${move.moveId}:${resource.id}`;
                            const inferred = move.resourceEffects?.find((effect) => effect.resourceId === resource.id)?.source === "inferred";
                            return (
                                <AppTextField
                                    key={resource.id}
                                    size="small"
                                    label={resource.name}
                                    value={draftFor(move, resource)}
                                    disabled={pendingMoveId === move.moveId}
                                    error={invalidKey === key}
                                    helperText={invalidKey === key ? "Use +1, -1 or =2" : inferred ? "Inferred" : " "}
                                    onChange={(event) => setDrafts((current) => ({...current, [key]: event.target.value}))}
                                    onBlur={() => commit(move, resource)}
                                />
                            );
                        })}
                    </AppBox>
                ))}
            </AppBox>
        </AppBox>
    );
}
