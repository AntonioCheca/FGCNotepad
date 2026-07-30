import React from "react";
import Link from "next/link";
import {useCharacters} from "@/hooks/useCharacters";
import useOkis from "@/hooks/useOkis";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppChip} from "@/src/components/ui/AppChip";
import {AppCircularProgress} from "@/src/components/ui/AppCircularProgress";
import {AppContainer} from "@/src/components/ui/AppContainer";
import {AppFormControl} from "@/src/components/ui/AppFormControl";
import {AppInputLabel} from "@/src/components/ui/AppInputLabel";
import {AppMenuItem} from "@/src/components/ui/AppMenuItem";
import {AppPaper} from "@/src/components/ui/AppPaper";
import {AppSelect} from "@/src/components/ui/AppSelect";
import {AppTextField} from "@/src/components/ui/AppTextField";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {OkiMovePicker, type OkiMoveOption} from "@/src/components/okis/OkiMovePicker";
import {InlineNotice} from "@/src/components/ui/tactical/InlineNotice";
import {PageShell} from "@/src/components/ui/tactical/PageShell";
import {formatOkiLabel, OKI_NODE_PROPERTIES, OKI_OPTION_TYPES} from "@/src/types/oki";
import type {OkiNodeProperty, OkiOptionType, OkiProfileSummary, OkiSearchFilters} from "@/src/types/oki";

