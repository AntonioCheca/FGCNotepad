import {useCallback, useEffect, useState} from "react";
import {AppContainer} from "@/src/components/ui/AppContainer";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {AppCircularProgress} from "@/src/components/ui/AppCircularProgress";
import ComboFilters from "@/src/components/combos/ComboFilters";
import ComboTable from "@/src/components/combos/ComboTable";
import useCombos from "@/hooks/useCombos";
import {ComboRow, mapComboToRow} from "@/src/types/combo";

export default function SearchCombosPage() {
    const {fetchCombos} = useCombos();
    const [filters, setFilters] = useState<Record<string, unknown>>({});
    const [combos, setCombos] = useState<ComboRow[]>([]);
    const [loading, setLoading] = useState(false);

    const loadCombos = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchCombos(filters);
            const mapped = (data ?? []).map(mapComboToRow);
            setCombos(mapped);
        } catch (err) {
            console.error(err);
            setCombos([]);
        } finally {
            setLoading(false);
        }
    }, [fetchCombos, filters]);

    useEffect(() => {
        loadCombos();
    }, [loadCombos]);

    return (
        <AppContainer maxWidth={false}>
            <AppTypography variant="h4" gutterBottom>
                Search Combos
            </AppTypography>
            <ComboFilters onChange={(newFilters) => {
                setFilters(newFilters);
            }}/>
            {loading ? (
                <AppCircularProgress sx={{display: "block", margin: "auto", mt: 4}}/>
            ) : (
                <ComboTable combos={combos}/>
            )}
        </AppContainer>
    );
}
