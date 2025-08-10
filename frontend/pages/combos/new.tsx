import {AppContainer} from "@/src/components/ui/AppContainer";
import {AppTypography} from "@/src/components/ui/AppTypography";
import ComboForm from "@/src/components/combos/ComboForm";
import useCombos from "@/hooks/useCombos";

export default function CreateComboPage() {
    const {createCombo} = useCombos();

    const handleCreate = async (comboData: any) => {
        try {
            await createCombo(comboData);
            alert("Combo created successfully!");
        } catch (err) {
            console.error(err);
            alert("Failed to create combo");
        }
    };

    return (
        <AppContainer maxWidth={false}>
            <AppTypography variant="h4" gutterBottom>
                Create a New Combo
            </AppTypography>
            <ComboForm onSubmit={handleCreate}/>
        </AppContainer>
    );
}
