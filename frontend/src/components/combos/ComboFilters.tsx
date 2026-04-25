import React from "react";
import {AppAutocomplete} from "@/src/components/ui/AppAutocomplete";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppChip} from "@/src/components/ui/AppChip";
import {AppCollapse} from "@/src/components/ui/AppCollapse";
import {AppPaper} from "@/src/components/ui/AppPaper";
import {AppStack} from "@/src/components/ui/AppStack";
import {AppTextField} from "@/src/components/ui/AppTextField";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {ActionBar} from "@/src/components/ui/tactical/ActionBar";
import {SectionCard} from "@/src/components/ui/tactical/SectionCard";
import {ToggleRow} from "@/src/components/ui/tactical/ToggleRow";
import {useCharacters} from "@/hooks/useCharacters";
import useMoves from "@/hooks/useMoves";

interface MoveSearchOption {
    id: string;
    summary: string;
}

interface CharacterOption {
    id: string;
    name: string;
}

export interface ComboSearchFilters {
    q?: string;
    characterId?: string;
    firstMoveId?: string;
    minDifficulty?: number;
    maxDifficulty?: number;
    minDamage?: number;
    maxDamage?: number;
    isEssential?: boolean;
    counterHitRequired?: boolean;
    punishCounterRequired?: boolean;
    cornerRequired?: boolean;
    airborneRequired?: boolean;
    midScreenRequired?: boolean;
    notCrouchingRequired?: boolean;
    moveTypes?: string[];
}

interface ComboFiltersProps {
    onChange: (filters: ComboSearchFilters) => void;
}

const moveTypeOptions = [
    {label: "Drive", value: "drive"},
    {label: "Super", value: "super"},
    {label: "Special", value: "special"},
    {label: "Normal", value: "normal"},
];

function parseOptionalNumber(value: string): number | undefined {
    const normalized = value.trim();
    if (normalized === "") {
        return undefined;
    }

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? Math.trunc(parsed) : undefined;
}

