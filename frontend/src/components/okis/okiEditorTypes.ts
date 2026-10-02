import {formatDamage, parseDamage} from "@/src/features/pressure-graph/pressureGraphDraft";
import type {PressureEdgeDraft, PressureNodeDraft} from "@/src/features/pressure-graph/pressureGraphDraft";
import {toPressureLayer} from "@/src/features/pressure-graph/pressureGraphTypes";
import type {PressureGraphData, PressureGraphNode} from "@/src/features/pressure-graph/pressureGraphTypes";
import type {OkiInteractionResult, OkiMoveRef, OkiNodeProperty, OkiOptionType, OkiProfileDetail, OkiProfilePayload, OkiSetup, OkiStepType} from "@/src/types/oki";
import type {OkiMoveOption} from "./OkiMovePicker";

export interface OkiInteractionDraft {
    defensiveMove: OkiMoveOption | null;
    result: OkiInteractionResult;
    characterId: string;
}

export interface OkiNodeDraft extends PressureNodeDraft {
    isDefaultRoute: boolean;
    routeExplanation: string;
    optionType: OkiOptionType | "";
    properties: OkiNodeProperty[];
    interactions: OkiInteractionDraft[];
}

export interface OkiLinkDraft extends PressureEdgeDraft {
    stepType: OkiStepType;
    minFrames: string;
    maxFrames: string;
}

export interface OkiSetupDraft {
    id?: number;
    usesDriveRush: boolean;
    autoTimed: boolean;
    cornerOnly: boolean;
    worksNoBackroll: boolean;
    worksBackroll: boolean;
    fakeNoBackroll: boolean;
    fakeBackroll: boolean;
    nodes: OkiNodeDraft[];
    links: OkiLinkDraft[];
}

export interface OkiProfileDraft {
    move: OkiMoveOption | null;
    frameAdvantage: number | null;
    setups: OkiSetupDraft[];
}

// The ender is drawn as the graph's root but is not a stored node: it is the profile's move itself.
export const OKI_ENDER_NODE_ID = "ender";

export function createEmptySetup(): OkiSetupDraft {
    return {
        usesDriveRush: false,
        autoTimed: true,
        cornerOnly: false,
        worksNoBackroll: true,
        worksBackroll: true,
        fakeNoBackroll: false,
        fakeBackroll: false,
        nodes: [createEmptyNode("n1", true)],
        links: [],
    };
}

export function createEmptyNode(clientId: string, defaultRoute = false): OkiNodeDraft {
    return {clientId, move: null, layer: 1, damageDealt: "", damageReceived: "", isDefaultRoute: defaultRoute, routeExplanation: "", optionType: "", properties: [], interactions: []};
}

export function createEmptyLink(clientId: string, from: string, to: string): OkiLinkDraft {
    return {clientId, from, to, kind: "normal", readLabel: "", layer: 1, stepType: "IMMEDIATE", minFrames: "", maxFrames: ""};
}

function toMoveOption(move: OkiMoveRef): OkiMoveOption {
    return {id: move.id, summary: move.name, numpadNotation: move.numpadNotation, moveName: move.moveName, characterId: move.character.id};
}

export function mapDetailToDraft(detail: OkiProfileDetail): OkiProfileDraft {
    return {
        move: toMoveOption(detail.move),
        frameAdvantage: detail.frameAdvantage,
        setups: detail.setups.flatMap((setup) => setup.canEdit ? [mapSetupToDraft(setup)] : []),
    };
}

function mapSetupToDraft(setup: OkiSetup): OkiSetupDraft {
    const clientIdByNodeId = new Map<number, string>();
    const nodes = setup.nodes.map((node, nodeIndex) => {
        const clientId = `n${nodeIndex + 1}`;
        clientIdByNodeId.set(node.id, clientId);
        return {
            clientId,
            move: toMoveOption(node.move),
            layer: toPressureLayer(node.layer),
            damageDealt: formatDamage(node.damageDealt),
            damageReceived: formatDamage(node.damageReceived),
            isDefaultRoute: node.isDefaultRoute,
            routeExplanation: node.routeExplanation ?? "",
            optionType: node.optionType ?? "" as OkiOptionType | "",
            properties: node.properties,
            interactions: node.interactions.map((interaction) => ({
                defensiveMove: toMoveOption(interaction.defensiveMove),
                result: interaction.result,
                characterId: interaction.character?.id ?? "",
            })),
        };
    });

    const links: OkiLinkDraft[] = [];
    for (const link of setup.links) {
        const from = clientIdByNodeId.get(link.fromNodeId);
        const to = clientIdByNodeId.get(link.toNodeId);
        if (!from || !to) {
            continue;
        }
        links.push({
            clientId: `l${links.length + 1}`,
            from,
            to,
            kind: link.kind,
            readLabel: link.readLabel ?? "",
            layer: toPressureLayer(link.layer),
            stepType: link.stepType,
            minFrames: link.minFrames === null ? "" : String(link.minFrames),
            maxFrames: link.maxFrames === null ? "" : String(link.maxFrames),
        });
    }

    return {
        id: setup.id,
        usesDriveRush: setup.usesDriveRush,
        autoTimed: setup.autoTimed,
        cornerOnly: setup.cornerOnly,
        worksNoBackroll: setup.worksNoBackroll,
        worksBackroll: setup.worksBackroll,
        fakeNoBackroll: setup.fakeNoBackroll,
        fakeBackroll: setup.fakeBackroll,
        nodes,
        links,
    };
}

