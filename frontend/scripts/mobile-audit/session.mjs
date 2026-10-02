export function requireEnv(name) {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing ${name}. See docs/mobile-audit.md.`);
    }
    return value;
}

// Logs in against the Symfony API and returns a tiny cookie + CSRF aware JSON client.
export async function createApiSession(apiUrl, username, password) {
    const cookies = new Map();
    let csrfToken = "";

    function cookieHeader() {
        return [...cookies].map(([name, value]) => `${name}=${value}`).join("; ");
    }

    async function request(method, path, body) {
        const response = await fetch(`${apiUrl}${path}`, {
            method,
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                ...(cookies.size > 0 ? {Cookie: cookieHeader()} : {}),
                ...(csrfToken && method !== "GET" ? {"X-CSRF-Token": csrfToken} : {}),
            },
            body: body === undefined ? undefined : JSON.stringify(body),
        });
        for (const header of response.headers.getSetCookie?.() ?? []) {
            const [pair] = header.split(";");
            const separator = pair.indexOf("=");
            cookies.set(pair.slice(0, separator), pair.slice(separator + 1));
        }
        const text = await response.text();
        const payload = text ? JSON.parse(text) : null;
        if (!response.ok) {
            throw new Error(`${method} ${path} failed with ${response.status}: ${text.slice(0, 300)}`);
        }
        return payload;
    }

    const login = await request("POST", "/login", {username, password});
    csrfToken = login.csrfToken;

    return {
        get: (path) => request("GET", path),
        post: (path, body) => request("POST", path, body),
        cookies: () => [...cookies].map(([name, value]) => ({name, value})),
    };
}
