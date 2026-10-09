import {NextRequest, NextResponse} from "next/server";
import {canAccessRoute, isAnonymousRoute} from "@/src/utils/routeAccess";

const PUBLIC_ROUTE_PREFIXES = ["/auth/login", "/auth/register"];

function isPublicRoute(pathname: string): boolean {
    return PUBLIC_ROUTE_PREFIXES.some((route) => pathname.startsWith(route));
}

function resolveBackendMeUrl(request: NextRequest): URL {
    const configuredUrl = process.env.NEXT_SERVER_API_URL || process.env.NEXT_PUBLIC_API_URL;
    const apiBaseUrl = configuredUrl || "http://127.0.0.1:8000/api";
    const parsedUrl = new URL(apiBaseUrl, request.nextUrl.origin);

    return new URL(`${parsedUrl.pathname.replace(/\/$/, "")}/me`, parsedUrl.origin);
}

function loginRedirect(request: NextRequest): NextResponse {
    const loginUrl = new URL("/auth/login", request.url);
    const redirectPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
    loginUrl.searchParams.set("redirect", redirectPath);

    return NextResponse.redirect(loginUrl);
}

async function readRoles(response: Response): Promise<string[]> {
    try {
        const payload: unknown = await response.json();
        const roles = (payload as {user?: {roles?: unknown}} | null)?.user?.roles;

        return Array.isArray(roles) ? roles.filter((role): role is string => typeof role === "string") : [];
    } catch {
        return [];
    }
}

function allowsPlaywrightAuthBypass(request: NextRequest): boolean {
    return process.env.PLAYWRIGHT_AUTH_BYPASS === "1" && request.headers.get("x-playwright-auth-bypass") === "1";
}

export async function proxy(request: NextRequest) {
    if (isPublicRoute(request.nextUrl.pathname) || allowsPlaywrightAuthBypass(request)) {
        return NextResponse.next();
    }

    const cookieHeader = request.headers.get("cookie");
    const anonymousAllowed = isAnonymousRoute(request.nextUrl.pathname);
    if (!cookieHeader) {
        return anonymousAllowed ? NextResponse.next() : loginRedirect(request);
    }

    try {
        const response = await fetch(resolveBackendMeUrl(request), {
            headers: {
                cookie: cookieHeader,
                accept: "application/json",
            },
            cache: "no-store",
        });

        if (response.ok) {
            const roles = await readRoles(response);
            if (!canAccessRoute(request.nextUrl.pathname, roles)) {
                return NextResponse.redirect(new URL("/", request.url));
            }

            return NextResponse.next();
        }
    } catch {
        return anonymousAllowed ? NextResponse.next() : loginRedirect(request);
    }

    return anonymousAllowed ? NextResponse.next() : loginRedirect(request);
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico|logos|images).*)"],
};
