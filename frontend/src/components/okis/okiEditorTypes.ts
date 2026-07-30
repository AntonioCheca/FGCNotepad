import type {OkiInteractionResult, OkiNodeProperty, OkiOptionType, OkiProfileDetail, OkiProfilePayload, OkiStepType} from "@/src/types/oki";
import type {OkiMoveOption} from "./OkiMovePicker";

export interface OkiInteractionDraft {
    defensiveMove: OkiMoveOption | null;
    result: OkiInteractionResult;
    characterId: string;
}

export interface OkiNodeDraft {
    clientId: string;
    move: OkiMoveOption | null;
    isDefaultRoute: boolean;
    routeExplanation: string;
    optionType: OkiOptionType | "";
    properties: OkiNodeProperty[];
    interactions: OkiInteractionDraft[];
}

export interface OkiLinkDraft {
    fromClientId: string;
    toClientId: string;
    stepType: OkiStepType;
    minFrames: string;
    maxFrames: string;
}

export interface OkiTreeNodeDraft extends OkiNodeDraft {
    children: OkiTreeChildDraft[];
}

export interface OkiTreeChildDraft {
    link: OkiLinkDraft;
    node: OkiTreeNodeDraft;
}

export interface OkiSetupDraft {
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

export function createEmptySetup(index: number): OkiSetupDraft {
    return {
        usesDriveRush: false,
        autoTimed: true,
        cornerOnly: false,
        worksNoBackroll: true,
        worksBackroll: true,
        fakeNoBackroll: false,
        fakeBackroll: false,
        nodes: [createEmptyNode(`setup${index}-node1`, true)],
        links: [],
    };
}

export function createEmptyNode(clientId: string, defaultRoute = false): OkiNodeDraft {
    return {clientId, move: null, isDefaultRoute: defaultRoute, routeExplanation: "", optionType: "", properties: [], interactions: []};
}

export function mapDetailToDraft(detail: OkiProfileDetail): OkiProfileDraft {
    return {
        move: {id: detail.move.id, summary: detail.move.name, characterId: detail.move.character.id},
        frameAdvantage: detail.frameAdvantage,
        setups: detail.setups.map((setup, setupIndex) => {
            const clientIdByNodeId = new Map<number, string>();
            const nodes = setup.nodes.map((node, nodeIndex) => {
                const clientId = `setup${setupIndex + 1}-node${nodeIndex + 1}`;
                clientIdByNodeId.set(node.id, clientId);
                return {
                    clientId,
                    move: {id: node.move.id, summary: node.move.name, characterId: node.move.character.id},
                    isDefaultRoute: node.isDefaultRoute,
                    routeExplanation: node.routeExplanation ?? "",
                    optionType: node.optionType ?? "" as OkiOptionType | "",
                    properties: node.properties,
                    interactions: node.interactions.map((interaction) => ({
                        defensiveMove: {id: interaction.defensiveMove.id, summary: interaction.defensiveMove.name, characterId: interaction.defensiveMove.character.id},
                        result: interaction.result,
                        characterId: interaction.character?.id ?? "",
                    })),
                };
            });

            const links = [];
            for (const link of setup.links) {
                const fromClientId = clientIdByNodeId.get(link.fromNodeId) ?? "";
                const toClientId = clientIdByNodeId.get(link.toNodeId) ?? "";
                if (!fromClientId || !toClientId) {
                    continue;
                }
                links.push({
                    fromClientId,
                    toClientId,
                    stepType: link.stepType,
                    minFrames: link.minFrames === null ? "" : String(link.minFrames),
                    maxFrames: link.maxFrames === null ? "" : String(link.maxFrames),
                });
            }

            return {
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
        }),
    };
}

export function buildOkiPayload(draft: OkiProfileDraft): OkiProfilePayload {
    if (!draft.move) {
        throw new Error("Ender move is required.");
    }
    return {
        moveId: draft.move.id,
        setups: draft.setups.map((setup) => ({
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
                fromClientId: link.fromClientId,
                toClientId: link.toClientId,
                stepType: link.stepType,
                minFrames: link.stepType === "IMMEDIATE" || link.minFrames === "" ? null : Number.parseInt(link.minFrames, 10),
                maxFrames: link.stepType === "IMMEDIATE" || link.maxFrames === "" ? null : Number.parseInt(link.maxFrames, 10),
            })),
        })),
    };
}

export function setupToTree(setup: OkiSetupDraft): OkiTreeNodeDraft[] {
    const nodeById = new Map(setup.nodes.map((node) => [node.clientId, node]));
    const childIds = new Set(setup.links.map((link) => link.toClientId));
    const roots = setup.nodes.filter((node) => !childIds.has(node.clientId));

    return (roots.length > 0 ? roots : setup.nodes.slice(0, 1)).map((node) => buildTreeNode(node, setup.links, nodeById, new Set()));
}

function buildTreeNode(node: OkiNodeDraft, links: OkiLinkDraft[], nodeById: Map<string, OkiNodeDraft>, visited: Set<string>): OkiTreeNodeDraft {
    if (visited.has(node.clientId)) {
        return {...node, children: []};
    }

    const nextVisited = new Set(visited);
    nextVisited.add(node.clientId);

    const children = [];
    for (const link of links) {
        if (link.fromClientId !== node.clientId) {
            continue;
        }
        const child = nodeById.get(link.toClientId);
        if (child) {
            children.push({link, node: buildTreeNode(child, links, nodeById, nextVisited)});
        }
    }

    return {
        ...node,
        children,
    };
}
