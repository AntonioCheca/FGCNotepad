import React from "react";
import AuthContext from "@/services/AuthContext";
import {useCharacters} from "@/hooks/useCharacters";
import useMoves from "@/hooks/useMoves";
import {useSituations} from "@/hooks/useSituations";
import {AppAlert} from "@/src/components/ui/AppAlert";
import {AppAutocomplete} from "@/src/components/ui/AppAutocomplete";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppCheckbox} from "@/src/components/ui/AppCheckbox";
import {AppCircularProgress} from "@/src/components/ui/AppCircularProgress";
import {AppContainer} from "@/src/components/ui/AppContainer";
import {AppFormControl} from "@/src/components/ui/AppFormControl";
import {AppFormControlLabel} from "@/src/components/ui/AppFormControlLabel";
import {AppInputLabel} from "@/src/components/ui/AppInputLabel";
import {AppMenuItem} from "@/src/components/ui/AppMenuItem";
import {AppSelect} from "@/src/components/ui/AppSelect";
import {AppSnackbar} from "@/src/components/ui/AppSnackbar";
import {AppTable} from "@/src/components/ui/AppTable";
import {AppTableBody} from "@/src/components/ui/AppTableBody";
import {AppTableCell} from "@/src/components/ui/AppTableCell";
import {AppTableContainer} from "@/src/components/ui/AppTableContainer";
import {AppTableHead} from "@/src/components/ui/AppTableHead";
import {AppTableRow} from "@/src/components/ui/AppTableRow";
import {AppTextField} from "@/src/components/ui/AppTextField";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {InlineNotice} from "@/src/components/ui/tactical/InlineNotice";
import {PageShell} from "@/src/components/ui/tactical/PageShell";
import {SectionCard} from "@/src/components/ui/tactical/SectionCard";
import type {ComboMoveSearchOption} from "@/src/components/combos/filters/comboFilterTypes";
import type {SituationJuggleAltitude, SituationPayload, SituationSummary, SituationTypeOption} from "@/src/types/situation";

interface CharacterOption { id: string; name: string }

interface SituationDraft {
    typeId: string;
    name: string;
    description: string;
    opponentCharacterId: string;
    move: ComboMoveSearchOption | null;
    moveQuery: string;
    frameAdvantage: string;
    punishWindowFrames: string;
    startingDistanceMeters: string;
    opponentState: "grounded" | "airborne";
    initialJuggleAltitude: "" | SituationJuggleAltitude;
    cornerState: "midscreen" | "corner" | "either";
    counterHitState: "normal" | "counter_hit" | "punish_counter";
    notes: string;
    isVerified: boolean;
    isArchived: boolean;
}

const emptyDraft: SituationDraft = {
    typeId: "",
    name: "",
    description: "",
    opponentCharacterId: "",
    move: null,
    moveQuery: "",
    frameAdvantage: "",
    punishWindowFrames: "",
    startingDistanceMeters: "",
    opponentState: "grounded",
    initialJuggleAltitude: "",
    cornerState: "either",
    counterHitState: "normal",
    notes: "",
    isVerified: false,
    isArchived: false,
};

function toNumberOrNull(value: string): number | null {
    const trimmed = value.trim();
    if (trimmed === "") {
        return null;
    }
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
}

function draftFromSituation(situation: SituationSummary): SituationDraft {
    return {
        typeId: String(situation.type.id),
        name: situation.name,
        description: situation.description,
        opponentCharacterId: situation.opponentCharacter?.id ?? "",
        move: situation.move ? {id: situation.move.id, summary: situation.move.name} : null,
        moveQuery: situation.move?.name ?? "",
        frameAdvantage: situation.frameAdvantage === null ? "" : String(situation.frameAdvantage),
        punishWindowFrames: situation.punishWindowFrames === null ? "" : String(situation.punishWindowFrames),
        startingDistanceMeters: situation.startingDistanceMeters === null ? "" : String(situation.startingDistanceMeters),
        opponentState: situation.opponentState,
        initialJuggleAltitude: situation.initialJuggleAltitude ?? "",
        cornerState: situation.cornerState,
        counterHitState: situation.counterHitState,
        notes: situation.notes ?? "",
        isVerified: situation.isVerified,
        isArchived: situation.isArchived,
    };
}

