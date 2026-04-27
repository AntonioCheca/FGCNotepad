import {useCallback, useEffect, useRef, useState} from "react";
import {AppContainer} from "@/src/components/ui/AppContainer";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {AppCircularProgress} from "@/src/components/ui/AppCircularProgress";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppChip} from "@/src/components/ui/AppChip";
import ComboFilters, {ComboSearchFilters} from "@/src/components/combos/ComboFilters";
import ComboTable from "@/src/components/combos/ComboTable";
import {PageShell} from "@/src/components/ui/tactical/PageShell";
import {InlineNotice} from "@/src/components/ui/tactical/InlineNotice";
import useCombos from "@/hooks/useCombos";
import {ComboRow, mapComboToRow} from "@/src/types/combo";

export default function SearchCombosPage() {
    const {fetchCombos} = useCombos();
    const [filters, setFilters] = useState<ComboSearchFilters>({sort: "resourceAdjustedDamage"});
    const [combos, setCombos] = useState<ComboRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasLoadedAtLeastOnce, setHasLoadedAtLeastOnce] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const requestSequence = useRef(0);

    const loadCombos = useCallback(async () => {
        const currentRequestId = requestSequence.current + 1;
        requestSequence.current = currentRequestId;
        setLoading(true);
        setErrorMessage(null);

        try {
            const data = await fetchCombos(filters);
            if (requestSequence.current !== currentRequestId) {
                return;
            }

            const mapped = (data ?? []).map(mapComboToRow);
            setCombos(mapped);
            setHasLoadedAtLeastOnce(true);
        } catch {
            if (requestSequence.current !== currentRequestId) {
                return;
            }

            setErrorMessage("Could not load combos for this filter set.");
            setHasLoadedAtLeastOnce(true);
        } finally {
            if (requestSequence.current === currentRequestId) {
                setLoading(false);
            }
        }
    }, [fetchCombos, filters]);

    useEffect(() => {
        loadCombos();
    }, [loadCombos]);

    return (
        <AppContainer maxWidth={false} sx={{py: {xs: 2.25, md: 3.25}, px: {xs: 1.75, md: 3, xl: 4}}}>
            <PageShell
                title="Search Combos"
                subtitle="High-speed lookup flow: lock character, refine opener and constraints, and browse viable routes immediately."
                badgeLabel={`${combos.length} result${combos.length === 1 ? "" : "s"}`}
            >
                {errorMessage ? <InlineNotice severity="error">{errorMessage}</InlineNotice> : null}
                <ComboFilters onChange={(newFilters) => {
                    setFilters(newFilters);
                }} />

                {loading && hasLoadedAtLeastOnce ? (
                    <AppBox sx={{display: "flex", justifyContent: "flex-end", pb: 0.5}}>
                        <AppChip icon={<AppCircularProgress size={14} />} label="Updating results..." size="small" color="info" variant="outlined" />
                    </AppBox>
                ) : null}

                {loading && !hasLoadedAtLeastOnce ? (
                    <AppBox sx={{display: "grid", placeItems: "center", gap: 1, py: 4}}>
                        <AppCircularProgress />
                        <AppTypography variant="body2" color="text.secondary">Loading combos...</AppTypography>
                    </AppBox>
                ) : (
                    <ComboTable combos={combos} />
                )}
            </PageShell>
        </AppContainer>
    );
}
