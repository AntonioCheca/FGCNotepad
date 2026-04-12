export function parseNullableNumber(input: string): number | null {
    const trimmed = input.trim();
    if (trimmed === "") {
        return null;
    }

    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
}

export function toInputValue(value: number | null): string {
    return value === null ? "" : String(value);
}
