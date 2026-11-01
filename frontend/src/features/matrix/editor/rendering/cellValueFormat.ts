import type {MatrixCellKind, MatrixLinkedCellResolution, MatrixReferencePerspective} from "@/src/features/matrix/model";

// Combo and linked values are estimates, so they read as whole damage; typed values only lose float noise.
export function formatCellNumber(value: number, kind: MatrixCellKind | undefined): string {
    return String(kind === "dynamic_combo" || kind === "reference" ? Math.round(value) : Number(value.toFixed(2)));
}

export function formatReferenceWeight(weight: number | undefined): string | null {
    return weight === undefined || weight === 1 ? null : `${Math.round(weight * 100)}%`;
}

// A linked cell's total is its direct damage plus (or, for the opponent's scenario, minus) its share of the linked EV.
export function formatLinkedBreakdown(resolution: MatrixLinkedCellResolution): string {
    const weight = formatReferenceWeight(resolution.weight);
    const opponent = resolution.perspective === "opponent";
    return `${Math.round(resolution.basePreValue)} damage ${opponent ? "−" : "+"} ${weight ? `${weight} × ` : ""}${Math.round(resolution.linkedExpectedValue)} ${opponent ? "opponent " : ""}EV mix`;
}

// Names the linked scenario, e.g. "2040 + 62% × Juri throw oki vs Ken (corner)".
export function formatLinkedFormula(basePreValue: number | null, weight: number | undefined, scenarioLabel: string, perspective?: MatrixReferencePerspective): string {
    const share = formatReferenceWeight(weight);
    const sign = perspective === "opponent" ? "−" : "+";
    const base = basePreValue === null ? (perspective === "opponent" ? "− " : "") : `${Math.round(basePreValue)} ${sign} `;
    return `${base}${share ? `${share} × ` : ""}${scenarioLabel}`;
}
