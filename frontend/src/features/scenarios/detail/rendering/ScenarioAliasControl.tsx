import React from "react";

import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppTextField} from "@/src/components/ui/AppTextField";
import {useScenarios} from "@/hooks/useScenarios";

interface ScenarioAliasControlProps {
    scenarioId: string;
    alias: string | null;
}

function errorMessage(error: unknown): string {
    const response = (error as {response?: {data?: {error?: unknown}}})?.response;
    return typeof response?.data?.error === "string" ? response.data.error : "The alias couldn't be saved.";
}

// Moderators name a scenario so research articles can embed it with ![Alt](scenario:<alias>).
export function ScenarioAliasControl({scenarioId, alias}: ScenarioAliasControlProps) {
    const {setScenarioAlias} = useScenarios();
    const [savedAlias, setSavedAlias] = React.useState(alias);
    const [draft, setDraft] = React.useState(alias ?? "");
    const [saving, setSaving] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        setSavedAlias(alias);
        setDraft(alias ?? "");
    }, [alias, scenarioId]);

    const save = async (): Promise<void> => {
        setSaving(true);
        setError(null);
        try {
            const response = await setScenarioAlias(scenarioId, draft.trim() === "" ? null : draft);
            setSavedAlias(response.alias);
            setDraft(response.alias ?? "");
        } catch (saveError) {
            setError(errorMessage(saveError));
        } finally {
            setSaving(false);
        }
    };

    const helperText = error ?? (savedAlias ? `Embed with ![Alt](scenario:${savedAlias})` : " ");

    return (
        <AppBox
            component="form"
            onSubmit={(event: React.FormEvent) => {
                event.preventDefault();
                void save();
            }}
            sx={{display: "flex", flexWrap: "wrap", alignItems: "flex-start", gap: 1, minWidth: 0}}
        >
            <AppTextField
                label="Article alias"
                size="small"
                value={draft}
                error={error !== null}
                helperText={helperText}
                onChange={(event) => setDraft(event.target.value)}
                sx={{flex: {xs: "1 1 100%", sm: "0 1 360px"}, minWidth: 0}}
            />
            <AppButton type="submit" variant="outlined" disabled={saving} sx={{width: {xs: "100%", sm: "auto"}, mt: {sm: 0.25}}}>
                {saving ? "Saving..." : "Save alias"}
            </AppButton>
        </AppBox>
    );
}