function payloadFromDraft(draft: SituationDraft): SituationPayload {
    return {
        typeId: Number(draft.typeId),
        name: draft.name.trim(),
        description: draft.description.trim(),
        opponentCharacterId: draft.opponentCharacterId || null,
        moveId: draft.move?.id ?? null,
        frameAdvantage: toNumberOrNull(draft.frameAdvantage),
        punishWindowFrames: toNumberOrNull(draft.punishWindowFrames),
        startingDistanceMeters: toNumberOrNull(draft.startingDistanceMeters),
        opponentState: draft.opponentState,
        initialJuggleAltitude: draft.opponentState === "airborne" && draft.initialJuggleAltitude !== "" ? draft.initialJuggleAltitude : null,
        cornerState: draft.cornerState,
        counterHitState: draft.counterHitState,
        notes: draft.notes.trim() || null,
        isVerified: draft.isVerified,
        isArchived: draft.isArchived,
    };
}

function errorMessage(error: unknown): string {
    if (typeof error === "object" && error !== null) {
        const response = error as {response?: {data?: {message?: string; error?: string}}; message?: string};
        return response.response?.data?.message ?? response.response?.data?.error ?? response.message ?? "Unable to save situation.";
    }
    return "Unable to save situation.";
}

export default function AdminSituationsPage() {
    const authContext = React.useContext(AuthContext);
    const {characters} = useCharacters();
    const {searchMoves} = useMoves();
    const {fetchSituationTypes, fetchSituations, createSituation, updateSituation, archiveSituation} = useSituations();
    const [types, setTypes] = React.useState<SituationTypeOption[]>([]);
    const [situations, setSituations] = React.useState<SituationSummary[]>([]);
    const [draft, setDraft] = React.useState<SituationDraft>(emptyDraft);
    const [editingId, setEditingId] = React.useState<number | null>(null);
    const [moveOptions, setMoveOptions] = React.useState<ComboMoveSearchOption[]>([]);
    const [loadingPage, setLoadingPage] = React.useState(true);
    const [saving, setSaving] = React.useState(false);
    const [toast, setToast] = React.useState<{severity: "success" | "error"; message: string} | null>(null);

    if (!authContext) {
        throw new Error("AuthContext must be used within an AuthProvider");
    }

    const {loading, isAuthenticated, canModerate} = authContext;
    const characterOptions = React.useMemo<CharacterOption[]>(() => characters.map((character) => ({id: character.id, name: character.name})), [characters]);
    const selectedOpponent = characterOptions.find((character) => character.id === draft.opponentCharacterId) ?? null;
    const selectedType = types.find((type) => String(type.id) === draft.typeId) ?? null;
    const moveForbidden = selectedType?.code === "drive_impact_pc_state" || selectedType?.code === "stun";

    const loadData = React.useCallback(async () => {
        setLoadingPage(true);
        try {
            const [nextTypes, nextSituations] = await Promise.all([fetchSituationTypes(), fetchSituations({includeArchived: true})]);
            setTypes(nextTypes);
            setSituations(nextSituations);
            setDraft((current) => current.typeId ? current : {...current, typeId: String(nextTypes[0]?.id ?? "")});
        } catch (error) {
            setToast({severity: "error", message: errorMessage(error)});
        } finally {
            setLoadingPage(false);
        }
    }, [fetchSituationTypes, fetchSituations]);

    React.useEffect(() => {
        if (loading || !isAuthenticated || !canModerate) {
            return;
        }
        void loadData();
    }, [canModerate, isAuthenticated, loadData, loading]);

    React.useEffect(() => {
        if (draft.moveQuery.trim().length < 2 || moveForbidden) {
            setMoveOptions([]);
            return;
        }
        let cancelled = false;
        searchMoves(draft.moveQuery, draft.opponentCharacterId || undefined)
            .then((result: unknown) => {
                if (!cancelled && Array.isArray(result)) {
                    setMoveOptions(result.filter((entry): entry is ComboMoveSearchOption => {
                        if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
                            return false;
                        }

                        const record = entry as Record<string, unknown>;
                        return typeof record.id === "string" && typeof record.summary === "string";
                    }));
                }
            })
            .catch(() => !cancelled && setMoveOptions([]));
        return () => { cancelled = true; };
    }, [draft.moveQuery, draft.opponentCharacterId, moveForbidden, searchMoves]);

    const resetDraft = () => {
        setEditingId(null);
        setDraft({...emptyDraft, typeId: String(types[0]?.id ?? "")});
        setMoveOptions([]);
    };

    const handleSubmit = async () => {
        setSaving(true);
        try {
            const payload = payloadFromDraft(draft);
            if (editingId === null) {
                await createSituation(payload);
                setToast({severity: "success", message: "Situation created."});
            } else {
                await updateSituation(editingId, payload);
                setToast({severity: "success", message: "Situation updated."});
            }
            resetDraft();
            await loadData();
        } catch (error) {
            setToast({severity: "error", message: errorMessage(error)});
        } finally {
            setSaving(false);
        }
    };

    if (loading || loadingPage) {
        return <AppContainer maxWidth={false}><AppCircularProgress /></AppContainer>;
    }
    if (!isAuthenticated) {
        return null;
    }
    if (!canModerate) {
        return <AppContainer maxWidth={false}><AppTypography>You do not have permission to manage situations.</AppTypography></AppContainer>;
    }

    return (
        <AppContainer maxWidth={false} sx={{py: {xs: 2.25, md: 3.25}, px: {xs: 1.75, md: 3, xl: 4}}}>
            <PageShell title="Situation Management" badgeLabel={`${situations.length} saved`}>
                <SectionCard title={editingId === null ? "Create Situation" : "Edit Situation"} tone="raised" variant="input">
                    <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", md: "repeat(4, minmax(0, 1fr))"}, gap: 1}}>
                        <AppFormControl size="small" fullWidth>
                            <AppInputLabel id="situation-type-label">Type</AppInputLabel>
                            <AppSelect labelId="situation-type-label" label="Type" value={draft.typeId} onChange={(event) => setDraft((current) => ({...current, typeId: String(event.target.value), move: null, moveQuery: ""}))}>
                                {types.map((type) => <AppMenuItem key={type.id} value={String(type.id)}>{type.name}</AppMenuItem>)}
                            </AppSelect>
                        </AppFormControl>
                        <AppTextField label="Name" size="small" value={draft.name} onChange={(event) => setDraft((current) => ({...current, name: event.target.value}))} />
                        <AppAutocomplete<CharacterOption, false, false, false> options={characterOptions} value={selectedOpponent} onChange={(_, value) => setDraft((current) => ({...current, opponentCharacterId: value?.id ?? ""}))} getOptionLabel={(option) => option.name} isOptionEqualToValue={(option, value) => option.id === value.id} renderInput={(params) => <AppTextField {...params} label="Opponent" size="small" />} />
                        <AppAutocomplete<ComboMoveSearchOption, false, false, false> disabled={moveForbidden} options={moveOptions} value={draft.move} inputValue={draft.moveQuery} filterOptions={(options) => options} onChange={(_, value) => setDraft((current) => ({...current, move: value}))} onInputChange={(_, value) => setDraft((current) => ({...current, moveQuery: value}))} getOptionLabel={(option) => option.summary} isOptionEqualToValue={(option, value) => option.id === value.id} renderInput={(params) => <AppTextField {...params} label="Move" size="small" />} />
                        <AppTextField label="Frame advantage" size="small" value={draft.frameAdvantage} onChange={(event) => setDraft((current) => ({...current, frameAdvantage: event.target.value}))} />
                        <AppTextField label="Punish window" size="small" value={draft.punishWindowFrames} onChange={(event) => setDraft((current) => ({...current, punishWindowFrames: event.target.value}))} />
                        <AppTextField label="Distance metres" size="small" value={draft.startingDistanceMeters} onChange={(event) => setDraft((current) => ({...current, startingDistanceMeters: event.target.value}))} />
                        <AppFormControl size="small" fullWidth><AppInputLabel id="opponent-state-label">Opponent State</AppInputLabel><AppSelect labelId="opponent-state-label" label="Opponent State" value={draft.opponentState} onChange={(event) => setDraft((current) => ({...current, opponentState: event.target.value as SituationDraft["opponentState"], initialJuggleAltitude: event.target.value === "grounded" ? "" : current.initialJuggleAltitude}))}><AppMenuItem value="grounded">Grounded</AppMenuItem><AppMenuItem value="airborne">Airborne</AppMenuItem></AppSelect></AppFormControl>
                        <AppFormControl size="small" fullWidth disabled={draft.opponentState !== "airborne"}><AppInputLabel id="altitude-label">Juggle Altitude</AppInputLabel><AppSelect labelId="altitude-label" label="Juggle Altitude" value={draft.initialJuggleAltitude} onChange={(event) => setDraft((current) => ({...current, initialJuggleAltitude: event.target.value as SituationDraft["initialJuggleAltitude"]}))}><AppMenuItem value="">Unclassified</AppMenuItem><AppMenuItem value="low">Low</AppMenuItem><AppMenuItem value="medium">Medium</AppMenuItem><AppMenuItem value="high">High</AppMenuItem></AppSelect></AppFormControl>
                        <AppFormControl size="small" fullWidth><AppInputLabel id="corner-state-label">Corner State</AppInputLabel><AppSelect labelId="corner-state-label" label="Corner State" value={draft.cornerState} onChange={(event) => setDraft((current) => ({...current, cornerState: event.target.value as SituationDraft["cornerState"]}))}><AppMenuItem value="either">Either</AppMenuItem><AppMenuItem value="midscreen">Midscreen</AppMenuItem><AppMenuItem value="corner">Corner</AppMenuItem></AppSelect></AppFormControl>
                        <AppFormControl size="small" fullWidth><AppInputLabel id="counter-state-label">Counter State</AppInputLabel><AppSelect labelId="counter-state-label" label="Counter State" value={draft.counterHitState} onChange={(event) => setDraft((current) => ({...current, counterHitState: event.target.value as SituationDraft["counterHitState"]}))}><AppMenuItem value="normal">Normal</AppMenuItem><AppMenuItem value="counter_hit">Counter Hit</AppMenuItem><AppMenuItem value="punish_counter">Punish Counter</AppMenuItem></AppSelect></AppFormControl>
                    </AppBox>
                    <AppBox sx={{display: "grid", gap: 1, mt: 1}}>
                        <AppTextField label="Description" size="small" value={draft.description} onChange={(event) => setDraft((current) => ({...current, description: event.target.value}))} />
                        <AppTextField label="Notes" size="small" multiline minRows={2} value={draft.notes} onChange={(event) => setDraft((current) => ({...current, notes: event.target.value}))} />
                        <AppBox sx={{display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap"}}>
                            <AppFormControlLabel control={<AppCheckbox checked={draft.isVerified} onChange={(event) => setDraft((current) => ({...current, isVerified: event.target.checked}))} />} label="Verified" />
                            <AppFormControlLabel control={<AppCheckbox checked={draft.isArchived} onChange={(event) => setDraft((current) => ({...current, isArchived: event.target.checked}))} />} label="Archived" />
                            <AppButton type="button" disabled={saving || draft.name.trim() === "" || draft.typeId === ""} onClick={() => void handleSubmit()}>{saving ? "Saving..." : editingId === null ? "Create" : "Save"}</AppButton>
                            <AppButton type="button" variant="outlined" color="secondary" onClick={resetDraft}>Reset</AppButton>
                        </AppBox>
                    </AppBox>
                </SectionCard>

                <SectionCard title="Saved Situations" variant="review">
                    {situations.length === 0 ? <InlineNotice severity="info">No situations have been saved.</InlineNotice> : (
                        <AppTableContainer sx={{maxHeight: "calc(100vh - 420px)", backgroundColor: "fgc.surface.base"}}>
                            <AppTable stickyHeader size="small">
                                <AppTableHead><AppTableRow><AppTableCell>Name</AppTableCell><AppTableCell>Type</AppTableCell><AppTableCell>State</AppTableCell><AppTableCell>Move</AppTableCell><AppTableCell>Actions</AppTableCell></AppTableRow></AppTableHead>
                                <AppTableBody>
                                    {situations.map((situation) => <AppTableRow key={situation.id} hover><AppTableCell>{situation.name}{situation.isArchived ? " (archived)" : ""}</AppTableCell><AppTableCell>{situation.type.name}</AppTableCell><AppTableCell>{situation.opponentState}{situation.initialJuggleAltitude ? ` ${situation.initialJuggleAltitude}` : ""}, {situation.cornerState}, {situation.counterHitState}</AppTableCell><AppTableCell>{situation.move?.name ?? "-"}</AppTableCell><AppTableCell><AppBox sx={{display: "flex", gap: 0.75}}><AppButton type="button" size="small" variant="outlined" onClick={() => { setEditingId(situation.id); setDraft(draftFromSituation(situation)); }}>Edit</AppButton><AppButton type="button" size="small" color="error" variant="outlined" disabled={situation.isArchived} onClick={() => archiveSituation(situation.id).then(loadData).catch((error) => setToast({severity: "error", message: errorMessage(error)}))}>Archive</AppButton></AppBox></AppTableCell></AppTableRow>)}
                                </AppTableBody>
                            </AppTable>
                        </AppTableContainer>
                    )}
                </SectionCard>
            </PageShell>
            <AppSnackbar open={toast !== null} autoHideDuration={3000} onClose={() => setToast(null)} anchorOrigin={{vertical: "bottom", horizontal: "right"}}>
                <AppAlert severity={toast?.severity ?? "success"} variant="filled" onClose={() => setToast(null)} sx={{width: "100%"}}>{toast?.message}</AppAlert>
            </AppSnackbar>
        </AppContainer>
    );
}
