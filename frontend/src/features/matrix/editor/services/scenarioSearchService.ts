import api from "@/services/api";

export interface ScenarioSearchItem {
    id: string;
    label: string;
    typeLabel: string;
}

export class ScenarioSearchError extends Error {
    statusCode: number | null;

    constructor(message: string, statusCode: number | null) {
        super(message);
        this.name = "ScenarioSearchError";
        this.statusCode = statusCode;
    }
}

interface ApiDataResponse<T> {
    data: T;
}

async function requestData<T>(apiCall: () => Promise<ApiDataResponse<T>>): Promise<T> {
    const response = await apiCall();
    return response.data;
}

function asRecord(value: unknown): Record<string, unknown> | null {
    return typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

export function normalizeScenarioItems(raw: unknown): ScenarioSearchItem[] {
    if (!Array.isArray(raw)) {
        return [];
    }

    return raw
        .map((item) => {
            const record = asRecord(item);
            if (!record) {
                return null;
            }

            const id = record.id;
            const nameCandidate =
                typeof record.name === "string"
                    ? record.name
                    : typeof record.label === "string"
                      ? record.label
                      : "";
            const name = nameCandidate.trim();
            const type = asRecord(record.type);
            const typeLabelCandidate =
                typeof record.typeLabel === "string"
                    ? record.typeLabel
                    : typeof type?.name === "string"
                      ? type.name
                      : "Scenario";
            const typeLabel = typeLabelCandidate.trim() || "Scenario";

            if ((typeof id !== "string" && typeof id !== "number") || name === "") {
                return null;
            }

            return {
                id: String(id),
                label: name,
                typeLabel,
            };
        })
        .filter((item): item is ScenarioSearchItem => item !== null);
}

export function filterScenarioItems(items: ScenarioSearchItem[], query: string): ScenarioSearchItem[] {
    const term = query.trim().toLowerCase();
    if (term === "") {
        return items;
    }

    return items.filter((item) => {
        return item.label.toLowerCase().includes(term) || item.typeLabel.toLowerCase().includes(term) || item.id.includes(term);
    });
}

export async function fetchScenarioItems(): Promise<ScenarioSearchItem[]> {
    try {
        const payload = await requestData(() => api.get<unknown>("/scenarios"));
        return normalizeScenarioItems(payload);
    } catch (error) {
        const statusCode =
            typeof error === "object" &&
            error !== null &&
            "response" in error &&
            typeof (error as { response?: { status?: number } }).response?.status === "number"
                ? (error as { response: { status: number } }).response.status
                : null;

        if (statusCode === 401 || statusCode === 403) {
            throw new ScenarioSearchError("Please log in to search scenarios.", statusCode);
        }

        if (statusCode === 404) {
            throw new ScenarioSearchError("Scenario API endpoint was not found (/api/scenarios).", statusCode);
        }

        if (statusCode === 500) {
            throw new ScenarioSearchError("Scenario API failed on the server (500). If schema was updated, run backend migrations and restart backend.", statusCode);
        }

        throw new ScenarioSearchError("Failed to load scenarios. Try again.", statusCode);
    }
}
