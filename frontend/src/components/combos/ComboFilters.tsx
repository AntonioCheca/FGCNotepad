import {useState} from "react";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppTextField} from "@/src/components/ui/AppTextField";
import {AppAutocomplete} from "@/src/components/ui/AppAutocomplete";
import {AppButton} from "@/src/components/ui/AppButton";
import useMoves from "@/hooks/useMoves";

interface ComboFiltersProps {
    onChange: (filters: any) => void;
}

export default function ComboFilters({onChange}: ComboFiltersProps) {
    const [character, setCharacter] = useState<any>(null);
    const [firstMove, setFirstMove] = useState<any>(null);
    const [otherMoves, setOtherMoves] = useState<any[]>([]);
    const [season, setSeason] = useState("");

    const {searchMoves} = useMoves();

    const handleSearchMoves = async (input: string) => {
        if (!input) return [];
        const res = await searchMoves(input);
        return res.data || [];
    };

    const applyFilters = () => {
        onChange({
            characterId: character?.id || null,
            firstMoveId: firstMove?.id || null,
            otherMovesIds: otherMoves.map(m => m.id),
            season: season || null
        });
    };

    return (
        <AppBox sx={{display: "flex", gap: 2, flexWrap: "wrap", mb: 2}}>
            <AppTextField label="Character ID" value={character?.name || ""} onChange={() => {
            }}/>
            <AppAutocomplete
                options={[]}
                filterOptions={(x) => x}
                onInputChange={async (_, value) => {
                    const results = await handleSearchMoves(value);
                    setFirstMove(results[0] || null);
                }}
                getOptionLabel={(option: any) => option.name}
                renderInput={(params) => <AppTextField {...params} label="First Move"/>}
            />
            <AppAutocomplete
                multiple
                options={[]}
                filterOptions={(x) => x}
                onInputChange={async (_, value) => {
                    const results = await handleSearchMoves(value);
                    setOtherMoves(results);
                }}
                getOptionLabel={(option: any) => option.name}
                renderInput={(params) => <AppTextField {...params} label="Other Moves"/>}
            />
            <AppTextField label="Season" value={season} onChange={(e) => setSeason(e.target.value)}/>
            <AppButton onClick={applyFilters}>Search</AppButton>
        </AppBox>
    );
}
