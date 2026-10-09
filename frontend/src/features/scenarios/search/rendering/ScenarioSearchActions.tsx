
import {AppBox} from "@/src/components/ui/AppBox";
import {CreateContentLink} from "@/src/components/auth/CreateContentLink";

export function ScenarioSearchActions() {
    return (
        <AppBox sx={{display: "flex", justifyContent: {xs: "stretch", sm: "flex-end"}}}>
            <AppBox sx={{width: {xs: "100%", sm: "auto"}}}>
                <CreateContentLink href="/scenarios/new" label="Create Scenario" variant="outlined" color="secondary" buttonSx={{width: {xs: "100%", sm: "auto"}}} />
            </AppBox>
        </AppBox>
    );
}
