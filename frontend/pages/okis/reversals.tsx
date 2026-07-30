import React from "react";
import {useCharacters} from "@/hooks/useCharacters";
import useOkis from "@/hooks/useOkis";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppChip} from "@/src/components/ui/AppChip";
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
import {formatOkiLabel, REVERSAL_PROPERTIES, REVERSAL_TYPES} from "@/src/types/oki";
import type {CharacterReversal, ReversalProperty, ReversalType} from "@/src/types/oki";

interface ReversalDraft {
    id: number | null;
    characterId: string;
    move: OkiMoveOption | null;
    startup: string;
    reversalType: ReversalType;
    properties: ReversalProperty[];
}

const emptyDraft: ReversalDraft = {id: null, characterId: "", move: null, startup: "", reversalType: "OD_REVERSAL", properties: []};

export default function ReversalsPage() {
    const {characters} = useCharacters();
    const {listReversals, createReversal, updateReversal, deleteReversal} = useOkis();
    const [items, setItems] = React.useState<CharacterReversal[]>([]);
    const [draft, setDraft] = React.useState<ReversalDraft>(emptyDraft);
    const [error, setError] = React.useState<string | null>(null);

    const load = React.useCallback(() => {
        listReversals().then(setItems).catch(() => setError("Could not load reversals."));
    }, [listReversals]);

    React.useEffect(() => {
        load();
    }, [load]);

    const save = async () => {
        setError(null);
        if (!draft.characterId || !draft.move || !draft.startup) {
            setError("Character, move and startup are required.");
            return;
        }
        const payload = {characterId: draft.characterId, moveId: draft.move.id, startup: Number.parseInt(draft.startup, 10), reversalType: draft.reversalType, properties: draft.properties};
        try {
            if (draft.id) {
                await updateReversal(draft.id, payload);
            } else {
                await createReversal(payload);
            }
            setDraft(emptyDraft);
            load();
        } catch {
            setError("Could not save reversal.");
        }
    };

    return (
        <AppContainer maxWidth={false} sx={{py: {xs: 2.25, md: 3.25}, px: {xs: 1.75, md: 3, xl: 4}}}>
            <PageShell title="Character Reversals" badgeLabel={`${items.length} reversal${items.length === 1 ? "" : "s"}`}>
                {error ? <InlineNotice severity="error">{error}</InlineNotice> : null}
                <AppPaper variant="outlined" sx={{p: 1.4, borderRadius: 2.5, display: "grid", gap: 1, backgroundColor: "fgc.surface.base"}}>
                    <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", md: "220px minmax(260px, 1fr) 110px 180px auto"}, gap: 1, alignItems: "center"}}>
                        <SelectField label="Character" value={draft.characterId} options={["", ...(characters as Array<{id: string; name: string}>).map((character) => character.id)]} getLabel={(value) => (characters as Array<{id: string; name: string}>).find((character) => character.id === value)?.name ?? "Select"} onChange={(value) => setDraft((current) => ({...current, characterId: value, move: null}))} />
                        <OkiMovePicker label="Reversal move" value={draft.move} characterId={draft.characterId || undefined} onChange={(move) => setDraft((current) => ({...current, move}))} />
                        <AppTextField size="small" label="Startup" value={draft.startup} onChange={(event) => setDraft((current) => ({...current, startup: event.target.value}))} />
                        <SelectField label="Type" value={draft.reversalType} options={REVERSAL_TYPES} onChange={(value) => setDraft((current) => ({...current, reversalType: value as ReversalType}))} />
                        <AppButton type="button" variant="contained" color="primary" onClick={save}>{draft.id ? "Save" : "Create"}</AppButton>
                    </AppBox>
                    <AppBox sx={{display: "flex", flexWrap: "wrap", gap: 0.5}}>
                        {REVERSAL_PROPERTIES.map((property) => <AppChip key={property} label={formatOkiLabel(property)} size="small" variant={draft.properties.includes(property) ? "filled" : "outlined"} color={draft.properties.includes(property) ? "info" : "default"} onClick={() => setDraft((current) => ({...current, properties: toggle(current.properties, property)}))} />)}
                    </AppBox>
                </AppPaper>

                <AppBox sx={{display: "grid", gap: 1}}>
                    {items.map((item) => (
                        <AppPaper key={item.id} variant="outlined" sx={{p: 1.2, borderRadius: 2.5, display: "grid", gridTemplateColumns: {xs: "1fr", md: "1fr auto"}, gap: 1, backgroundColor: "fgc.surface.base"}}>
                            <AppBox>
                                <AppTypography variant="subtitle1" sx={{fontWeight: 800}}>{item.character.name} · {item.move.numpadNotation}</AppTypography>
                                <AppTypography variant="body2" color="text.secondary">{formatOkiLabel(item.reversalType)} · {item.startup}f startup</AppTypography>
                                <AppBox sx={{display: "flex", flexWrap: "wrap", gap: 0.4, mt: 0.5}}>{item.properties.map((property) => <AppChip key={property} size="small" variant="outlined" label={formatOkiLabel(property)} />)}</AppBox>
                            </AppBox>
                            <AppBox sx={{display: "flex", gap: 0.5, alignItems: "center"}}>
                                <AppButton type="button" variant="outlined" color="secondary" onClick={() => setDraft({id: item.id, characterId: item.character.id, move: {id: item.move.id, summary: item.move.name}, startup: String(item.startup), reversalType: item.reversalType, properties: item.properties})}>Edit</AppButton>
                                <AppButton type="button" variant="text" color="secondary" onClick={() => deleteReversal(item.id).then(load).catch(() => setError("Could not delete reversal."))}>Delete</AppButton>
                            </AppBox>
                        </AppPaper>
                    ))}
                </AppBox>
            </PageShell>
        </AppContainer>
    );
}

function SelectField({label, value, options, getLabel, onChange}: {label: string; value: string; options: string[]; getLabel?: (value: string) => string; onChange: (value: string) => void}) {
    const labelId = `${label.toLowerCase().replace(/\s+/g, "-")}-select`;
    return (
        <AppFormControl size="small">
            <AppInputLabel id={labelId}>{label}</AppInputLabel>
            <AppSelect<string> labelId={labelId} label={label} value={value} onChange={(event) => onChange(String(event.target.value))}>
                {options.map((option) => <AppMenuItem key={option || "empty"} value={option}>{getLabel ? getLabel(option) : formatOkiLabel(option)}</AppMenuItem>)}
            </AppSelect>
        </AppFormControl>
    );
}

function toggle<T>(values: T[], value: T): T[] {
    return values.includes(value) ? values.filter((current) => current !== value) : [...values, value];
}
