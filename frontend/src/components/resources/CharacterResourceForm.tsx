import React from "react";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppCheckbox} from "@/src/components/ui/AppCheckbox";
import {AppFormControl} from "@/src/components/ui/AppFormControl";
import {AppFormControlLabel} from "@/src/components/ui/AppFormControlLabel";
import {AppInputLabel} from "@/src/components/ui/AppInputLabel";
import {AppMenuItem} from "@/src/components/ui/AppMenuItem";
import {AppSelect} from "@/src/components/ui/AppSelect";
import {AppTextField} from "@/src/components/ui/AppTextField";
import {
    CHARACTER_RESOURCE_KIND_LABELS,
    CharacterResource,
    CharacterResourceInput,
    CharacterResourceKind,
    CharacterResourceSpendBehavior,
} from "@/src/types/characterResource";

interface CharacterResourceFormProps {
    resource?: CharacterResource;
    busy: boolean;
    submitLabel: string;
    onSubmit: (input: CharacterResourceInput) => void;
    onDelete?: () => void;
}

const EMPTY_DRAFT: CharacterResourceInput = {
    name: "",
    kind: "stock",
    spend_behavior: "consumed",
    starts_with: 0,
    min_status: 0,
    max_status: null,
    resets_each_round: false,
    extractor_key: "",
    extractor_source: "named",
};

function draftFrom(resource?: CharacterResource): CharacterResourceInput {
    if (!resource) {
        return EMPTY_DRAFT;
    }

    return {
        name: resource.name,
        kind: resource.kind,
        spend_behavior: resource.spend_behavior,
        starts_with: resource.starts_with,
        min_status: resource.min_status,
        max_status: resource.max_status,
        resets_each_round: resource.resets_each_round,
        extractor_key: resource.extractor_key ?? "",
        extractor_source: resource.extractor_source,
    };
}

function toNumber(value: string): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 0;
}

export function CharacterResourceForm({resource, busy, submitLabel, onSubmit, onDelete}: CharacterResourceFormProps) {
    const [draft, setDraft] = React.useState<CharacterResourceInput>(() => draftFrom(resource));
    const isState = draft.kind === "state";
    const update = (patch: Partial<CharacterResourceInput>) => setDraft((current) => ({...current, ...patch}));

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        onSubmit(draft);
        if (!resource) {
            setDraft(EMPTY_DRAFT);
        }
    };

    return (
        <AppBox component="form" onSubmit={handleSubmit} sx={{display: "grid", gap: 1, border: "1px solid", borderColor: "fgc.border.default", borderRadius: 1.25, p: 1.25, backgroundColor: "fgc.surface.subtle"}}>
            <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", md: "minmax(160px, 1fr) minmax(220px, 1.2fr) minmax(160px, 1fr)"}, gap: 1}}>
                <AppTextField label="Name" size="small" required value={draft.name} onChange={(event) => update({name: event.target.value})} />
                <AppFormControl size="small">
                    <AppInputLabel id={`resource-kind-${resource?.id ?? "new"}`}>Type</AppInputLabel>
                    <AppSelect
                        labelId={`resource-kind-${resource?.id ?? "new"}`}
                        label="Type"
                        value={draft.kind}
                        onChange={(event) => update({kind: event.target.value as CharacterResourceKind})}
                    >
                        {Object.entries(CHARACTER_RESOURCE_KIND_LABELS).map(([value, label]) => <AppMenuItem key={value} value={value}>{label}</AppMenuItem>)}
                    </AppSelect>
                </AppFormControl>
                <AppFormControl size="small" disabled={isState}>
                    <AppInputLabel id={`resource-spend-${resource?.id ?? "new"}`}>When used</AppInputLabel>
                    <AppSelect
                        labelId={`resource-spend-${resource?.id ?? "new"}`}
                        label="When used"
                        value={draft.spend_behavior}
                        onChange={(event) => update({spend_behavior: event.target.value as CharacterResourceSpendBehavior})}
                    >
                        <AppMenuItem value="consumed">Consumed</AppMenuItem>
                        <AppMenuItem value="maintained">Maintained</AppMenuItem>
                    </AppSelect>
                </AppFormControl>
            </AppBox>
            <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "repeat(2, minmax(0, 1fr))", md: "repeat(3, minmax(0, 120px)) minmax(180px, 1fr) 140px"}, gap: 1}}>
                <AppTextField label="Starts with" size="small" value={draft.starts_with} onChange={(event) => update({starts_with: toNumber(event.target.value)})} inputProps={{inputMode: "numeric"}} />
                <AppTextField label="Minimum" size="small" disabled={isState} value={isState ? 0 : draft.min_status} onChange={(event) => update({min_status: toNumber(event.target.value)})} inputProps={{inputMode: "numeric"}} />
                <AppTextField label="Maximum" size="small" disabled={isState} value={isState ? "" : draft.max_status ?? ""} onChange={(event) => update({max_status: event.target.value.trim() === "" ? null : toNumber(event.target.value)})} inputProps={{inputMode: "numeric"}} />
                <AppTextField label="Extractor name" size="small" value={draft.extractor_key} onChange={(event) => update({extractor_key: event.target.value})} />
                <AppFormControl size="small">
                    <AppInputLabel id={`resource-source-${resource?.id ?? "new"}`}>Extractor field</AppInputLabel>
                    <AppSelect
                        labelId={`resource-source-${resource?.id ?? "new"}`}
                        label="Extractor field"
                        value={draft.extractor_source}
                        onChange={(event) => update({extractor_source: event.target.value as CharacterResourceInput["extractor_source"]})}
                    >
                        <AppMenuItem value="named">Named resource</AppMenuItem>
                        <AppMenuItem value="install">Install</AppMenuItem>
                    </AppSelect>
                </AppFormControl>
            </AppBox>
            <AppBox sx={{display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1, justifyContent: "space-between"}}>
                <AppFormControlLabel
                    label="Resets at round start"
                    control={<AppCheckbox size="small" checked={draft.resets_each_round} onChange={(event) => update({resets_each_round: event.target.checked})} />}
                />
                <AppBox sx={{display: "flex", gap: 1}}>
                    {onDelete ? <AppButton type="button" variant="outlined" color="error" disabled={busy} onClick={onDelete}>Delete</AppButton> : null}
                    <AppButton type="submit" variant="contained" disabled={busy || draft.name.trim() === ""}>{submitLabel}</AppButton>
                </AppBox>
            </AppBox>
        </AppBox>
    );
}
