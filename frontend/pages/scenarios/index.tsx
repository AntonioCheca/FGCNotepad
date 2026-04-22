import React from "react";
import Link from "next/link";

import {AppAutocomplete} from "@/src/components/ui/AppAutocomplete";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppChip} from "@/src/components/ui/AppChip";
import {AppCircularProgress} from "@/src/components/ui/AppCircularProgress";
import {AppContainer} from "@/src/components/ui/AppContainer";
import {AppMenuItem} from "@/src/components/ui/AppMenuItem";
import {AppPaper} from "@/src/components/ui/AppPaper";
import {AppTextField} from "@/src/components/ui/AppTextField";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {useCharacters} from "@/hooks/useCharacters";
import useMoves from "@/hooks/useMoves";
import {ScenarioListItem, ScenarioType, useScenarios} from "@/hooks/useScenarios";

interface TriggerMoveOption {
    id: string;
    summary: string;
}

interface AppliedScenarioFilters {
    q: string;
    scenarioType: ScenarioType | "";
    defenderCharacterId: string;
    attackerCharacterId: string;
    triggerMoveId: string;
}

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

    const [appliedFilters, setAppliedFilters] = React.useState<AppliedScenarioFilters>({
        q: "",
        scenarioType: "",
        defenderCharacterId: "",
        attackerCharacterId: "",
        triggerMoveId: "",
    });

    const [items, setItems] = React.useState<ScenarioListItem[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        const handle = window.setTimeout(() => {
            const trimmed = triggerMoveInput.trim();
            if (trimmed.length < 2) {
                setTriggerMoveOptions([]);
                return;
            }

            setSearchingMoves(true);
            searchMoves(trimmed)
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
    }, [triggerMoveInput, searchMoves]);

    React.useEffect(() => {
        setLoading(true);
        setError(null);

        listScenarios({
            q: appliedFilters.q,
            scenarioType: appliedFilters.scenarioType,
            defenderCharacterId: appliedFilters.defenderCharacterId,
            attackerCharacterId: appliedFilters.attackerCharacterId,
            triggerMoveId: appliedFilters.triggerMoveId,
            size: 80,
        })
            .then((data) => {
                setItems(Array.isArray(data) ? data : []);
            })
            .catch(() => {
                setError("Unable to load scenarios.");
                setItems([]);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [listScenarios, appliedFilters]);

    const characterOptions = React.useMemo(
        () =>
            (characters as Array<{id: string; name: string}>).filter(
                (character) => typeof character.id === "string" && typeof character.name === "string",
            ),
        [characters],
    );

    const activeFilters = React.useMemo(() => {
        const chips: string[] = [];
        if (appliedFilters.q !== "") {
            chips.push(`Search: ${appliedFilters.q}`);
        }
        if (appliedFilters.scenarioType !== "") {
            chips.push(`Type: ${appliedFilters.scenarioType}`);
        }
        if (appliedFilters.defenderCharacterId !== "") {
            const defender = characterOptions.find((entry) => entry.id === appliedFilters.defenderCharacterId);
            chips.push(`Defender: ${defender?.name ?? appliedFilters.defenderCharacterId}`);
        }
        if (appliedFilters.attackerCharacterId !== "") {
            const attacker = characterOptions.find((entry) => entry.id === appliedFilters.attackerCharacterId);
            chips.push(`Attacker: ${attacker?.name ?? appliedFilters.attackerCharacterId}`);
        }
        if (appliedFilters.triggerMoveId !== "") {
            chips.push(`Trigger move selected`);
        }

        return chips;
    }, [appliedFilters, characterOptions]);

    return (
        <AppContainer maxWidth={false}>
            <AppBox sx={{display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1.5, mb: 2}}>
                <AppTypography variant="h4">Search Scenarios</AppTypography>
                <Link href="/scenarios/new" style={{textDecoration: "none"}}>
                    <AppButton type="button">Create Scenario</AppButton>
                </Link>
            </AppBox>

            <AppPaper variant="outlined" sx={{p: 2, borderRadius: 2, mb: 2}}>
                <AppBox sx={{display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 1.5}}>
                    <AppTextField
                        label="Search by scenario name"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                    />

                    <AppTextField
                        select
                        label="Scenario type"
                        value={scenarioType}
                        onChange={(event) => setScenarioType(event.target.value as ScenarioType | "")}
                    >
                        <AppMenuItem value="">Any type</AppMenuItem>
                        <AppMenuItem value="oki">Oki</AppMenuItem>
                        <AppMenuItem value="blockstun">Blockstun</AppMenuItem>
                    </AppTextField>

                    <AppTextField
                        select
                        label="Defender"
                        value={defenderCharacterId}
                        onChange={(event) => setDefenderCharacterId(event.target.value)}
                    >
                        <AppMenuItem value="">Any defender</AppMenuItem>
                        {characterOptions.map((character) => (
                            <AppMenuItem key={character.id} value={character.id}>{character.name}</AppMenuItem>
                        ))}
                    </AppTextField>

                    <AppTextField
                        select
                        label="Attacker"
                        value={attackerCharacterId}
                        onChange={(event) => setAttackerCharacterId(event.target.value)}
                    >
                        <AppMenuItem value="">Any attacker</AppMenuItem>
                        {characterOptions.map((character) => (
                            <AppMenuItem key={character.id} value={character.id}>{character.name}</AppMenuItem>
                        ))}
                    </AppTextField>

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
                        noOptionsText={triggerMoveInput.trim().length < 2 ? "Type 2+ characters" : "No moves found"}
                        renderInput={(params) => <AppTextField {...params} label="Trigger move"/>}
                    />
                </AppBox>

                <AppBox sx={{display: "flex", gap: 1, mt: 2, flexWrap: "wrap"}}>
                    <AppButton
                        type="button"
                        onClick={() => {
                            setAppliedFilters({
                                q: query.trim(),
                                scenarioType,
                                defenderCharacterId,
                                attackerCharacterId,
                                triggerMoveId: triggerMoveSelection?.id ?? "",
                            });
                        }}
                    >
                        Apply Filters
                    </AppButton>
                    <AppButton
                        type="button"
                        variant="outlined"
                        onClick={() => {
                            setQuery("");
                            setScenarioType("");
                            setDefenderCharacterId("");
                            setAttackerCharacterId("");
                            setTriggerMoveSelection(null);
                            setTriggerMoveInput("");
                            setTriggerMoveOptions([]);
                            setAppliedFilters({
                                q: "",
                                scenarioType: "",
                                defenderCharacterId: "",
                                attackerCharacterId: "",
                                triggerMoveId: "",
                            });
                        }}
                    >
                        Reset
                    </AppButton>
                </AppBox>

                <AppBox sx={{display: "flex", gap: 1, mt: 1.5, flexWrap: "wrap"}}>
                    {activeFilters.length === 0 ? <AppChip label="No active filters" size="small"/> : null}
                    {activeFilters.map((label) => <AppChip key={label} label={label} size="small" variant="outlined"/>) }
                </AppBox>
            </AppPaper>

            {loading ? <AppCircularProgress/> : null}
            {error ? <AppTypography color="error">{error}</AppTypography> : null}

            {!loading && !error ? (
                <AppBox sx={{display: "grid", gap: 1}}>
                    {items.length === 0 ? <AppTypography>No scenarios found.</AppTypography> : null}
                    {items.map((item) => (
                        <Link
                            key={item.id}
                            href={`/scenarios/${item.id}`}
                            style={{
                                border: "1px solid #e8e8e8",
                                borderRadius: 8,
                                padding: 12,
                                textDecoration: "none",
                                color: "inherit",
                                display: "grid",
                                gap: 4,
                            }}
                        >
                            <AppTypography variant="h6">{item.name}</AppTypography>
                            <AppTypography variant="body2">
                                {item.scenarioType.toUpperCase()} · {item.defenderCharacterName ?? "?"} vs {item.attackerCharacterName ?? "?"}
                            </AppTypography>
                            <AppTypography variant="body2">Trigger: {item.triggerMoveLabel ?? item.triggerMoveId ?? "Unknown"}</AppTypography>
                        </Link>
                    ))}
                </AppBox>
            ) : null}
        </AppContainer>
    );
}
