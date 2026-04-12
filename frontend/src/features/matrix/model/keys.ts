export function createBodyCellKey(rowId: string, columnId: string): string {
    return `body::${rowId}::${columnId}`;
}

export function createRowSummaryKey(rowId: string): string {
    return `row-summary::${rowId}`;
}

export function createColumnSummaryKey(columnId: string): string {
    return `column-summary::${columnId}`;
}

export function createExpectedValueKey(): string {
    return "expected-value";
}

export function isBodyCellKey(key: string): boolean {
    return key.startsWith("body::");
}

export function isRowSummaryKey(key: string): boolean {
    return key.startsWith("row-summary::");
}

export function isColumnSummaryKey(key: string): boolean {
    return key.startsWith("column-summary::");
}
