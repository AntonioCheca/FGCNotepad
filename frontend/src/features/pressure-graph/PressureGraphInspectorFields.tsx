import React from "react";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppFormControl} from "@/src/components/ui/AppFormControl";
import {AppInputLabel} from "@/src/components/ui/AppInputLabel";
import {AppMenuItem} from "@/src/components/ui/AppMenuItem";
import {AppSelect} from "@/src/components/ui/AppSelect";
import {AppTextField} from "@/src/components/ui/AppTextField";
import {OkiMovePicker} from "@/src/components/okis/OkiMovePicker";
import type {PressureEdgeDraft, PressureNodeDraft} from "./pressureGraphDraft";
import {PRESSURE_EDGE_KIND_LABELS, PRESSURE_EDGE_KINDS, PRESSURE_LAYERS, PRESSURE_READ_LABEL_MAX_LENGTH, toPressureEdgeKind, toPressureLayer} from "./pressureGraphTypes";

const FIELD_ROW_SX = {display: "grid", gridTemplateColumns: {xs: "1fr 1fr", sm: "repeat(3, minmax(0, 140px))"}, gap: 1};

export function PressureNodeFields({node, characterId, onChange}: {node: PressureNodeDraft; characterId?: string; onChange: (patch: Partial<PressureNodeDraft>) => void}) {
    return (
        <AppBox sx={{display: "grid", gap: 1}}>
            <AppBox sx={{maxWidth: {md: 420}}}>
                <OkiMovePicker label="Move" value={node.move} characterId={characterId} disabled={!characterId} onChange={(move) => onChange({move})} />
            </AppBox>
            <AppBox sx={FIELD_ROW_SX}>
                <LayerSelect value={node.layer} onChange={(layer) => onChange({layer})} />
                <AppTextField size="small" margin="none" label="Damage dealt" value={node.damageDealt} slotProps={{htmlInput: {inputMode: "numeric"}}} onChange={(event) => onChange({damageDealt: event.target.value})} />
                <AppTextField size="small" margin="none" label="Damage taken" value={node.damageReceived} slotProps={{htmlInput: {inputMode: "numeric"}}} onChange={(event) => onChange({damageReceived: event.target.value})} />
            </AppBox>
        </AppBox>
    );
}

interface PressureNodeActionsProps {
    nodeId: string;
    connectTargets: Array<{id: string; label: string}>;
    canRemove: boolean;
    onAddNext: () => void;
    onConnect: (targetId: string) => void;
    onRemove: () => void;
}

export function PressureNodeActions({nodeId, connectTargets, canRemove, onAddNext, onConnect, onRemove}: PressureNodeActionsProps) {
    const labelId = React.useId();

    return (
        <AppBox sx={{display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center"}}>
            <AppButton type="button" variant="outlined" color="secondary" size="small" onClick={onAddNext}>Add next move</AppButton>
            {connectTargets.length > 0 ? (
                <AppFormControl size="small" sx={{minWidth: 170}}>
                    <AppInputLabel id={labelId}>Connect to</AppInputLabel>
                    {/* Resets to empty after each pick so the same control can add several arrows. */}
                    <AppSelect<string> key={nodeId} labelId={labelId} label="Connect to" value="" onChange={(event) => onConnect(String(event.target.value))}>
                        {connectTargets.map((target) => <AppMenuItem key={target.id} value={target.id}>{target.label}</AppMenuItem>)}
                    </AppSelect>
                </AppFormControl>
            ) : null}
            {canRemove ? <AppButton type="button" variant="text" color="error" size="small" onClick={onRemove}>Remove move</AppButton> : null}
        </AppBox>
    );
}

export function PressureEdgeFields({edge, onChange, onRemove}: {edge: PressureEdgeDraft; onChange: (patch: Partial<PressureEdgeDraft>) => void; onRemove: () => void}) {
    const labelId = React.useId();

    return (
        <AppBox sx={{display: "grid", gap: 1}}>
            <AppBox sx={FIELD_ROW_SX}>
                <AppFormControl size="small">
                    <AppInputLabel id={labelId}>Type</AppInputLabel>
                    <AppSelect<string> labelId={labelId} label="Type" value={edge.kind} onChange={(event) => onChange({kind: toPressureEdgeKind(event.target.value)})}>
                        {PRESSURE_EDGE_KINDS.map((kind) => <AppMenuItem key={kind} value={kind}>{PRESSURE_EDGE_KIND_LABELS[kind]}</AppMenuItem>)}
                    </AppSelect>
                </AppFormControl>
                <LayerSelect value={edge.layer} onChange={(layer) => onChange({layer})} />
            </AppBox>
            {edge.kind === "read" ? (
                <AppTextField size="small" margin="none" label="Read" placeholder="expects mash" value={edge.readLabel} sx={{maxWidth: {md: 300}}} slotProps={{htmlInput: {maxLength: PRESSURE_READ_LABEL_MAX_LENGTH}}} onChange={(event) => onChange({readLabel: event.target.value})} />
            ) : null}
            <AppBox>
                <AppButton type="button" variant="text" color="error" size="small" onClick={onRemove}>Remove arrow</AppButton>
            </AppBox>
        </AppBox>
    );
}

function LayerSelect({value, onChange}: {value: number; onChange: (layer: 1 | 2 | 3) => void}) {
    const labelId = React.useId();

    return (
        <AppFormControl size="small">
            <AppInputLabel id={labelId}>Layer</AppInputLabel>
            <AppSelect<string> labelId={labelId} label="Layer" value={String(value)} onChange={(event) => onChange(toPressureLayer(Number(event.target.value)))}>
                {PRESSURE_LAYERS.map((layer) => <AppMenuItem key={layer} value={String(layer)}>Layer {layer}</AppMenuItem>)}
            </AppSelect>
        </AppFormControl>
    );
}
