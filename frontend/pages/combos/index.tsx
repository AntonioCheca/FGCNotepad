import {useEffect, useState} from "react";
import {AppContainer} from "@/src/components/ui/AppContainer";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {AppCircularProgress} from "@/src/components/ui/AppCircularProgress";
import ComboFilters from "@/src/components/combos/ComboFilters";
import ComboTable from "@/src/components/combos/ComboTable";
import useCombos from "@/hooks/useCombos";
import {mapComboToRow} from "@/src/types/combo";

export default function SearchCombosPage() {
    const {fetchCombos} = useCombos();
    const [filters, setFilters] = useState<any>({});
    const [combos, setCombos] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const loadCombos = async () => {
        setLoading(true);
        try {
            const data = await fetchCombos(filters);
            console.log("[SearchCombosPage] raw combos:", data);
            const mapped = (data ?? []).map(mapComboToRow);
            console.log("[SearchCombosPage] mapped combos:", mapped);
            setCombos(mapped);
        } catch (err) {
            console.error(err);
            setCombos([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCombos();
    }, [filters]);

    console.log("[SearchCombosPage] Rendering with combos:", combos);

    return (
        <AppContainer maxWidth={false}>
            <AppTypography variant="h4" gutterBottom>
                Search Combos
            </AppTypography>
            <ComboFilters onChange={(newFilters) => {
                console.log("[SearchCombosPage] Filters changed:", newFilters);
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
