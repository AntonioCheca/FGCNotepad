import React from "react";

export type RechartsModule = typeof import("recharts");

/** Recharts measures the DOM, so it is loaded on the client only. */
export function useRecharts(): RechartsModule | null {
    const [recharts, setRecharts] = React.useState<RechartsModule | null>(null);

    React.useEffect(() => {
        let mounted = true;
        void import("recharts").then((module) => {
            if (mounted) {
                setRecharts(module);
            }
        });

        return () => {
            mounted = false;
        };
    }, []);

    return recharts;
}
