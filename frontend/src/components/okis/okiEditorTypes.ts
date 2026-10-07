import {moveLabel, moveSubtitle} from "@/src/features/pressure-graph/pressureGraphTypes";
import type {PressureEdgeKind, PressureGraphData, PressureGraphEdge, PressureGraphNode} from "@/src/features/pressure-graph/pressureGraphTypes";
import type {OkiAction, OkiHitLevel, OkiMoveRef, OkiProfileDetail, OkiProfilePayload, OkiRecovery, OkiSetup, OkiStepType} from "@/src/types/oki";
import type {OkiMoveOption} from "./OkiMovePicker";
import {isJumpingAttack, OKI_ACTION_LABELS, okiLinkMarkers, okiNodeMarkers, okiStepCaption} from "./okiVocabulary";

export type OkiNodeChoice = {kind: "move"; move: OkiMoveOption} | {kind: "action"; action: OkiAction};

export interface OkiNodeDraft {
    clientId: string;
    choice: OkiNodeChoice;
    hitLevel: OkiHitLevel | null;
    sideSwitch: boolean;
}

export interface OkiLinkDraft {
    clientId: string;
    from: string;
    to: string;
    stepType: OkiStepType;
    kind: PressureEdgeKind;
    readLabel: string;
    safeJump: boolean;
    recovery: OkiRecovery | null;
}

export interface OkiSetupDraft {
    id?: number;
    name: string;
    cornerOnly: boolean;
    backrollDependent: boolean;
    nodes: OkiNodeDraft[];
    links: OkiLinkDraft[];
}

export interface OkiProfileDraft {
    characterId: string;
    move: OkiMoveOption | null;
    setups: OkiSetupDraft[];
}

// The ender is the graph's root but not a stored node: it is the profile's move, and links from it are sent as "ender".
export const OKI_ENDER_NODE_ID = "ender";

export function createEmptySetup(name = ""): OkiSetupDraft {
    return {name, cornerOnly: false, backrollDependent: false, nodes: [], links: []};
}

export function createLink(clientId: string, from: string, to: string): OkiLinkDraft {
    return {clientId, from, to, stepType: "IMMEDIATE", kind: "normal", readLabel: "", safeJump: false, recovery: null};
}

export function okiTitle(ender: OkiMoveRef): string {
    return `${ender.character.name} — ${moveLabel(ender)}`;
}

export function toMoveOption(move: OkiMoveRef): OkiMoveOption {
    return {id: move.id, summary: move.name, numpadNotation: move.numpadNotation, commonName: move.commonName, moveName: move.moveName, moveType: move.moveType, characterId: move.character.id};
}

export function allowsSafeJump(choice: OkiNodeChoice | undefined): boolean {
    return choice?.kind === "move" && isJumpingAttack(choice.move.numpadNotation);
}

// Medals a link may only carry in context are dropped here, so stale values never render or save after the target or setup changes.
function effectiveLink(setup: OkiSetupDraft, link: OkiLinkDraft): Pick<OkiLinkDraft, "safeJump" | "recovery"> {
    const target = setup.nodes.find((node) => node.clientId === link.to);

    return {safeJump: allowsSafeJump(target?.choice) && link.safeJump, recovery: setup.backrollDependent ? link.recovery : null};
}

export function choiceLabel(choice: OkiNodeChoice): string {
    return choice.kind === "action" ? OKI_ACTION_LABELS[choice.action] : moveLabel(choice.move);
}

interface OkiGraphNodeInput {
    id: string;
    choice: OkiNodeChoice;
    hitLevel: OkiHitLevel | null;
    sideSwitch: boolean;
}

interface OkiGraphLinkInput {
    id: string;
    from: string;
    to: string;
    stepType: OkiStepType;
    kind: PressureEdgeKind;
    readLabel: string | null;
    safeJump: boolean;
    recovery: OkiRecovery | null;
}

interface OkiEnderText {
    label: string;
    subtitle: string | null;
}

export function enderText(ender: Parameters<typeof moveLabel>[0]): OkiEnderText {
    return {label: moveLabel(ender), subtitle: moveSubtitle(ender)};
}

