import {useEffect, useState} from "react";

export default function usePersistentState<T>(
    key: string,
    initial: T,
    ignoreNullInitial = false
): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [state, setState] = useState<T>(initial);
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        try {
            const saved = localStorage.getItem(key);
            if (saved) setState(JSON.parse(saved) as T);
        } catch {
        }
        setHydrated(true);
    }, [key]);

    useEffect(() => {
        if (!hydrated) return;
        if (ignoreNullInitial && state === null) return; // skip saving null defaults
        try {
            localStorage.setItem(key, JSON.stringify(state));
        } catch {
        }
    }, [key, state, hydrated, ignoreNullInitial]);

    return [state, setState];
}
