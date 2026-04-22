export function extractMoveDamage(move: unknown): number | null {
    if (!move || typeof move !== "object") {
        return null;
    }

    const record = move as Record<string, unknown>;
    const summary = record.summary_frame_data;
    if (summary && typeof summary === "object" && !Array.isArray(summary)) {
        const damage = (summary as Record<string, unknown>).damage;
        if (typeof damage === "number" && Number.isFinite(damage)) {
            return damage;
        }
        if (typeof damage === "string") {
            const parsed = Number(damage.trim());
            if (Number.isFinite(parsed)) {
                return parsed;
            }
        }
    }

    const full = record.full_frame_data;
    if (full && typeof full === "object" && !Array.isArray(full)) {
        const damage = (full as Record<string, unknown>).damage;
        if (typeof damage === "number" && Number.isFinite(damage)) {
            return damage;
        }
        if (typeof damage === "string") {
            const parsed = Number(damage.trim());
            if (Number.isFinite(parsed)) {
                return parsed;
            }
        }
    }

    return null;
}

export function buildMoveDisplayLabel(moveId: string, move: unknown): string {
    if (!move || typeof move !== "object") {
        return `Move #${moveId}`;
    }

    const record = move as Record<string, unknown>;
    const notation = typeof record.numpad_notation === "string" ? record.numpad_notation : null;
    const character = typeof record.character === "string" ? record.character : null;

    if (!notation) {
        return `Move #${moveId}`;
    }

    return `${character ? `${character} ` : ""}${notation}`;
}