function buildOkiGraph(nodes: OkiGraphNodeInput[], links: OkiGraphLinkInput[], ender: OkiEnderText): PressureGraphData {
    const enderNode: PressureGraphNode = {id: OKI_ENDER_NODE_ID, ...ender, anchor: true};

    return {
        nodes: [
            enderNode,
            ...nodes.map((node) => ({
                id: node.id,
                label: choiceLabel(node.choice),
                subtitle: node.choice.kind === "move" ? moveSubtitle(node.choice.move) : null,
                markers: okiNodeMarkers(node),
            })),
        ],
        edges: links.map((link): PressureGraphEdge => ({
            id: link.id,
            from: link.from,
            to: link.to,
            kind: link.kind,
            readLabel: link.kind === "read" ? link.readLabel : null,
            caption: okiStepCaption(link.stepType),
            markers: okiLinkMarkers(link),
        })),
    };
}

export function okiDraftToGraph(setup: OkiSetupDraft, ender: OkiEnderText): PressureGraphData {
    return buildOkiGraph(
        setup.nodes.map((node) => ({...node, id: node.clientId})),
        setup.links.map((link) => ({...link, ...effectiveLink(setup, link), id: link.clientId, readLabel: link.readLabel.trim() || null})),
        ender,
    );
}

function nodeChoice(node: OkiSetup["nodes"][number]): OkiNodeChoice {
    if (node.action) {
        return {kind: "action", action: node.action};
    }
    if (!node.move) {
        throw new Error(`Oki node ${node.id} has neither a move nor an action.`);
    }

    return {kind: "move", move: toMoveOption(node.move)};
}

function nodeClientId(nodeId: number | null): string {
    return nodeId === null ? OKI_ENDER_NODE_ID : String(nodeId);
}

export function okiSetupToGraph(setup: OkiSetup, ender: OkiMoveRef): PressureGraphData {
    return buildOkiGraph(
        setup.nodes.map((node) => ({id: String(node.id), choice: nodeChoice(node), hitLevel: node.hitLevel, sideSwitch: node.sideSwitch})),
        setup.links.map((link) => ({...link, id: String(link.id), from: nodeClientId(link.fromNodeId), to: String(link.toNodeId)})),
        enderText(ender),
    );
}

export function mapDetailToDraft(detail: OkiProfileDetail): OkiProfileDraft {
    return {
        characterId: detail.move.character.id,
        move: toMoveOption(detail.move),
        setups: detail.setups.flatMap((setup) => setup.canEdit ? [mapSetupToDraft(setup)] : []),
    };
}

function mapSetupToDraft(setup: OkiSetup): OkiSetupDraft {
    return {
        id: setup.id,
        name: setup.name,
        cornerOnly: setup.cornerOnly,
        backrollDependent: setup.backrollDependent,
        nodes: setup.nodes.map((node) => ({clientId: String(node.id), choice: nodeChoice(node), hitLevel: node.hitLevel, sideSwitch: node.sideSwitch})),
        links: setup.links.map((link) => ({
            clientId: `l${link.id}`,
            from: nodeClientId(link.fromNodeId),
            to: String(link.toNodeId),
            stepType: link.stepType,
            kind: link.kind,
            readLabel: link.readLabel ?? "",
            safeJump: link.safeJump,
            recovery: link.recovery,
        })),
    };
}

export function buildOkiPayload(draft: OkiProfileDraft): OkiProfilePayload {
    if (!draft.move) {
        throw new Error("Pick the ender.");
    }
    if (draft.setups.some((setup) => setup.name.trim() === "")) {
        throw new Error("Every setup needs a name.");
    }

    return {
        moveId: draft.move.id,
        setups: draft.setups.map((setup) => ({
            ...(setup.id === undefined ? {} : {id: setup.id}),
            name: setup.name.trim(),
            cornerOnly: setup.cornerOnly,
            backrollDependent: setup.backrollDependent,
            nodes: setup.nodes.map((node, index) => ({
                clientId: node.clientId,
                ...(node.choice.kind === "move" ? {moveId: node.choice.move.id} : {action: node.choice.action}),
                sortOrder: index,
                hitLevel: node.hitLevel,
                sideSwitch: node.sideSwitch,
            })),
            links: setup.links.map((link) => ({
                fromClientId: link.from,
                toClientId: link.to,
                stepType: link.stepType,
                kind: link.kind,
                readLabel: link.kind === "read" ? link.readLabel.trim() || null : null,
                ...effectiveLink(setup, link),
            })),
        })),
    };
}
