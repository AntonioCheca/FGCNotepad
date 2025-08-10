import React from 'react';
import {useCharacters} from '@/hooks/useCharacters';

interface Props {
    selectedCharacterId: string | null;
    onChange: (id: string) => void;
}

export function CharacterSelect({selectedCharacterId, onChange}: Props) {
    const {characters, loading, error} = useCharacters();

    if (loading) return <p>Loading characters...</p>;
    if (error) return <p>Error loading characters: {error.message}</p>;

    return (
        <select
            value={selectedCharacterId ?? ''}
            onChange={(e) => onChange(e.target.value)}
        >
            <option value="">Select a character</option>
            {characters.map((char) => (
                <option key={char.id} value={char.id}>
                    {char.name}
                </option>
            ))}
        </select>
    );
}
