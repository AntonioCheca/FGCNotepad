import React from "react";
import {AppAutocomplete} from "@/src/components/ui/AppAutocomplete";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppChip} from "@/src/components/ui/AppChip";
import {AppFormControl} from "@/src/components/ui/AppFormControl";
import {AppInputLabel} from "@/src/components/ui/AppInputLabel";
import {AppMenuItem} from "@/src/components/ui/AppMenuItem";
import {AppPaper} from "@/src/components/ui/AppPaper";
import {AppSelect} from "@/src/components/ui/AppSelect";
import {AppStack} from "@/src/components/ui/AppStack";
import {AppTextField} from "@/src/components/ui/AppTextField";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {useCharacters} from "@/hooks/useCharacters";
import useMoves from "@/hooks/useMoves";

type TriStateBoolean = "" | "true" | "false";

interface MoveSearchOption {
    id: string;
    summary: string;
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

function parseTriStateBoolean(value: TriStateBoolean): boolean | undefined {
    if (value === "") {
        return undefined;
    }

    return value === "true";
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

    const [isEssential, setIsEssential] = React.useState<TriStateBoolean>("");
    const [counterHitRequired, setCounterHitRequired] = React.useState<TriStateBoolean>("");
    const [punishCounterRequired, setPunishCounterRequired] = React.useState<TriStateBoolean>("");
    const [cornerRequired, setCornerRequired] = React.useState<TriStateBoolean>("");
    const [airborneRequired, setAirborneRequired] = React.useState<TriStateBoolean>("");
    const [midScreenRequired, setMidScreenRequired] = React.useState<TriStateBoolean>("");
    const [notCrouchingRequired, setNotCrouchingRequired] = React.useState<TriStateBoolean>("");

    const [moveTypes, setMoveTypes] = React.useState<string[]>([]);

    const characterOptions = React.useMemo(
        () =>
            (characters as Array<{id: string; name: string}>)
                .filter((character) => typeof character.id === "string" && typeof character.name === "string")
                .sort((left, right) => left.name.localeCompare(right.name)),
        [characters],
    );

    React.useEffect(() => {
        const handle = window.setTimeout(() => {
            const trimmed = firstMoveQuery.trim();
            if (trimmed.length < 2) {
                setFirstMoveOptions([]);
                return;
            }

            setSearchingMoves(true);
            searchMoves(trimmed)
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
    }, [firstMoveQuery, searchMoves]);

    const activeFilterCount = React.useMemo(() => {
        const active = [
            query.trim() !== "",
            characterId !== "",
            firstMove !== null,
            minDifficulty.trim() !== "",
            maxDifficulty.trim() !== "",
            minDamage.trim() !== "",
            maxDamage.trim() !== "",
            isEssential !== "",
            counterHitRequired !== "",
            punishCounterRequired !== "",
            cornerRequired !== "",
            airborneRequired !== "",
            midScreenRequired !== "",
            notCrouchingRequired !== "",
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

    const applyFilters = React.useCallback(() => {
        onChange({
            q: query.trim() || undefined,
            characterId: characterId || undefined,
            firstMoveId: firstMove?.id ?? undefined,
            minDifficulty: parseOptionalNumber(minDifficulty),
            maxDifficulty: parseOptionalNumber(maxDifficulty),
            minDamage: parseOptionalNumber(minDamage),
            maxDamage: parseOptionalNumber(maxDamage),
            isEssential: parseTriStateBoolean(isEssential),
            counterHitRequired: parseTriStateBoolean(counterHitRequired),
            punishCounterRequired: parseTriStateBoolean(punishCounterRequired),
            cornerRequired: parseTriStateBoolean(cornerRequired),
            airborneRequired: parseTriStateBoolean(airborneRequired),
            midScreenRequired: parseTriStateBoolean(midScreenRequired),
            notCrouchingRequired: parseTriStateBoolean(notCrouchingRequired),
            moveTypes: moveTypes.length > 0 ? moveTypes : undefined,
        });
    }, [
        onChange,
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
        setIsEssential("");
        setCounterHitRequired("");
        setPunishCounterRequired("");
        setCornerRequired("");
        setAirborneRequired("");
        setMidScreenRequired("");
        setNotCrouchingRequired("");
        setMoveTypes([]);
        onChange({});
    }, [onChange]);

    return (
        <AppPaper variant="outlined" sx={{p: 2, mb: 2, borderRadius: 2}}>
            <AppStack direction="row" alignItems="center" justifyContent="space-between" sx={{mb: 1.5}}>
                <AppTypography variant="h6">Filters</AppTypography>
                <AppChip label={activeFilterCount === 0 ? "No active filters" : `${activeFilterCount} active`} size="small"/>
            </AppStack>

            <AppBox sx={{display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 1.5}}>
                <AppTextField label="Search by name" value={query} onChange={(event) => setQuery(event.target.value)}/>

                <AppFormControl size="small">
                    <AppInputLabel id="combo-filter-character-label">Character</AppInputLabel>
                    <AppSelect
                        labelId="combo-filter-character-label"
                        label="Character"
                        value={characterId}
                        onChange={(event) => setCharacterId(event.target.value)}
                    >
                        <AppMenuItem value="">Any character</AppMenuItem>
                        {characterOptions.map((character) => (
                            <AppMenuItem key={character.id} value={character.id}>{character.name}</AppMenuItem>
                        ))}
                    </AppSelect>
                </AppFormControl>

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
                    noOptionsText={firstMoveQuery.trim().length < 2 ? "Type 2+ characters" : "No moves found"}
                    renderInput={(params) => <AppTextField {...params} label="First move"/>}
                />

                <AppAutocomplete<{label: string; value: string}, true, false, false>
                    multiple
                    options={moveTypeOptions}
                    value={moveTypeOptions.filter((entry) => moveTypes.includes(entry.value))}
                    filterOptions={(options) => options}
                    onChange={(_, value) => setMoveTypes(value.map((entry) => entry.value))}
                    getOptionLabel={(option) => option.label}
                    isOptionEqualToValue={(option, value) => option.value === value.value}
                    renderInput={(params) => <AppTextField {...params} label="Contains move type"/>}
                />

                <AppTextField
                    label="Min difficulty"
                    type="number"
                    value={minDifficulty}
                    onChange={(event) => setMinDifficulty(event.target.value)}
                />
                <AppTextField
                    label="Max difficulty"
                    type="number"
                    value={maxDifficulty}
                    onChange={(event) => setMaxDifficulty(event.target.value)}
                />
                <AppTextField
                    label="Min damage"
                    type="number"
                    value={minDamage}
                    onChange={(event) => setMinDamage(event.target.value)}
                />
                <AppTextField
                    label="Max damage"
                    type="number"
                    value={maxDamage}
                    onChange={(event) => setMaxDamage(event.target.value)}
                />

                <AppFormControl size="small">
                    <AppInputLabel id="combo-filter-essential-label">Essential</AppInputLabel>
                    <AppSelect
                        labelId="combo-filter-essential-label"
                        label="Essential"
                        value={isEssential}
                        onChange={(event) => setIsEssential(event.target.value as TriStateBoolean)}
                    >
                        <AppMenuItem value="">Any</AppMenuItem>
                        <AppMenuItem value="true">Yes</AppMenuItem>
                        <AppMenuItem value="false">No</AppMenuItem>
                    </AppSelect>
                </AppFormControl>

                <AppFormControl size="small">
                    <AppInputLabel id="combo-filter-counter-hit-label">Counter hit</AppInputLabel>
                    <AppSelect
                        labelId="combo-filter-counter-hit-label"
                        label="Counter hit"
                        value={counterHitRequired}
                        onChange={(event) => setCounterHitRequired(event.target.value as TriStateBoolean)}
                    >
                        <AppMenuItem value="">Any</AppMenuItem>
                        <AppMenuItem value="true">Required</AppMenuItem>
                        <AppMenuItem value="false">Not required</AppMenuItem>
                    </AppSelect>
                </AppFormControl>

                <AppFormControl size="small">
                    <AppInputLabel id="combo-filter-punish-counter-label">Punish counter</AppInputLabel>
                    <AppSelect
                        labelId="combo-filter-punish-counter-label"
                        label="Punish counter"
                        value={punishCounterRequired}
                        onChange={(event) => setPunishCounterRequired(event.target.value as TriStateBoolean)}
                    >
                        <AppMenuItem value="">Any</AppMenuItem>
                        <AppMenuItem value="true">Required</AppMenuItem>
                        <AppMenuItem value="false">Not required</AppMenuItem>
                    </AppSelect>
                </AppFormControl>

                <AppFormControl size="small">
                    <AppInputLabel id="combo-filter-corner-label">Corner</AppInputLabel>
                    <AppSelect
                        labelId="combo-filter-corner-label"
                        label="Corner"
                        value={cornerRequired}
                        onChange={(event) => setCornerRequired(event.target.value as TriStateBoolean)}
                    >
                        <AppMenuItem value="">Any</AppMenuItem>
                        <AppMenuItem value="true">Required</AppMenuItem>
                        <AppMenuItem value="false">Not required</AppMenuItem>
                    </AppSelect>
                </AppFormControl>

                <AppFormControl size="small">
                    <AppInputLabel id="combo-filter-airborne-label">Airborne</AppInputLabel>
                    <AppSelect
                        labelId="combo-filter-airborne-label"
                        label="Airborne"
                        value={airborneRequired}
                        onChange={(event) => setAirborneRequired(event.target.value as TriStateBoolean)}
                    >
                        <AppMenuItem value="">Any</AppMenuItem>
                        <AppMenuItem value="true">Required</AppMenuItem>
                        <AppMenuItem value="false">Not required</AppMenuItem>
                    </AppSelect>
                </AppFormControl>

                <AppFormControl size="small">
                    <AppInputLabel id="combo-filter-mid-screen-label">Mid-screen</AppInputLabel>
                    <AppSelect
                        labelId="combo-filter-mid-screen-label"
                        label="Mid-screen"
                        value={midScreenRequired}
                        onChange={(event) => setMidScreenRequired(event.target.value as TriStateBoolean)}
                    >
                        <AppMenuItem value="">Any</AppMenuItem>
                        <AppMenuItem value="true">Required</AppMenuItem>
                        <AppMenuItem value="false">Not required</AppMenuItem>
                    </AppSelect>
                </AppFormControl>

                <AppFormControl size="small">
                    <AppInputLabel id="combo-filter-not-crouching-label">Not crouching</AppInputLabel>
                    <AppSelect
                        labelId="combo-filter-not-crouching-label"
                        label="Not crouching"
                        value={notCrouchingRequired}
                        onChange={(event) => setNotCrouchingRequired(event.target.value as TriStateBoolean)}
                    >
                        <AppMenuItem value="">Any</AppMenuItem>
                        <AppMenuItem value="true">Required</AppMenuItem>
                        <AppMenuItem value="false">Not required</AppMenuItem>
                    </AppSelect>
                </AppFormControl>
            </AppBox>

            <AppStack direction="row" spacing={1} sx={{mt: 2}}>
                <AppButton type="button" onClick={applyFilters}>Apply Filters</AppButton>
                <AppButton type="button" variant="outlined" onClick={clearFilters}>Clear</AppButton>
            </AppStack>
        </AppPaper>
    );
}
