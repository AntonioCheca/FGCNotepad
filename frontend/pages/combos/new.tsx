import {useState} from "react";
import {AppContainer} from "@/src/components/ui/AppContainer";
import ComboForm from "@/src/components/combos/create/ComboForm";
import {PageShell} from "@/src/components/ui/tactical/PageShell";
import {InlineNotice} from "@/src/components/ui/tactical/InlineNotice";

export default function CreateComboPage() {
    const [createdCount, setCreatedCount] = useState(0);

    return (
        <AppContainer maxWidth={false} sx={{py: {xs: 2.25, md: 3.25}, px: {xs: 1.75, md: 3, xl: 4}}}>
            <PageShell title="Create Combo">
                {createdCount > 0 ? (
                    <InlineNotice severity="success">
                        Combo saved. You can keep building and submit another sequence.
                    </InlineNotice>
                ) : null}
                <ComboForm onSuccess={() => setCreatedCount((previousCount) => previousCount + 1)} />
            </PageShell>
        </AppContainer>
    );
}
