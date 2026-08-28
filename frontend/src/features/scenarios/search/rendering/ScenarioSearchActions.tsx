import Link from "next/link";

import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";

export function ScenarioSearchActions() {
    return (
        <AppBox sx={{display: "flex", justifyContent: {xs: "stretch", sm: "flex-end"}}}>
            <AppBox sx={{width: {xs: "100%", sm: "auto"}}}>
                <Link href="/scenarios/new" style={{textDecoration: "none"}}>
                    <AppButton type="button" variant="outlined" color="secondary" sx={{width: {xs: "100%", sm: "auto"}}}>Create Scenario</AppButton>
                </Link>
            </AppBox>
        </AppBox>
    );
}
