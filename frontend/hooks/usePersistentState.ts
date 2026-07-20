import {useEffect, useState} from "react";

export default function usePersistentState<T>(
    key: string,
    initial: T,
    ignoreNullInitial = false
): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [state, setState] = useState<T>(() => {
        if (typeof window === "undefined") {
            return initial;
        }

        try {
            const saved = localStorage.getItem(key);
            return saved ? JSON.parse(saved) as T : initial;
        } catch {
            return initial;
        }
    });

    useEffect(() => {
        if (ignoreNullInitial && state === null) return; // skip saving null defaults
        try {
            localStorage.setItem(key, JSON.stringify(state));
        } catch {
        }
    }, [key, state, ignoreNullInitial]);

    return [state, setState];
}