export default function ComboFilters({onChange}: ComboFiltersProps) {
    const {characters} = useCharacters();
    const {searchMoves} = useMoves();

    const [query, setQuery] = React.useState("");
    const [characterId, setCharacterId] = React.useState("");
    const [firstMove, setFirstMove] = React.useState<MoveSearchOption | null>(null);
    const [firstMoveQuery, setFirstMoveQuery] = React.useState("");
    const [firstMoveOptions, setFirstMoveOptions] = React.useState<MoveSearchOption[]>([]);
    const [searchingMoves, setSearchingMoves] = React.useState(false);

    const [minDifficulty, setMinDifficulty] = React.useState("");
    const [maxDifficulty, setMaxDifficulty] = React.useState("");
    const [minDamage, setMinDamage] = React.useState("");
    const [maxDamage, setMaxDamage] = React.useState("");

    const [isEssential, setIsEssential] = React.useState(false);
    const [counterHitRequired, setCounterHitRequired] = React.useState(false);
    const [punishCounterRequired, setPunishCounterRequired] = React.useState(false);
    const [cornerRequired, setCornerRequired] = React.useState(false);
    const [airborneRequired, setAirborneRequired] = React.useState(false);
    const [midScreenRequired, setMidScreenRequired] = React.useState(false);
    const [notCrouchingRequired, setNotCrouchingRequired] = React.useState(false);

    const [moveTypes, setMoveTypes] = React.useState<string[]>([]);
    const [showAdvancedFilters, setShowAdvancedFilters] = React.useState(false);
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

    const selectedCharacter = React.useMemo(() => {
        if (!characterId) {
            return null;
        }

        return characterOptions.find((character) => character.id === characterId) ?? null;
    }, [characterId, characterOptions]);

    React.useEffect(() => {
        const handle = window.setTimeout(() => {
            const trimmed = firstMoveQuery.trim();
            const queryToSend = trimmed.length > 0 ? trimmed : " ";

            setSearchingMoves(true);
            searchMoves(queryToSend, characterId || undefined)
                .then((result: unknown) => {
                    if (!Array.isArray(result)) {
                        setFirstMoveOptions([]);
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
                        .filter((entry): entry is MoveSearchOption => entry !== null);

                    if (selectedCharacter?.name) {
                        const characterNamePrefix = `${selectedCharacter.name.toLowerCase()} `;
                        setFirstMoveOptions(
                            normalized.filter((entry) => entry.summary.toLowerCase().startsWith(characterNamePrefix)),
                        );
                        return;
                    }

                    setFirstMoveOptions(normalized);
                })
                .catch(() => {
                    setFirstMoveOptions([]);
                })
                .finally(() => {
                    setSearchingMoves(false);
                });
        }, 250);

        return () => {
            window.clearTimeout(handle);
        };
    }, [firstMoveQuery, characterId, searchMoves, selectedCharacter]);

    const activeFilterCount = React.useMemo(() => {
        const active = [
            query.trim() !== "",
            characterId !== "",
            firstMove !== null,
            minDifficulty.trim() !== "",
            maxDifficulty.trim() !== "",
            minDamage.trim() !== "",
            maxDamage.trim() !== "",
            isEssential,
            counterHitRequired,
            punishCounterRequired,
            cornerRequired,
            airborneRequired,
            midScreenRequired,
            notCrouchingRequired,
            moveTypes.length > 0,
        ];

        return active.filter(Boolean).length;
    }, [
        query,
        characterId,
        firstMove,
        minDifficulty,
        maxDifficulty,
        minDamage,
        maxDamage,
        isEssential,
        counterHitRequired,
        punishCounterRequired,
        cornerRequired,
        airborneRequired,
        midScreenRequired,
        notCrouchingRequired,
        moveTypes,
    ]);

    const normalizedFilters = React.useMemo<ComboSearchFilters>(() => {
        return {
            q: query.trim() || undefined,
            characterId: characterId || undefined,
            firstMoveId: firstMove?.id ?? undefined,
            minDifficulty: parseOptionalNumber(minDifficulty),
            maxDifficulty: parseOptionalNumber(maxDifficulty),
            minDamage: parseOptionalNumber(minDamage),
            maxDamage: parseOptionalNumber(maxDamage),
            isEssential: isEssential ? true : undefined,
            counterHitRequired: counterHitRequired ? true : undefined,
            punishCounterRequired: punishCounterRequired ? true : undefined,
            cornerRequired: cornerRequired ? true : undefined,
            airborneRequired: airborneRequired ? true : undefined,
            midScreenRequired: midScreenRequired ? true : undefined,
            notCrouchingRequired: notCrouchingRequired ? true : undefined,
            moveTypes: moveTypes.length > 0 ? moveTypes : undefined,
        };
    }, [
        query,
        characterId,
        firstMove,
        minDifficulty,
        maxDifficulty,
        minDamage,
        maxDamage,
        isEssential,
        counterHitRequired,
        punishCounterRequired,
        cornerRequired,
        airborneRequired,
        midScreenRequired,
        notCrouchingRequired,
        moveTypes,
    ]);

    React.useEffect(() => {
        const handle = window.setTimeout(() => {
            onChange(normalizedFilters);
        }, 240);

        return () => {
            window.clearTimeout(handle);
        };
    }, [normalizedFilters, onChange]);

    const clearFilters = React.useCallback(() => {
        setQuery("");
        setCharacterId("");
        setFirstMove(null);
        setFirstMoveQuery("");
        setFirstMoveOptions([]);
        setMinDifficulty("");
        setMaxDifficulty("");
        setMinDamage("");
        setMaxDamage("");
        setIsEssential(false);
        setCounterHitRequired(false);
        setPunishCounterRequired(false);
        setCornerRequired(false);
        setAirborneRequired(false);
        setMidScreenRequired(false);
        setNotCrouchingRequired(false);
        setMoveTypes([]);
        onChange({});
    }, [onChange]);

    return (
        <AppPaper variant="outlined" sx={{p: {xs: 1.25, md: 1.5}, mb: 2, borderRadius: 2.5, display: "grid", gap: 1}}>
            <AppStack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{gap: 1, flexWrap: "wrap"}}>
                <AppBox sx={{display: "grid", gap: 0.15}}>
                    <AppTypography variant="h6">Search Filters</AppTypography>
                    <AppTypography variant="body2" color="text.secondary">Character and first move are prioritized for fast discovery.</AppTypography>
                </AppBox>
                <AppStack direction="row" spacing={0.75} sx={{flexWrap: "wrap", pt: 0.2}}>
                    <AppChip size="small" color="info" label="Auto search on" />
                    <AppChip size="small" label={activeFilterCount === 0 ? "No active filters" : `${activeFilterCount} active`} />
                </AppStack>
            </AppStack>

            <SectionCard
                title="Primary Filters"
                description="Set character first, then opener. Results refresh automatically."
                tone="raised"
                variant="input"
            >
                <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", md: "minmax(260px, 1fr) minmax(320px, 1.3fr) minmax(220px, 0.9fr)"}, gap: 1}}>
                    <AppAutocomplete<CharacterOption, false, false, false>
                        options={characterOptions}
                        value={selectedCharacter}
                        onChange={(_, value) => {
                            setCharacterId(value?.id ?? "");
                            setFirstMove(null);
                            setFirstMoveQuery("");
                            setFirstMoveOptions([]);
                        }}
                        getOptionLabel={(option) => option.name}
                        isOptionEqualToValue={(option, value) => option.id === value.id}
                        renderInput={(params) => <AppTextField {...params} label="Character" size="small" InputLabelProps={{shrink: true}} sx={compactFieldSx} />}
                    />

                    <AppAutocomplete<MoveSearchOption, false, false, false>
                        options={firstMoveOptions}
                        value={firstMove}
                        inputValue={firstMoveQuery}
                        loading={searchingMoves}
                        filterOptions={(options) => options}
                        onChange={(_, value) => setFirstMove(value)}
                        onInputChange={(_, value) => setFirstMoveQuery(value)}
                        getOptionLabel={(option) => option.summary}
                        isOptionEqualToValue={(option, value) => option.id === value.id}
                        noOptionsText="No moves found"
                        renderInput={(params) => <AppTextField {...params} label="First move" size="small" InputLabelProps={{shrink: true}} sx={compactFieldSx} />}
                    />

                    <AppTextField
                        label="Search title"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        size="small"
                        InputLabelProps={{shrink: true}}
                        sx={compactFieldSx}
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
                <AppButton type="button" variant="outlined" color="secondary" onClick={clearFilters}>Clear Filters</AppButton>
            </ActionBar>

            <AppCollapse in={showAdvancedFilters} timeout={200} unmountOnExit>
                <AppBox sx={{display: "grid", gap: 1, pt: 0.75}}>
                    <SectionCard
                        title="Execution and Damage"
                        description="Optional range and move composition tuning."
                        tone="default"
                        variant="review"
                    >
                        <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", md: "minmax(240px, 1.2fr) repeat(4, minmax(120px, 1fr))"}, gap: 1}}>
                            <AppAutocomplete<{label: string; value: string}, true, false, false>
                                multiple
                                options={moveTypeOptions}
                                value={moveTypeOptions.filter((entry) => moveTypes.includes(entry.value))}
                                filterOptions={(options) => options}
                                onChange={(_, value) => setMoveTypes(value.map((entry) => entry.value))}
                                getOptionLabel={(option) => option.label}
                                isOptionEqualToValue={(option, value) => option.value === value.value}
                                renderInput={(params) => <AppTextField {...params} label="Contains move type" size="small" />}
                            />
                            <AppTextField label="Min difficulty" type="number" size="small" value={minDifficulty} onChange={(event) => setMinDifficulty(event.target.value)} />
                            <AppTextField label="Max difficulty" type="number" size="small" value={maxDifficulty} onChange={(event) => setMaxDifficulty(event.target.value)} />
                            <AppTextField label="Min damage" type="number" size="small" value={minDamage} onChange={(event) => setMinDamage(event.target.value)} />
                            <AppTextField label="Max damage" type="number" size="small" value={maxDamage} onChange={(event) => setMaxDamage(event.target.value)} />
                        </AppBox>
                    </SectionCard>

                    <SectionCard
                        title="Requirements"
                        description="Lower-priority context filters for niche scenarios and routing checks."
                        tone="sunken"
                        variant="default"
                    >
                        <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", md: "1fr 1fr"}, gap: 0.75}}>
                            <ToggleRow label="Essential" checked={isEssential} onChange={setIsEssential} />
                            <ToggleRow label="Counter hit required" checked={counterHitRequired} onChange={setCounterHitRequired} />
                            <ToggleRow label="Punish counter required" checked={punishCounterRequired} onChange={setPunishCounterRequired} />
                            <ToggleRow label="Corner required" checked={cornerRequired} onChange={setCornerRequired} />
                            <ToggleRow label="Airborne required" checked={airborneRequired} onChange={setAirborneRequired} />
                            <ToggleRow label="Mid-screen required" checked={midScreenRequired} onChange={setMidScreenRequired} />
                            <ToggleRow label="Not crouching required" checked={notCrouchingRequired} onChange={setNotCrouchingRequired} />
                        </AppBox>
                    </SectionCard>
                </AppBox>
            </AppCollapse>
        </AppPaper>
    );
}
