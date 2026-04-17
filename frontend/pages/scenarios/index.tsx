import React from "react";
import Link from "next/link";

import {AppContainer} from "@/src/components/ui/AppContainer";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {AppTextField} from "@/src/components/ui/AppTextField";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppCircularProgress} from "@/src/components/ui/AppCircularProgress";
import {useScenarios, ScenarioListItem, ScenarioType} from "@/hooks/useScenarios";
import {useCharacters} from "@/hooks/useCharacters";

export default function SearchScenariosPage() {
    const {listScenarios} = useScenarios();
    const {characters} = useCharacters();

    const [query, setQuery] = React.useState("");
    const [scenarioType, setScenarioType] = React.useState<ScenarioType | "">("");
    const [defenderCharacterId, setDefenderCharacterId] = React.useState("");
    const [attackerCharacterId, setAttackerCharacterId] = React.useState("");
    const [triggerMoveId, setTriggerMoveId] = React.useState("");
    const [items, setItems] = React.useState<ScenarioListItem[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    const load = React.useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const data = await listScenarios({
                q: query,
                scenarioType,
                defenderCharacterId,
                attackerCharacterId,
                triggerMoveId,
            });

            setItems(Array.isArray(data) ? data : []);
        } catch {
            setError("Unable to load scenarios.");
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [listScenarios, query, scenarioType, defenderCharacterId, attackerCharacterId, triggerMoveId]);

    React.useEffect(() => {
        load();
    }, [load]);

    const characterOptions = (characters as Array<{id: string; name: string}>).filter(
        (character) => typeof character.id === "string" && typeof character.name === "string"
    );

    return (
        <AppContainer maxWidth={false}>
            <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 16}}>
                <AppTypography variant="h4">Search Scenarios</AppTypography>
                <Link href="/scenarios/new" style={{textDecoration: "none"}}>
                    <AppButton type="button">Create Scenario</AppButton>
                </Link>
            </div>

            <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 16}}>
                <AppTextField
                    label="Search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                />

                <div style={{display: "grid", gap: 4}}>
                    <AppTypography variant="body2">Scenario Type</AppTypography>
                    <select
                        value={scenarioType}
                        onChange={(event) => setScenarioType(event.target.value as ScenarioType | "")}
                        style={{height: 40, borderRadius: 6, border: "1px solid #d9d9d9", padding: "0 10px"}}
                    >
                        <option value="">Any type</option>
                        <option value="oki">Oki</option>
                        <option value="blockstun">Blockstun</option>
                    </select>
                </div>

                <div style={{display: "grid", gap: 4}}>
                    <AppTypography variant="body2">Defender</AppTypography>
                    <select
                        value={defenderCharacterId}
                        onChange={(event) => setDefenderCharacterId(event.target.value)}
                        style={{height: 40, borderRadius: 6, border: "1px solid #d9d9d9", padding: "0 10px"}}
                    >
                        <option value="">Any defender</option>
                        {characterOptions.map((character) => (
                            <option key={character.id} value={character.id}>{character.name}</option>
                        ))}
                    </select>
                </div>

                <div style={{display: "grid", gap: 4}}>
                    <AppTypography variant="body2">Attacker</AppTypography>
                    <select
                        value={attackerCharacterId}
                        onChange={(event) => setAttackerCharacterId(event.target.value)}
                        style={{height: 40, borderRadius: 6, border: "1px solid #d9d9d9", padding: "0 10px"}}
                    >
                        <option value="">Any attacker</option>
                        {characterOptions.map((character) => (
                            <option key={character.id} value={character.id}>{character.name}</option>
                        ))}
                    </select>
                </div>

                <AppTextField
                    label="Trigger Move ID"
                    value={triggerMoveId}
                    onChange={(event) => setTriggerMoveId(event.target.value)}
                />
            </div>

            <div style={{display: "flex", gap: 8, marginBottom: 16}}>
                <AppButton type="button" onClick={load}>Apply Filters</AppButton>
                <AppButton
                    type="button"
                    variant="outlined"
                    onClick={() => {
                        setQuery("");
                        setScenarioType("");
                        setDefenderCharacterId("");
                        setAttackerCharacterId("");
                        setTriggerMoveId("");
                    }}
                >
                    Reset
                </AppButton>
            </div>

            {loading ? <AppCircularProgress/> : null}
            {error ? <AppTypography color="error">{error}</AppTypography> : null}

            {!loading && !error ? (
                <div style={{display: "grid", gap: 8}}>
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
                </div>
            ) : null}
        </AppContainer>
    );
}
