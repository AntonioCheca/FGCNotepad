import React from "react";
import Link from "next/link";

import {AppAutocomplete} from "@/src/components/ui/AppAutocomplete";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppChip} from "@/src/components/ui/AppChip";
import {AppCircularProgress} from "@/src/components/ui/AppCircularProgress";
import {AppCollapse} from "@/src/components/ui/AppCollapse";
import {AppPaper} from "@/src/components/ui/AppPaper";
import {AppStack} from "@/src/components/ui/AppStack";
import {AppTextField} from "@/src/components/ui/AppTextField";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {ActionBar} from "@/src/components/ui/tactical/ActionBar";
import {InlineNotice} from "@/src/components/ui/tactical/InlineNotice";
import {PageShell} from "@/src/components/ui/tactical/PageShell";
import {SectionCard} from "@/src/components/ui/tactical/SectionCard";
import {AppContainer} from "@/src/components/ui/AppContainer";
import {useCharacters} from "@/hooks/useCharacters";
import useMoves from "@/hooks/useMoves";
import {ScenarioListItem, ScenarioType, useScenarios} from "@/hooks/useScenarios";

interface TriggerMoveOption {
    id: string;
    summary: string;
}

interface CharacterOption {
    id: string;
    name: string;
}

interface ScenarioSearchDraft {
    q?: string;
    scenarioType?: ScenarioType | "";
    defenderCharacterId?: string;
    attackerCharacterId?: string;
    triggerMoveId?: string;
}

const scenarioTypeOptions: Array<{label: string; value: ScenarioType}> = [
    {label: "Oki", value: "oki"},
    {label: "Aggregated Oki", value: "aggregated_oki"},
    {label: "Blockstun", value: "blockstun"},
];

