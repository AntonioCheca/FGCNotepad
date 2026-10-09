import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppTextField} from "@/src/components/ui/AppTextField";
import {WrappedAutocomplete} from "@/src/components/ui/WrappedAutocomplete";
import {SectionCard} from "@/src/components/ui/tactical/SectionCard";
import type {CharacterOption} from "@/src/types/combo";

interface ComboCharacterPicker {
    value: CharacterOption | null;
    options: CharacterOption[];
    loading: boolean;
    onChange: (value: CharacterOption | null) => void;
}

interface ComboSetupSectionProps {
    // Omitted when the character is fixed, as when editing an existing combo.
    characterPicker?: ComboCharacterPicker;
    notationInput: string;
    canFillDetails: boolean;
    fillingDetails?: boolean;
    onNotationChange: (value: string) => void;
    onFillDetails: () => void;
}

const fieldSx = {
    "& .MuiFormControl-root": {margin: 0},
    "& .MuiInputBase-root": {minHeight: 40},
};

export function ComboSetupSection({characterPicker, notationInput, canFillDetails, fillingDetails = false, onNotationChange, onFillDetails}: ComboSetupSectionProps) {
    return (
        <SectionCard title="Combo Setup">
            <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", md: characterPicker ? "260px minmax(0, 1fr) auto" : "minmax(0, 1fr) auto"}, gap: {xs: 0.75, md: 1}, alignItems: "center"}}>
                {characterPicker ? (
                    <WrappedAutocomplete<CharacterOption>
                        label="Character"
                        options={characterPicker.options}
                        loading={characterPicker.loading}
                        value={characterPicker.value}
                        onChange={characterPicker.onChange}
                        getOptionLabel={(option: CharacterOption) => option?.name ?? ""}
                        disableClearable={false}
                        sx={fieldSx}
                    />
                ) : null}
                <AppTextField
                    label="Combo Notation"
                    value={notationInput}
                    onChange={(event) => onNotationChange(event.target.value)}
                    margin="none"
                    placeholder="2LK 2LK 2LP 236HP"
                    sx={fieldSx}
                />
                <AppButton
                    type="button"
                    variant="outlined"
                    color="secondary"
                    onClick={onFillDetails}
                    disabled={!canFillDetails || fillingDetails}
                    sx={{minWidth: 140, minHeight: 40}}
                >
                    {fillingDetails ? "Filling..." : "Fill Details"}
                </AppButton>
            </AppBox>
        </SectionCard>
    );
}
