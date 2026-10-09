
export function normalizeApiError(error: unknown, fallbackMessage: string): string {
    if (typeof error !== "object" || error === null) {
        return fallbackMessage;
    }

    const maybeResponse = error as {
        response?: {
            data?: {error?: string; message?: string};
        };
        message?: string;
    };

    return maybeResponse.response?.data?.error
        || maybeResponse.response?.data?.message
        || maybeResponse.message
        || fallbackMessage;
}
