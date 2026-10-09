import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {useRouter} from "next/router";
import Link from "next/link";
import {AppContainer} from "@/src/components/ui/AppContainer";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {AppCircularProgress} from "@/src/components/ui/AppCircularProgress";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppChip} from "@/src/components/ui/AppChip";
import ComboFilters, {ComboSearchFilters} from "@/src/components/combos/ComboFilters";
import ComboTable from "@/src/components/combos/ComboTable";
import {PageShell} from "@/src/components/ui/tactical/PageShell";
import {InlineNotice} from "@/src/components/ui/tactical/InlineNotice";
import {PaginationBar} from "@/src/components/ui/tactical/PaginationBar";
import useCombos from "@/hooks/useCombos";
import {ComboRow, type ComboSearchPage, mapComboToRow} from "@/src/types/combo";
import type {ComboSortDirection, ComboSortField} from "@/src/components/combos/filters/comboFilterTypes";
import {ComboExecutionModeSelect} from "@/src/components/combos/execution/ComboExecutionModeSelect";
import {useProfileComboExecutionMode} from "@/hooks/useProfileComboExecutionMode";
import type {ComboExecutionMode} from "@/src/types/comboExecution";

const PAGE_SIZE = 50;

export default function SearchCombosPage() {
    const router = useRouter();
    const {fetchCombos} = useCombos();
    const initialFilters = useMemo(() => buildFiltersFromQuery(router.query), [router.query]);
    const [filters, setFilters] = useState<ComboSearchFilters>({...initialFilters, sort: "resourceAdjustedDamage", page: 1});
    const [combos, setCombos] = useState<ComboRow[]>([]);
    const [total, setTotal] = useState(0);
    const resultsRef = useRef<HTMLDivElement | null>(null);
    const [loading, setLoading] = useState(true);
    const [hasLoadedAtLeastOnce, setHasLoadedAtLeastOnce] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const requestSequence = useRef(0);
    const {mode: profileExecutionMode, loading: profileExecutionModeLoading} = useProfileComboExecutionMode();
    const [chosenExecutionMode, setChosenExecutionMode] = useState<ComboExecutionMode | null>(null);
    const executionMode = chosenExecutionMode ?? profileExecutionMode;

    const areFiltersEqual = useCallback((left: ComboSearchFilters, right: ComboSearchFilters): boolean => {
        return JSON.stringify(left) === JSON.stringify(right);
    }, []);

    const handleFiltersChange = useCallback((newFilters: ComboSearchFilters) => {
        setFilters((currentFilters) => {
            const nextFilters = {
                ...newFilters,
                sort: currentFilters.sort ?? "resourceAdjustedDamage",
                sortDirection: currentFilters.sortDirection ?? "desc",
                page: currentFilters.page ?? 1,
            } satisfies ComboSearchFilters;

            return areFiltersEqual(currentFilters, nextFilters) ? currentFilters : {...nextFilters, page: 1};
        });
    }, [areFiltersEqual]);

    const handleSortChange = useCallback((field: ComboSortField, direction: ComboSortDirection) => {
        setFilters((currentFilters) => ({
            ...currentFilters,
            sort: field,
            sortDirection: field === "seasonStartDate" ? "desc" : direction,
            page: 1,
        }));
    }, []);

    const handlePageChange = useCallback((page: number) => {
        setFilters((currentFilters) => ({...currentFilters, page}));
        resultsRef.current?.scrollIntoView({block: "start", behavior: "smooth"});
    }, []);

    const handleExecutionModeChange = useCallback((mode: ComboExecutionMode) => {
        setChosenExecutionMode(mode);
        setFilters((currentFilters) => ({...currentFilters, page: 1}));
    }, []);

    const loadCombos = useCallback(async () => {
        if (profileExecutionModeLoading) {
            return;
        }
        const currentRequestId = requestSequence.current + 1;
        requestSequence.current = currentRequestId;
        setLoading(true);
        setErrorMessage(null);

        try {
            const data = await fetchCombos({...filters, page: filters.page ?? 1, size: PAGE_SIZE, executionMode}) as ComboSearchPage;
            if (requestSequence.current !== currentRequestId) {
                return;
            }

            setCombos(data.items.map(mapComboToRow));
            setTotal(data.total);
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
    }, [executionMode, fetchCombos, filters, profileExecutionModeLoading]);

    useEffect(() => {
        loadCombos();
    }, [loadCombos]);

    return (
        <AppContainer maxWidth={false} sx={{py: {xs: 2.25, md: 3.25}, px: {xs: 1.75, md: 3, xl: 4}}}>
            <PageShell
                title="Search Combos"
                badgeLabel={`${total} result${total === 1 ? "" : "s"}`}
            >
                {errorMessage ? <InlineNotice severity="error">{errorMessage}</InlineNotice> : null}
                <AppBox sx={{display: "flex", flexDirection: {xs: "column", sm: "row"}, justifyContent: {xs: "stretch", sm: "flex-end"}, alignItems: {sm: "center"}, gap: 1}}>
                    <ComboExecutionModeSelect value={executionMode} onChange={handleExecutionModeChange} disabled={profileExecutionModeLoading} />
                    <Link href="/combos/new" style={{textDecoration: "none"}}>
                        <AppButton type="button" variant="contained" color="primary" sx={{width: {xs: "100%", sm: "auto"}}}>Create combo</AppButton>
                    </Link>
                </AppBox>
                <ComboFilters initialFilters={initialFilters} onChange={handleFiltersChange} />

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
                    <AppBox ref={resultsRef} sx={{scrollMarginTop: 16, minWidth: 0}}>
                        <ComboTable
                            key={filters.page ?? 1}
                            combos={combos}
                            sort={filters.sort ?? "resourceAdjustedDamage"}
                            sortDirection={filters.sortDirection ?? "desc"}
                            onSortChange={handleSortChange}
                        />
                        <PaginationBar page={filters.page ?? 1} pageSize={PAGE_SIZE} total={total} disabled={loading} onPageChange={handlePageChange} />
                    </AppBox>
                )}
            </PageShell>
        </AppContainer>
    );
}

