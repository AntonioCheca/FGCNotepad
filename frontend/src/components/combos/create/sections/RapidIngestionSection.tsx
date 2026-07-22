import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppTextField} from "@/src/components/ui/AppTextField";
import {WrappedAutocomplete} from "@/src/components/ui/WrappedAutocomplete";
import {SectionCard} from "@/src/components/ui/tactical/SectionCard";
import type {CharacterOption} from "@/src/types/combo";

interface RapidIngestionSectionProps {
    character: CharacterOption | null;
    characterOptions: CharacterOption[];
    charactersLoading: boolean;
    notationInput: string;
    canFillDetails: boolean;
    onCharacterChange: (value: CharacterOption | null) => void;
    onNotationChange: (value: string) => void;
    onFillDetails: () => Promise<void>;
}

export function RapidIngestionSection({
    character,
    characterOptions,
    charactersLoading,
    notationInput,
    canFillDetails,
    onCharacterChange,
    onNotationChange,
    onFillDetails,
}: RapidIngestionSectionProps) {
    return (
        <SectionCard
            title="Rapid Combo Ingestion"
            tone="default"
            variant="input"
        >
            <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", md: "260px minmax(0, 1fr) auto"}, gap: 1, alignItems: "stretch"}}>
                <WrappedAutocomplete<CharacterOption>
                    label="Character"
                    options={characterOptions ?? []}
                    loading={charactersLoading}
                    value={character}
                    onChange={onCharacterChange}
                    getOptionLabel={(option: CharacterOption) => option?.name ?? ""}
                    disableClearable={false}
                    sx={{
                        "& .MuiFormControl-root": {
                            margin: 0,
                        },
                        "& .MuiInputBase-root": {
                            minHeight: 40,
                        },
                    }}
                />
                <AppTextField
                    label="Combo Notation"
                    value={notationInput}
                    onChange={(event) => onNotationChange(event.target.value)}
                    margin="none"
                    multiline={false}
                    placeholder="2LK 2LK 2LP 236HP"
                    sx={{
                        "& .MuiInputBase-root": {
                            minHeight: 40,
                        },
                    }}
                />
                <AppButton
                    type="button"
                    variant="outlined"
                    color="secondary"
                    onClick={onFillDetails}
                    disabled={!canFillDetails}
                    sx={{
                        minWidth: 160,
                        minHeight: 40,
                        borderColor: "fgc.accent.parser",
                        color: "fgc.accent.parser",
                        ":hover": {
                            borderColor: "fgc.accent.parser",
                            backgroundColor: "fgc.surface.sunken",
                        },
                    }}
                >
                    Fill Details
                </AppButton>
            </AppBox>
        </SectionCard>
    );
}
