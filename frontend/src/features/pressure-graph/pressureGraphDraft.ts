// Editing helpers shared by the oki and blockstring graph editors.
export type PressureSelection = {type: "node" | "edge"; id: string} | null;

export function nextClientId(prefix: string, taken: Iterable<string>): string {
    const used = new Set(taken);
    let index = 1;
    while (used.has(`${prefix}${index}`)) {
        index += 1;
    }

    return `${prefix}${index}`;
}

export function hasEdge(edges: Array<{from: string; to: string}>, from: string, to: string): boolean {
    return edges.some((edge) => edge.from === from && edge.to === to);
}

export function removeNodeAndEdges<N extends {clientId: string}, E extends {from: string; to: string}>(nodes: N[], edges: E[], clientId: string): {nodes: N[]; edges: E[]} {
    return {
        nodes: nodes.filter((node) => node.clientId !== clientId),
        edges: edges.filter((edge) => edge.from !== clientId && edge.to !== clientId),
    };
}