function buildFiltersFromQuery(query: Record<string, string | string[] | undefined>): ComboSearchFilters {
    const filters: ComboSearchFilters = {};
    const stringValue = (key: string): string | undefined => {
        const value = query[key];
        return Array.isArray(value) ? value[0] : value;
    };
    const numberValue = (key: string): number | undefined => {
        const value = stringValue(key);
        if (value === undefined || value.trim() === "") {
            return undefined;
        }
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : undefined;
    };
    const boolValue = (key: string): boolean | undefined => {
        const value = stringValue(key);
        if (value === "true" || value === "1") {
            return true;
        }
        if (value === "false" || value === "0") {
            return false;
        }
        return undefined;
    };
    const stringListValue = (key: string): string[] | undefined => {
        const value = query[key];
        const values = Array.isArray(value) ? value : value ? [value] : [];
        const normalized = values.flatMap((entry) => entry.split(",")).map((entry) => entry.trim()).filter(Boolean);

        return normalized.length > 0 ? normalized : undefined;
    };

    for (const key of ["characterId", "firstMoveId", "enderMoveId"] as const) {
        const value = stringValue(key);
        if (value) {
            filters[key] = value;
        }
    }
    for (const key of ["minDamage", "maxDamage", "minDriveCost", "maxDriveCost"] as const) {
        const value = numberValue(key);
        if (value !== undefined) {
            filters[key] = value;
        }
    }
    for (const key of ["firstMoveAfterDriveRush", "counterHitRequired", "punishCounterRequired", "perfectParryRequired", "blockedDriveImpactStunRequired", "cornerRequired"] as const) {
        const value = boolValue(key);
        if (value !== undefined) {
            filters[key] = value;
        }
    }
    const spacingCodes = stringListValue("spacingCodes");
    if (spacingCodes !== undefined) {
        filters.spacingCodes = spacingCodes;
    }

    return filters;
}