export default function SearchScenariosPage() {
    const {listScenarios} = useScenarios();
    const {characters} = useCharacters();
    const {searchMoves} = useMoves();

    const [query, setQuery] = React.useState("");
    const [scenarioType, setScenarioType] = React.useState<ScenarioType | "">("");
    const [defenderCharacterId, setDefenderCharacterId] = React.useState("");
    const [attackerCharacterId, setAttackerCharacterId] = React.useState("");
    const [triggerMoveSelection, setTriggerMoveSelection] = React.useState<TriggerMoveOption | null>(null);
    const [triggerMoveInput, setTriggerMoveInput] = React.useState("");
    const [triggerMoveOptions, setTriggerMoveOptions] = React.useState<TriggerMoveOption[]>([]);
    const [searchingMoves, setSearchingMoves] = React.useState(false);
    const [showAdvancedFilters, setShowAdvancedFilters] = React.useState(false);

    const [filters, setFilters] = React.useState<ScenarioSearchDraft>({});
    const [items, setItems] = React.useState<ScenarioListItem[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [hasLoadedAtLeastOnce, setHasLoadedAtLeastOnce] = React.useState(false);
    const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
    const requestSequence = React.useRef(0);

    const compactFieldSx = React.useMemo(
        () => ({
            "& .MuiFormControl-root": {
                margin: 0,
            },
            "& .MuiInputBase-root": {
                minHeight: 40,
            },
        }),
        [],
    );

    const characterOptions = React.useMemo<CharacterOption[]>(() => {
        return (characters as Array<{id: string; name: string}>)
            .filter((character) => typeof character.id === "string" && typeof character.name === "string")
            .sort((left, right) => left.name.localeCompare(right.name));
    }, [characters]);

    const selectedAttacker = React.useMemo(() => {
        if (!attackerCharacterId) {
            return null;
        }

        return characterOptions.find((character) => character.id === attackerCharacterId) ?? null;
    }, [attackerCharacterId, characterOptions]);

    const selectedDefender = React.useMemo(() => {
        if (!defenderCharacterId) {
            return null;
        }

        return characterOptions.find((character) => character.id === defenderCharacterId) ?? null;
    }, [defenderCharacterId, characterOptions]);

    const normalizedFilters = React.useMemo<ScenarioSearchDraft>(() => {
        return {
            q: query.trim() || undefined,
            scenarioType: scenarioType || undefined,
            defenderCharacterId: defenderCharacterId || undefined,
            attackerCharacterId: attackerCharacterId || undefined,
            triggerMoveId: triggerMoveSelection?.id ?? undefined,
        };
    }, [query, scenarioType, defenderCharacterId, attackerCharacterId, triggerMoveSelection]);

    const activeFilterCount = React.useMemo(() => {
        return [
            Boolean(normalizedFilters.q),
            Boolean(normalizedFilters.scenarioType),
            Boolean(normalizedFilters.defenderCharacterId),
            Boolean(normalizedFilters.attackerCharacterId),
            Boolean(normalizedFilters.triggerMoveId),
        ].filter(Boolean).length;
    }, [normalizedFilters]);

    React.useEffect(() => {
        const handle = window.setTimeout(() => {
            setFilters(normalizedFilters);
        }, 240);

        return () => {
            window.clearTimeout(handle);
        };
    }, [normalizedFilters]);

    React.useEffect(() => {
        const handle = window.setTimeout(() => {
            const queryToSend = triggerMoveInput.trim() || " ";

            setSearchingMoves(true);
            searchMoves(queryToSend, attackerCharacterId || undefined)
                .then((result: unknown) => {
                    if (!Array.isArray(result)) {
                        setTriggerMoveOptions([]);
                        return;
                    }

                    const normalized = result
                        .map((entry) => {
                            if (typeof entry !== "object" || entry === null) {
                                return null;
                            }

                            const record = entry as {id?: unknown; summary?: unknown};
                            if (typeof record.id !== "string" || typeof record.summary !== "string") {
                                return null;
                            }

                            return {
                                id: record.id,
                                summary: record.summary,
                            };
                        })
                        .filter((entry): entry is TriggerMoveOption => entry !== null);

                    if (selectedAttacker?.name) {
                        const attackerNamePrefix = `${selectedAttacker.name.toLowerCase()} `;
                        setTriggerMoveOptions(normalized.filter((entry) => entry.summary.toLowerCase().startsWith(attackerNamePrefix)));
                        return;
                    }

                    setTriggerMoveOptions(normalized);
                })
                .catch(() => {
                    setTriggerMoveOptions([]);
                })
                .finally(() => {
                    setSearchingMoves(false);
                });
        }, 250);

        return () => {
            window.clearTimeout(handle);
        };
    }, [triggerMoveInput, attackerCharacterId, searchMoves, selectedAttacker]);

    React.useEffect(() => {
        const currentRequestId = requestSequence.current + 1;
        requestSequence.current = currentRequestId;

        setLoading(true);
        setErrorMessage(null);

        listScenarios({
            q: filters.q,
            scenarioType: filters.scenarioType,
            defenderCharacterId: filters.defenderCharacterId,
            attackerCharacterId: filters.attackerCharacterId,
            triggerMoveId: filters.triggerMoveId,
            size: 80,
        })
            .then((data) => {
                if (requestSequence.current !== currentRequestId) {
                    return;
                }

                setItems(Array.isArray(data) ? data : []);
                setHasLoadedAtLeastOnce(true);
            })
            .catch(() => {
                if (requestSequence.current !== currentRequestId) {
                    return;
                }

                setErrorMessage("Unable to load scenarios for this filter set.");
                setHasLoadedAtLeastOnce(true);
            })
            .finally(() => {
                if (requestSequence.current === currentRequestId) {
                    setLoading(false);
                }
            });
    }, [listScenarios, filters]);

    const resetFilters = React.useCallback(() => {
        setQuery("");
        setScenarioType("");
        setDefenderCharacterId("");
        setAttackerCharacterId("");
        setTriggerMoveSelection(null);
        setTriggerMoveInput("");
        setTriggerMoveOptions([]);
    }, []);

    return (
        <AppContainer maxWidth={false} sx={{py: {xs: 2.25, md: 3.25}, px: {xs: 1.75, md: 3, xl: 4}}}>
            <PageShell
                title="Search Scenarios"
                subtitle="Fast matchup retrieval: lock attacker and trigger move, refine scenario context, and keep reviewing results while filters update."
                badgeLabel={`${items.length} result${items.length === 1 ? "" : "s"}`}
            >
                {errorMessage ? <InlineNotice severity="error">{errorMessage}</InlineNotice> : null}

                <AppBox sx={{display: "flex", justifyContent: "flex-end"}}>
                    <Link href="/scenarios/new" style={{textDecoration: "none"}}>
                        <AppButton type="button" variant="outlined" color="secondary">Create Scenario</AppButton>
                    </Link>
                </AppBox>

                <AppPaper variant="outlined" sx={{p: {xs: 1.25, md: 1.5}, borderRadius: 2.5, display: "grid", gap: 1}}>
                    <AppStack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{gap: 1, flexWrap: "wrap"}}>
                        <AppBox sx={{display: "grid", gap: 0.15}}>
                            <AppTypography variant="h6">Search Filters</AppTypography>
                            <AppTypography variant="body2" color="text.secondary">Attacker and trigger move are prioritized for practical matchup lookup speed.</AppTypography>
                        </AppBox>
                        <AppStack direction="row" spacing={0.75} sx={{flexWrap: "wrap", pt: 0.2}}>
                            <AppChip size="small" color="info" label="Auto search on" />
                            <AppChip size="small" label={activeFilterCount === 0 ? "No active filters" : `${activeFilterCount} active`} />
                        </AppStack>
                    </AppStack>

                    <SectionCard
                        title="Primary Filters"
                        description="Set attacker first, then trigger move. Scenario results refresh automatically."
                        tone="raised"
                        variant="input"
                    >
                        <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", md: "minmax(250px, 1fr) minmax(320px, 1.3fr) minmax(250px, 1fr)"}, gap: 1}}>
                            <AppAutocomplete<CharacterOption, false, false, false>
                                options={characterOptions}
                                value={selectedAttacker}
                                onChange={(_, value) => {
                                    setAttackerCharacterId(value?.id ?? "");
                                    setTriggerMoveSelection(null);
                                    setTriggerMoveInput("");
                                    setTriggerMoveOptions([]);
                                }}
                                getOptionLabel={(option) => option.name}
                                isOptionEqualToValue={(option, value) => option.id === value.id}
                                renderInput={(params) => <AppTextField {...params} label="Attacker" size="small" InputLabelProps={{shrink: true}} sx={compactFieldSx} />}
                            />

                            <AppAutocomplete<TriggerMoveOption, false, false, false>
                                options={triggerMoveOptions}
                                value={triggerMoveSelection}
                                inputValue={triggerMoveInput}
                                loading={searchingMoves}
                                filterOptions={(options) => options}
                                onChange={(_, value) => setTriggerMoveSelection(value)}
                                onInputChange={(_, value) => setTriggerMoveInput(value)}
                                getOptionLabel={(option) => option.summary}
                                isOptionEqualToValue={(option, value) => option.id === value.id}
                                noOptionsText="No moves found"
                                renderInput={(params) => <AppTextField {...params} label="Trigger move" size="small" InputLabelProps={{shrink: true}} sx={compactFieldSx} />}
                            />

                            <AppAutocomplete<CharacterOption, false, false, false>
                                options={characterOptions}
                                value={selectedDefender}
                                onChange={(_, value) => setDefenderCharacterId(value?.id ?? "")}
                                getOptionLabel={(option) => option.name}
                                isOptionEqualToValue={(option, value) => option.id === value.id}
                                renderInput={(params) => <AppTextField {...params} label="Defender" size="small" InputLabelProps={{shrink: true}} sx={compactFieldSx} />}
                            />
                        </AppBox>
                    </SectionCard>

                    <ActionBar>
                        <AppButton
                            type="button"
                            variant="text"
                            color="secondary"
                            onClick={() => setShowAdvancedFilters((previous) => !previous)}
                            sx={{color: "text.secondary"}}
                        >
                            {showAdvancedFilters ? "Hide Advanced Filters" : "Show Advanced Filters"}
                        </AppButton>
                        <AppButton type="button" variant="outlined" color="secondary" onClick={resetFilters}>Clear Filters</AppButton>
                    </ActionBar>

                    <AppCollapse in={showAdvancedFilters} timeout={200} unmountOnExit>
                        <AppBox sx={{display: "grid", gap: 1, pt: 0.75}}>
                            <SectionCard
                                title="Scenario Context"
                                description="Lower-priority context filters for refining large result sets."
                                tone="sunken"
                                variant="review"
                            >
                                <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", md: "minmax(220px, 320px) minmax(280px, 1fr)"}, gap: 1}}>
                                    <AppAutocomplete<{label: string; value: ScenarioType}, false, false, false>
                                        options={scenarioTypeOptions}
                                        value={scenarioTypeOptions.find((option) => option.value === scenarioType) ?? null}
                                        onChange={(_, value) => setScenarioType(value?.value ?? "")}
                                        getOptionLabel={(option) => option.label}
                                        isOptionEqualToValue={(option, value) => option.value === value.value}
                                        renderInput={(params) => <AppTextField {...params} label="Scenario type" size="small" InputLabelProps={{shrink: true}} sx={compactFieldSx} />}
                                    />
                                    <AppTextField
                                        label="Search by scenario name"
                                        value={query}
                                        onChange={(event) => setQuery(event.target.value)}
                                        size="small"
                                        InputLabelProps={{shrink: true}}
                                        sx={compactFieldSx}
                                    />
                                </AppBox>
                            </SectionCard>
                        </AppBox>
                    </AppCollapse>
                </AppPaper>

                {loading && hasLoadedAtLeastOnce ? (
                    <AppBox sx={{display: "flex", justifyContent: "flex-end", pb: 0.5}}>
                        <AppChip icon={<AppCircularProgress size={14} />} label="Updating results..." size="small" color="info" variant="outlined" />
                    </AppBox>
                ) : null}

                {loading && !hasLoadedAtLeastOnce ? (
                    <AppBox sx={{display: "grid", placeItems: "center", gap: 1, py: 4}}>
                        <AppCircularProgress />
                        <AppTypography variant="body2" color="text.secondary">Loading scenarios...</AppTypography>
                    </AppBox>
                ) : (
                    <AppBox sx={{display: "grid", gap: 1}}>
                        {items.length === 0 ? (
                            <AppPaper variant="outlined" sx={{p: {xs: 2, md: 2.25}, borderRadius: 2.5, display: "grid", gap: 0.45, backgroundColor: "fgc.surface.sunken"}}>
                                <AppTypography variant="h6">No scenarios found</AppTypography>
                                <AppTypography variant="body2" color="text.secondary">Try broadening the matchup scope or clearing one advanced filter.</AppTypography>
                            </AppPaper>
                        ) : null}

                        {items.map((item) => (
                            <Link key={item.id} href={`/scenarios/${item.id}`} style={{textDecoration: "none", color: "inherit"}}>
                                <AppPaper
                                    variant="outlined"
                                    sx={{
                                        p: {xs: 1.25, md: 1.5},
                                        borderRadius: 2.5,
                                        display: "grid",
                                        gap: 0.35,
                                        borderColor: "fgc.border.default",
                                        backgroundColor: "fgc.surface.base",
                                        transition: "border-color 0.2s ease, background-color 0.2s ease",
                                        "&:hover": {
                                            borderColor: "fgc.border.strong",
                                            backgroundColor: "fgc.selection.hover",
                                        },
                                    }}
                                >
                                    <AppBox sx={{display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1, flexWrap: "wrap"}}>
                                        <AppTypography variant="subtitle1" sx={{fontWeight: 650}}>{item.name}</AppTypography>
                                        <AppChip size="small" variant="outlined" label={item.typeLabel} />
                                    </AppBox>
                                    <AppTypography variant="body2" color="text.secondary">
                                        {item.defenderCharacterName ?? "?"} defends vs {item.attackerCharacterName ?? "?"}
                                    </AppTypography>
                                    <AppTypography variant="body2">Trigger: {item.triggerMoveLabel ?? item.triggerMoveId ?? "Unknown"}</AppTypography>
                                </AppPaper>
                            </Link>
                        ))}
                    </AppBox>
                )}
            </PageShell>
        </AppContainer>
    );
}
