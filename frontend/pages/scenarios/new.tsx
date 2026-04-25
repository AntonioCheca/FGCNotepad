import React from "react";
import {useRouter} from "next/router";

import {AppContainer} from "@/src/components/ui/AppContainer";
import {PageShell} from "@/src/components/ui/tactical/PageShell";
import {ScenarioEditorForm} from "@/src/components/scenarios/ScenarioEditorForm";
import {useScenarios} from "@/hooks/useScenarios";

export default function CreateScenarioPage() {
    const router = useRouter();
    const {createScenario, resolveDynamicCellPreview} = useScenarios();

    return (
        <AppContainer maxWidth={false} sx={{py: {xs: 2.25, md: 3.25}, px: {xs: 1.75, md: 3, xl: 4}}}>
            <PageShell
                title="Create Scenario"
                subtitle="Define setup first, tune matrix outcomes fast, and save a clean tactical scenario in one pass."
            >
                <ScenarioEditorForm
                    submitLabel="Create Scenario"
                    onResolveDynamicComboCell={async (dynamicCombo) => {
                        const resolved = await resolveDynamicCellPreview(dynamicCombo);
                        return resolved.resolvedDamage;
                    }}
                    onSubmit={async (payload) => {
                        const created = await createScenario(payload);
                        await router.push(`/scenarios/${created.id}/edit`);
                    }}
                />
            </PageShell>
        </AppContainer>
    );
}