export function buildOkiPayload(draft: OkiProfileDraft): OkiProfilePayload {
    if (!draft.move) {
        throw new Error("Ender move is required.");
    }
    return {
        moveId: draft.move.id,
        setups: draft.setups.map((setup) => ({
            ...(setup.id === undefined ? {} : {id: setup.id}),
            usesDriveRush: setup.usesDriveRush,
            autoTimed: setup.autoTimed,
            cornerOnly: setup.cornerOnly,
            worksNoBackroll: setup.worksNoBackroll,
            worksBackroll: setup.worksBackroll,
            fakeNoBackroll: setup.fakeNoBackroll,
            fakeBackroll: setup.fakeBackroll,
            nodes: setup.nodes.map((node, index) => {
                if (!node.move) {
                    throw new Error("Every node needs a move.");
                }
                return {
                    clientId: node.clientId,
                    moveId: node.move.id,
                    sortOrder: index,
                    isDefaultRoute: node.isDefaultRoute,
                    routeExplanation: node.routeExplanation.trim() || null,
                    optionType: node.optionType || null,
                    properties: node.properties,
                    layer: node.layer,
                    damageDealt: parseDamage(node.damageDealt),
                    damageReceived: parseDamage(node.damageReceived),
                    interactions: node.interactions.map((interaction) => {
                        if (!interaction.defensiveMove) {
                            throw new Error("Every interaction needs a defensive move.");
                        }
                        return {
                            defensiveMoveId: interaction.defensiveMove.id,
                            result: interaction.result,
                            characterId: interaction.characterId || null,
                        };
                    }),
                };
            }),
            links: setup.links.map((link) => ({
                fromClientId: link.from,
                toClientId: link.to,
                stepType: link.stepType,
                minFrames: link.stepType === "IMMEDIATE" || link.minFrames === "" ? null : Number.parseInt(link.minFrames, 10),
                maxFrames: link.stepType === "IMMEDIATE" || link.maxFrames === "" ? null : Number.parseInt(link.maxFrames, 10),
                kind: link.kind,
                readLabel: link.kind === "read" ? link.readLabel.trim() || null : null,
                layer: link.layer,
            })),
        })),
    };
}

// Prepends the ender as the root and links it to every node nothing else points at.
export function withEnderRoot(graph: PressureGraphData, ender: {notation: string; name: string | null}): PressureGraphData {
    const targets = new Set(graph.edges.map((edge) => edge.to));
    const roots = graph.nodes.filter((node) => !targets.has(node.id));
    const enderNode: PressureGraphNode = {id: OKI_ENDER_NODE_ID, notation: ender.notation, name: ender.name, layer: 1, damageDealt: null, damageReceived: null};

    return {
        nodes: [enderNode, ...graph.nodes],
        edges: [
            ...roots.map((root) => ({id: `${OKI_ENDER_NODE_ID}-${root.id}`, from: OKI_ENDER_NODE_ID, to: root.id, kind: "normal" as const, readLabel: null, layer: root.layer})),
            ...graph.edges,
        ],
    };
}

export function okiSetupToGraph(setup: OkiSetup, ender: OkiMoveRef): PressureGraphData {
    return withEnderRoot({
        nodes: setup.nodes.map((node) => ({
            id: String(node.id),
            notation: node.move.numpadNotation,
            name: node.move.moveName,
            layer: toPressureLayer(node.layer),
            damageDealt: node.damageDealt,
            damageReceived: node.damageReceived,
        })),
        edges: setup.links.map((link) => ({
            id: String(link.id),
            from: String(link.fromNodeId),
            to: String(link.toNodeId),
            kind: link.kind,
            readLabel: link.readLabel,
            layer: toPressureLayer(link.layer),
        })),
    }, {notation: ender.numpadNotation, name: ender.moveName});
}
