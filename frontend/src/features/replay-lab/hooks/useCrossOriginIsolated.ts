import React from "react";

const subscribe = () => () => undefined;

// Isolation is fixed for the page's lifetime; reading it as an external store avoids a post-mount state flip.
export function useCrossOriginIsolated(): boolean {
    return React.useSyncExternalStore(subscribe, () => window.crossOriginIsolated, () => false);
}
