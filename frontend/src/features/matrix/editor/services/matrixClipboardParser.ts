export interface ParsedClipboardData {
    rows: string[][];
    delimiter: "tsv" | "csv" | "single";
}

function normalizeRows(text: string): string[] {
    const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
    while (lines.length > 0 && lines[lines.length - 1] === "") {
        lines.pop();
    }
    return lines;
}

function parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const ch = line[i];

        if (ch === '"') {
            if (insideQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
                continue;
            }

            insideQuotes = !insideQuotes;
            continue;
        }

        if (ch === "," && !insideQuotes) {
            result.push(current);
            current = "";
            continue;
        }

        current += ch;
    }

    result.push(current);
    return result;
}

export function parseClipboardData(rawText: string): ParsedClipboardData {
    const text = rawText ?? "";
    const rows = normalizeRows(text);

    if (rows.length === 0) {
        return {
            rows: [[""]],
            delimiter: "single",
        };
    }

    if (rows.some((row) => row.includes("\t"))) {
        return {
            rows: rows.map((row) => row.split("\t")),
            delimiter: "tsv",
        };
    }

    if (rows.some((row) => row.includes(",") || row.includes('"'))) {
        return {
            rows: rows.map((row) => parseCsvLine(row)),
            delimiter: "csv",
        };
    }

    return {
        rows: rows.map((row) => [row]),
        delimiter: "single",
    };
}
