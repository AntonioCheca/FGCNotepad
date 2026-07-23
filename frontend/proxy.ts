import {NextRequest, NextResponse} from "next/server";

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

export async function proxy(request: NextRequest) {
    if (isPublicRoute(request.nextUrl.pathname)) {
        return NextResponse.next();
    }

    const cookieHeader = request.headers.get("cookie");
    if (!cookieHeader) {
        return loginRedirect(request);
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
            return NextResponse.next();
        }
    } catch {
        return loginRedirect(request);
    }

    return loginRedirect(request);
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico|logos|images).*)"],
};
