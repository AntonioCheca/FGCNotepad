import {useEffect} from 'react';
import {useRouter} from 'next/router';

export default function IndexPage() {
    const router = useRouter();

    useEffect(() => {
        void router.replace('/combos');
    }, [router]);

    return null;
}
