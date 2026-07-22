import Link from "next/link";

import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";

export function ScenarioSearchActions() {
    return (
        <AppBox sx={{display: "flex", justifyContent: "flex-end"}}>
            <Link href="/scenarios/new" style={{textDecoration: "none"}}>
                <AppButton type="button" variant="outlined" color="secondary">Create Scenario</AppButton>
            </Link>
        </AppBox>
    );
}
