import {useEffect, useRef, useState} from "react";

export default function usePersistentState<T>(
    key: string,
    initial: T,
    ignoreNullInitial = false
): [T, React.Dispatch<React.SetStateAction<T>>] {
    const initialRef = useRef(initial);
    const [state, setState] = useState<T>(initial);
    const [loadedStorageKey, setLoadedStorageKey] = useState<string | null>(null);

    initialRef.current = initial;

    useEffect(() => {
        try {
            const saved = localStorage.getItem(key);
            setState(saved ? JSON.parse(saved) as T : initialRef.current);
        } catch {
            setState(initialRef.current);
        } finally {
            setLoadedStorageKey(key);
        }
    }, [key]);

    useEffect(() => {
        if (loadedStorageKey !== key || (ignoreNullInitial && state === null)) {
            return;
        }

        try {
            localStorage.setItem(key, JSON.stringify(state));
        } catch {
        }
    }, [key, loadedStorageKey, state, ignoreNullInitial]);

    return [state, setState];
}
