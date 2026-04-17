import React from "react";
import {useRouter} from "next/router";

import {AppContainer} from "@/src/components/ui/AppContainer";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {ScenarioEditorForm} from "@/src/components/scenarios/ScenarioEditorForm";
import {useScenarios} from "@/hooks/useScenarios";

export default function CreateScenarioPage() {
    const router = useRouter();
    const {createScenario} = useScenarios();

    return (
        <AppContainer maxWidth={false}>
            <AppTypography variant="h4" sx={{mb: 2}}>Create Scenario</AppTypography>
            <ScenarioEditorForm
                submitLabel="Create Scenario"
                onSubmit={async (payload) => {
                    const created = await createScenario(payload);
                    await router.push(`/scenarios/${created.id}/edit`);
                }}
            />
        </AppContainer>
    );
}