export default function OkiSearchPage() {
    const {listOkis} = useOkis();
    const {characters} = useCharacters();
    const [query, setQuery] = React.useState("");
    const [characterId, setCharacterId] = React.useState("");
    const [move, setMove] = React.useState<OkiMoveOption | null>(null);
    const [optionType, setOptionType] = React.useState("");
    const [property, setProperty] = React.useState("");
    const [flags, setFlags] = React.useState<Record<string, boolean>>({});
    const [items, setItems] = React.useState<OkiProfileSummary[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    const filters = React.useMemo<OkiSearchFilters>(() => ({
        q: query || undefined,
        characterId: characterId || undefined,
        moveId: move?.id,
        optionType: optionType ? optionType as OkiOptionType : undefined,
        property: property ? property as OkiNodeProperty : undefined,
        usesDriveRush: flags.usesDriveRush || undefined,
        autoTimed: flags.autoTimed || undefined,
        cornerOnly: flags.cornerOnly || undefined,
        worksNoBackroll: flags.worksNoBackroll || undefined,
        worksBackroll: flags.worksBackroll || undefined,
        hasFakeSetups: flags.hasFakeSetups || undefined,
    }), [characterId, flags, move?.id, optionType, property, query]);

    React.useEffect(() => {
        let canceled = false;
        const handle = window.setTimeout(() => {
            setLoading(true);
            setError(null);
            listOkis(filters)
                .then((result) => {
                    if (!canceled) {
                        setItems(result ?? []);
                    }
                })
                .catch(() => {
                    if (!canceled) {
                        setError("Could not load okis.");
                    }
                })
                .finally(() => {
                    if (!canceled) {
                        setLoading(false);
                    }
                });
        }, 220);

        return () => {
            canceled = true;
            window.clearTimeout(handle);
        };
    }, [filters, listOkis]);

    const toggleFlag = (key: string) => setFlags((current) => ({...current, [key]: !current[key]}));

    return (
        <AppContainer maxWidth={false} sx={{py: {xs: 2.25, md: 3.25}, px: {xs: 1.75, md: 3, xl: 4}}}>
            <PageShell title="Search Okis" badgeLabel={`${items.length} result${items.length === 1 ? "" : "s"}`}>
                {error ? <InlineNotice severity="error">{error}</InlineNotice> : null}
                <AppPaper variant="outlined" sx={{p: 1.4, borderRadius: 2.5, display: "grid", gap: 1, backgroundColor: "fgc.surface.base"}}>
                    <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", md: "1fr 220px 1fr 190px 190px"}, gap: 1}}>
                        <AppTextField size="small" label="Search" value={query} onChange={(event) => setQuery(event.target.value)} />
                        <SelectField label="Character" value={characterId} options={["", ...(characters as Array<{id: string; name: string}>).map((character) => character.id)]} getLabel={(value) => (characters as Array<{id: string; name: string}>).find((character) => character.id === value)?.name ?? "Any"} onChange={setCharacterId} />
                        <OkiMovePicker label="Ender move" value={move} characterId={characterId || undefined} onChange={setMove} />
                        <SelectField label="Option" value={optionType} options={["", ...OKI_OPTION_TYPES]} onChange={setOptionType} />
                        <SelectField label="Property" value={property} options={["", ...OKI_NODE_PROPERTIES]} onChange={setProperty} />
                    </AppBox>
                    <AppBox sx={{display: "flex", flexWrap: "wrap", gap: 0.5}}>
                        {[
                            ["usesDriveRush", "Drive Rush"],
                            ["autoTimed", "Auto-timed"],
                            ["cornerOnly", "Corner only"],
                            ["worksNoBackroll", "No backroll"],
                            ["worksBackroll", "Backroll"],
                            ["hasFakeSetups", "Has fake"],
                        ].map(([key, label]) => <AppChip key={key} label={label} size="small" variant={flags[key] ? "filled" : "outlined"} color={flags[key] ? "info" : "default"} onClick={() => toggleFlag(key)} />)}
                    </AppBox>
                    <AppBox sx={{display: "flex", justifyContent: "space-between", gap: 1, flexWrap: "wrap"}}>
                        <AppButton type="button" variant="outlined" color="secondary" onClick={() => { setQuery(""); setCharacterId(""); setMove(null); setOptionType(""); setProperty(""); setFlags({}); }}>Clear filters</AppButton>
                        <Link href="/okis/new" style={{textDecoration: "none"}}><AppButton type="button" variant="contained" color="primary">Create oki</AppButton></Link>
                    </AppBox>
                </AppPaper>

                {loading ? <AppBox sx={{display: "grid", placeItems: "center", py: 4}}><AppCircularProgress /></AppBox> : <OkiResults items={items} />}
            </PageShell>
        </AppContainer>
    );
}

function OkiResults({items}: {items: OkiProfileSummary[]}) {
    if (items.length === 0) {
        return <InlineNotice severity="info">No oki profiles match these filters.</InlineNotice>;
    }

    return (
        <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", lg: "1fr 1fr"}, gap: 1}}>
            {items.map((item) => (
                <AppPaper key={item.id} variant="outlined" sx={{p: 1.4, borderRadius: 2.5, display: "grid", gap: 0.8, backgroundColor: "fgc.surface.base"}}>
                    <AppBox sx={{display: "flex", justifyContent: "space-between", gap: 1, alignItems: "start"}}>
                        <AppBox>
                            <Link href={`/okis/${item.id}`} style={{color: "inherit", textDecoration: "none"}}><AppTypography variant="h6" sx={{fontWeight: 800}}>{item.move.numpadNotation}</AppTypography></Link>
                            <AppTypography variant="body2" color="text.secondary">{item.move.character.name} · Frame advantage {formatFrameAdvantage(item.frameAdvantage)}</AppTypography>
                        </AppBox>
                        <AppChip label={`${item.setupCount} setup${item.setupCount === 1 ? "" : "s"}`} size="small" color="info" variant="outlined" />
                    </AppBox>
                    <AppBox sx={{display: "flex", flexWrap: "wrap", gap: 0.45}}>
                        {item.summary.meterless ? <AppChip label="Meterless" size="small" /> : null}
                        {item.summary.driveRush ? <AppChip label="Drive Rush" size="small" color="info" /> : null}
                        {item.summary.hasFakeSetups ? <AppChip label="Fake present" size="small" color="error" /> : null}
                        {item.summary.optionTypes.map((type) => <AppChip key={type} label={formatOkiLabel(type)} size="small" variant="outlined" />)}
                        {item.summary.properties.map((prop) => <AppChip key={prop} label={formatOkiLabel(prop)} size="small" variant="outlined" color={prop.includes("FAKE") ? "error" : "default"} />)}
                    </AppBox>
                </AppPaper>
            ))}
        </AppBox>
    );
}

function formatFrameAdvantage(value: number | null): string {
    if (value === null) {
        return "Unavailable";
    }

    return value > 0 ? `+${value}` : String(value);
}

function SelectField({label, value, options, getLabel, onChange}: {label: string; value: string; options: string[]; getLabel?: (value: string) => string; onChange: (value: string) => void}) {
    const labelId = `${label.toLowerCase().replace(/\s+/g, "-")}-select`;
    return (
        <AppFormControl size="small">
            <AppInputLabel id={labelId}>{label}</AppInputLabel>
            <AppSelect<string> labelId={labelId} label={label} value={value} onChange={(event) => onChange(String(event.target.value))}>
                {options.map((option) => <AppMenuItem key={option || "any"} value={option}>{getLabel ? getLabel(option) : option ? formatOkiLabel(option) : "Any"}</AppMenuItem>)}
            </AppSelect>
        </AppFormControl>
    );
}
