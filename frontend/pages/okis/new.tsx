import {AppContainer} from "@/src/components/ui/AppContainer";
import {OkiEditorForm} from "@/src/components/okis/OkiEditorForm";
import {PageShell} from "@/src/components/ui/tactical/PageShell";

export default function NewOkiPage() {
    return (
        <AppContainer maxWidth={false} sx={{py: {xs: 2.25, md: 3.25}, px: {xs: 1.75, md: 3, xl: 4}}}>
            <PageShell title="Create Oki">
                <OkiEditorForm mode="create" />
            </PageShell>
        </AppContainer>
    );
}
