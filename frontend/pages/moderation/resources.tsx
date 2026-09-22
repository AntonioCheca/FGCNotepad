import React from "react";
import AuthContext from "@/services/AuthContext";
import {useCharacters} from "@/hooks/useCharacters";
import {useCharacterResources} from "@/hooks/useCharacterResources";
import {CharacterResourceForm} from "@/src/components/resources/CharacterResourceForm";
import {AppAlert} from "@/src/components/ui/AppAlert";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppCircularProgress} from "@/src/components/ui/AppCircularProgress";
import {AppContainer} from "@/src/components/ui/AppContainer";
import {AppFormControl} from "@/src/components/ui/AppFormControl";
import {AppInputLabel} from "@/src/components/ui/AppInputLabel";
import {AppMenuItem} from "@/src/components/ui/AppMenuItem";
import {AppSelect} from "@/src/components/ui/AppSelect";
import {AppSnackbar} from "@/src/components/ui/AppSnackbar";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {InlineNotice} from "@/src/components/ui/tactical/InlineNotice";
import {PageShell} from "@/src/components/ui/tactical/PageShell";
import {SectionCard} from "@/src/components/ui/tactical/SectionCard";
import {CharacterResource, CharacterResourceInput} from "@/src/types/characterResource";

function errorMessage(error: unknown, fallback: string): string {
    const maybe = error as {response?: {data?: {error?: string}}; message?: string};

    return maybe.response?.data?.error || maybe.message || fallback;
}

export default function CharacterResourcesPage() {
    const authContext = React.useContext(AuthContext);
    const {characters, loading: loadingCharacters} = useCharacters();
    const {listResources, createResource, updateResource, deleteResource} = useCharacterResources();
    const [characterId, setCharacterId] = React.useState("");
    const [resources, setResources] = React.useState<CharacterResource[]>([]);
    const [loadingResources, setLoadingResources] = React.useState(false);
    const [busy, setBusy] = React.useState(false);
    const [toast, setToast] = React.useState<{open: boolean; severity: "success" | "error"; message: string}>({open: false, severity: "success", message: ""});

    if (!authContext) {
        throw new Error("AuthContext must be used within an AuthProvider");
    }

    const {loading, isAuthenticated, canModerate} = authContext;
    const selectedCharacter = characters.find((character) => character.id === characterId) ?? null;

    const loadResources = React.useCallback(async (characterName: string) => {
        setLoadingResources(true);
        try {
            setResources(await listResources(characterName));
        } catch (error: unknown) {
            setToast({open: true, severity: "error", message: errorMessage(error, "Unable to load resources.")});
        } finally {
            setLoadingResources(false);
        }
    }, [listResources]);

    const handleCharacterChange = (nextId: string) => {
        setCharacterId(nextId);
        const character = characters.find((candidate) => candidate.id === nextId);
        if (character) {
            void loadResources(character.name);
        }
    };

    const run = async (action: () => Promise<void>, successMessage: string) => {
        setBusy(true);
        try {
            await action();
            if (selectedCharacter) {
                await loadResources(selectedCharacter.name);
            }
            setToast({open: true, severity: "success", message: successMessage});
        } catch (error: unknown) {
            setToast({open: true, severity: "error", message: errorMessage(error, "Unable to save resource.")});
        } finally {
            setBusy(false);
        }
    };

    if (loading) {
        return <AppContainer maxWidth={false}><AppCircularProgress/></AppContainer>;
    }

    if (!isAuthenticated) {
        return null;
    }

    if (!canModerate) {
        return (
            <AppContainer maxWidth={false}>
                <AppTypography variant="h4" gutterBottom>Character Resources</AppTypography>
                <AppTypography>You do not have permission to access moderation tools.</AppTypography>
            </AppContainer>
        );
    }

    return (
        <AppContainer maxWidth={false} sx={{py: {xs: 2.25, md: 3.25}, px: {xs: 1.75, md: 3, xl: 4}}}>
            <PageShell title="Character Resources">
                <SectionCard title="Character" variant="review" tone="raised">
                    <AppFormControl size="small" sx={{minWidth: {xs: 0, sm: 260}, width: {xs: "100%", sm: "auto"}}}>
                        <AppInputLabel id="resource-character-label">Character</AppInputLabel>
                        <AppSelect labelId="resource-character-label" label="Character" value={characterId} onChange={(event) => handleCharacterChange(String(event.target.value))} disabled={loadingCharacters}>
                            {characters.map((character) => <AppMenuItem key={character.id} value={character.id}>{character.name}</AppMenuItem>)}
                        </AppSelect>
                    </AppFormControl>
                </SectionCard>

                {selectedCharacter ? (
                    <>
                        <SectionCard title={`${selectedCharacter.name} resources`} variant="review">
                            {loadingResources ? (
                                <AppBox sx={{display: "flex", justifyContent: "center", py: 2}}><AppCircularProgress/></AppBox>
                            ) : resources.length === 0 ? (
                                <InlineNotice severity="info">No resources defined.</InlineNotice>
                            ) : (
                                <AppBox sx={{display: "grid", gap: 1}}>
                                    {resources.map((resource) => (
                                        <CharacterResourceForm
                                            key={`${resource.id}:${resource.starts_with}:${resource.max_status}:${resource.kind}`}
                                            resource={resource}
                                            busy={busy}
                                            submitLabel="Save"
                                            onSubmit={(input) => void run(async () => {
                                                await updateResource(resource.id, input);
                                            }, "Resource saved.")}
                                            onDelete={() => void run(async () => {
                                                await deleteResource(resource.id);
                                            }, "Resource deleted.")}
                                        />
                                    ))}
                                </AppBox>
                            )}
                        </SectionCard>
                        <SectionCard title="Add resource" variant="input">
                            <CharacterResourceForm
                                busy={busy}
                                submitLabel="Add"
                                onSubmit={(input: CharacterResourceInput) => void run(async () => {
                                    await createResource({...input, character_id: selectedCharacter.id});
                                }, "Resource added.")}
                            />
                        </SectionCard>
                    </>
                ) : null}
            </PageShell>

            <AppSnackbar open={toast.open} autoHideDuration={3000} onClose={() => setToast((current) => ({...current, open: false}))} anchorOrigin={{vertical: "bottom", horizontal: "right"}}>
                <AppAlert severity={toast.severity} variant="filled" onClose={() => setToast((current) => ({...current, open: false}))} sx={{width: "100%"}}>{toast.message}</AppAlert>
            </AppSnackbar>
        </AppContainer>
    );
}
