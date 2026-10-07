import React from "react";
import {AppBox} from "@/src/components/ui/AppBox";
import {PressureEdgeKindFields, PressureInspectorRow, PressureRemoveButton, PressureSegmented} from "@/src/features/pressure-graph/PressureGraphInspectorFields";
import type {OkiHitLevel, OkiRecovery, OkiStepType} from "@/src/types/oki";
import {OkiActionPicker} from "./OkiActionPicker";
import type {OkiLinkDraft, OkiNodeChoice, OkiNodeDraft} from "./okiEditorTypes";
import {OKI_EDGE_KINDS, OKI_STEP_LABELS, OKI_STEP_TYPES} from "./okiVocabulary";

const NONE = "none";

interface OkiNodeInspectorProps {
    node: OkiNodeDraft;
    characterId: string;
    onChoiceChange: (choice: OkiNodeChoice) => void;
    onChange: (patch: Partial<OkiNodeDraft>) => void;
    onRemove: () => void;
}

export function OkiNodeInspector({node, characterId, onChoiceChange, onChange, onRemove}: OkiNodeInspectorProps) {
    return (
        <>
            <AppBox sx={{maxWidth: {md: 420}}}>
                <OkiActionPicker characterId={characterId} value={node.choice} onChange={onChoiceChange} />
            </AppBox>
            <PressureInspectorRow>
                <PressureSegmented<OkiHitLevel | typeof NONE>
                    label="Height"
                    value={node.hitLevel ?? NONE}
                    options={[[NONE, "Mid"], ["LOW", "Low"], ["OVERHEAD", "Overhead"]]}
                    onChange={(value) => onChange({hitLevel: value === NONE ? null : value})}
                />
                <PressureSegmented<"yes" | typeof NONE>
                    label="Side switch"
                    value={node.sideSwitch ? "yes" : NONE}
                    options={[[NONE, "No"], ["yes", "Yes"]]}
                    onChange={(value) => onChange({sideSwitch: value === "yes"})}
                />
            </PressureInspectorRow>
            <PressureRemoveButton label="Remove step" onClick={onRemove} />
        </>
    );
}

interface OkiLinkInspectorProps {
    link: OkiLinkDraft;
    backrollDependent: boolean;
    safeJumpAllowed: boolean;
    onChange: (patch: Partial<OkiLinkDraft>) => void;
    onRemove: () => void;
}

export function OkiLinkInspector({link, backrollDependent, safeJumpAllowed, onChange, onRemove}: OkiLinkInspectorProps) {
    return (
        <>
            <PressureEdgeKindFields kinds={OKI_EDGE_KINDS} kind={link.kind} readLabel={link.readLabel} onChange={onChange} />
            <PressureInspectorRow>
                <PressureSegmented<OkiStepType>
                    label="Timing"
                    value={link.stepType}
                    options={OKI_STEP_TYPES.map((stepType) => [stepType, OKI_STEP_LABELS[stepType]])}
                    onChange={(stepType) => onChange({stepType})}
                />
                {safeJumpAllowed ? (
                    <PressureSegmented<"yes" | typeof NONE>
                        label="Safe jump"
                        value={link.safeJump ? "yes" : NONE}
                        options={[[NONE, "No"], ["yes", "Yes"]]}
                        onChange={(value) => onChange({safeJump: value === "yes"})}
                    />
                ) : null}
                {backrollDependent ? (
                    <PressureSegmented<OkiRecovery | typeof NONE>
                        label="Only vs"
                        value={link.recovery ?? NONE}
                        options={[[NONE, "Any"], ["BACKROLL", "Backroll"], ["RISE_IN_PLACE", "Rise in place"]]}
                        onChange={(value) => onChange({recovery: value === NONE ? null : value})}
                    />
                ) : null}
            </PressureInspectorRow>
            <PressureRemoveButton label="Remove arrow" onClick={onRemove} />
        </>
    );
}
