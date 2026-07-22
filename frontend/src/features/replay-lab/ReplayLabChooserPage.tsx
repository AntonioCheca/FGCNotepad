import React from "react";

import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppStack} from "@/src/components/ui/AppStack";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {PageShell} from "@/src/components/ui/tactical/PageShell";
import {SectionCard} from "@/src/components/ui/tactical/SectionCard";

export function ReplayLabChooserPage() {
    return (
        <PageShell title="Replay Lab" badgeLabel="Choose Flow">
            <SectionCard title="Mode" tone="raised" variant="review">
                <AppStack spacing={1.25} sx={{maxWidth: 720}}>
                    <AppTypography component="ul" sx={{m: 0, pl: 2.25}}>
                        <li>Local: MP4 on your machine, generate clips here.</li>
                        <li>Online: YouTube/coaching review and sharing.</li>
                    </AppTypography>
                    <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", sm: "1fr 1fr"}, gap: 1}}>
                        <AppButton href="/replay-lab/local">Start Local</AppButton>
                        <AppButton href="/replay-lab/upload" variant="outlined">Start Online</AppButton>
                    </AppBox>
                </AppStack>
            </SectionCard>
        </PageShell>
    );
}
