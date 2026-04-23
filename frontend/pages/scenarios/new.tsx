import React from "react";
import {useRouter} from "next/router";

import {AppContainer} from "@/src/components/ui/AppContainer";
import {AppPaper} from "@/src/components/ui/AppPaper";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {AppBox} from "@/src/components/ui/AppBox";
import {ScenarioEditorForm} from "@/src/components/scenarios/ScenarioEditorForm";
import {useScenarios} from "@/hooks/useScenarios";

export default function CreateScenarioPage() {
    const router = useRouter();
    const {createScenario, resolveDynamicCellPreview} = useScenarios();

    return (
        <AppContainer maxWidth={false} sx={{py: {xs: 2, md: 3}}}>
            <AppPaper
                variant="outlined"
                sx={{
                    p: {xs: 2, md: 2.5},
                    borderRadius: 3,
                    mb: 2,
                    background: (theme) =>
                        `linear-gradient(145deg, ${theme.palette.background.paper} 0%, ${theme.palette.action.hover} 100%)`,
                }}
            >
                <AppBox sx={{display: "grid", gap: 0.5}}>
                    <AppTypography variant="h4">Create Scenario</AppTypography>
                    <AppTypography variant="body2" color="text.secondary">
                        Build your scenario details first, then define matrix cells and save.
                    </AppTypography>
                </AppBox>
            </AppPaper>

            <AppPaper variant="outlined" sx={{p: {xs: 2, md: 2.5}, borderRadius: 3}}>
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
            </AppPaper>
        </AppContainer>
    );
}
