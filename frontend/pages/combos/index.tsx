import {useCallback, useEffect, useState} from "react";
import {AppContainer} from "@/src/components/ui/AppContainer";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {AppCircularProgress} from "@/src/components/ui/AppCircularProgress";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppChip} from "@/src/components/ui/AppChip";
import {AppPaper} from "@/src/components/ui/AppPaper";
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
        <AppContainer maxWidth={false} sx={{py: {xs: 2, md: 3}}}>
            <AppPaper
                variant="outlined"
                sx={{
                    p: {xs: 2, md: 2.5},
                    borderRadius: 3,
                    mb: 2,
                    backgroundColor: "background.paper",
                }}
            >
                <AppBox sx={{display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1.5, flexWrap: "wrap"}}>
                    <AppBox sx={{display: "grid", gap: 0.5}}>
                        <AppTypography variant="h4">Search Combos</AppTypography>
                        <AppTypography variant="body2" color="text.secondary">
                            Filter by character, move properties, and execution conditions.
                        </AppTypography>
                    </AppBox>
                    <AppChip label={`${combos.length} result${combos.length === 1 ? "" : "s"}`} variant="outlined"/>
                </AppBox>
            </AppPaper>

            <ComboFilters onChange={(newFilters) => {
                setFilters(newFilters);
            }}/>
            {loading ? (
                <AppBox sx={{display: "grid", placeItems: "center", gap: 1, py: 4}}>
                    <AppCircularProgress/>
                    <AppTypography variant="body2" color="text.secondary">Loading matching combos...</AppTypography>
                </AppBox>
            ) : (
                <ComboTable combos={combos}/>
            )}
        </AppContainer>
    );
}
