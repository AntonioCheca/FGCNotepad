import type {OkiMoveOption} from "./OkiMovePicker";

interface MoveSearchResult {
    id: string | number;
    summary: string;
    numpadNotation?: string;
    commonName?: string | null;
    moveName?: string | null;
    moveType?: string | null;
    attackLevel?: string | null;
    character?: {id?: string};
}

export function toMoveSearchOptions(result: unknown): OkiMoveOption[] {
    if (!Array.isArray(result)) {
        return [];
    }

    return result
        .filter((item): item is MoveSearchResult => typeof item === "object" && item !== null && "id" in item && "summary" in item)
        .map((item) => ({id: String(item.id), summary: item.summary, characterId: item.character?.id, numpadNotation: item.numpadNotation, commonName: item.commonName ?? null, moveName: item.moveName ?? null, moveType: item.moveType ?? null, attackLevel: item.attackLevel ?? null}));
}

// Pickers are scoped to one character, so the character name is left out: "214MK · MK Tatsu".
export function moveOptionLabel(option: OkiMoveOption): string {
    const notation = option.numpadNotation ?? option.summary;
    const name = option.commonName?.trim() || option.moveName?.trim();

    return name && name !== notation ? `${notation} · ${name}` : notation;
}
