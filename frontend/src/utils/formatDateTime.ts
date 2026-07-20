const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
});

export function formatUtcDateTime(value: string | null, emptyLabel = "-"): string {
    if (!value) {
        return emptyLabel;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return emptyLabel;
    }

    return dateTimeFormatter.format(parsed);
}
