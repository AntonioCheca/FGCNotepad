import {useRouter} from "next/router";
import {AppContainer} from "@/src/components/ui/AppContainer";
import {OkiEditorForm} from "@/src/components/okis/OkiEditorForm";
import {PageShell} from "@/src/components/ui/tactical/PageShell";

export default function NewOkiPage() {
    const router = useRouter();
    const characterId = typeof router.query.characterId === "string" ? router.query.characterId : "";

    return (
        <AppContainer maxWidth={false} sx={{py: {xs: 2.25, md: 3.25}, px: {xs: 1.75, md: 3, xl: 4}}}>
            <PageShell title="Create Oki">
                {/* The query only arrives after hydration; remounting then applies the preselected character. */}
                <OkiEditorForm key={characterId} mode="create" initialCharacterId={characterId} />
            </PageShell>
        </AppContainer>
    );
}
