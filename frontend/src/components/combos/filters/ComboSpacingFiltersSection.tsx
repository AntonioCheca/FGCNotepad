import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {SectionCard} from "@/src/components/ui/tactical/SectionCard";
import type {ComboSpacingOption} from "@/src/types/combo";

interface ComboSpacingFiltersSectionProps {
    spacingOptions: ComboSpacingOption[];
    selectedCodes: string[];
    onToggleSpacingCode: (code: string) => void;
}

export function ComboSpacingFiltersSection({spacingOptions, selectedCodes, onToggleSpacingCode}: ComboSpacingFiltersSectionProps) {
    return (
        <SectionCard title="Spacing" tone="sunken" variant="default">
            <AppBox sx={{display: "flex", gap: 0.75, flexWrap: "wrap", alignItems: "center"}}>
                {spacingOptions.map((option) => {
                    const selected = selectedCodes.includes(option.code);

                    return (
                        <AppButton
                            key={option.code}
                            type="button"
                            size="small"
                            variant={selected ? "contained" : "outlined"}
                            color={selected ? "primary" : "secondary"}
                            onClick={() => onToggleSpacingCode(option.code)}
                        >
                            {option.name}
                        </AppButton>
                    );
                })}
            </AppBox>
            {selectedCodes.includes("punish_tip") ? (
                <AppTypography variant="body2" color="text.secondary">
                    Punish tip is for extended hurtbox punishment, not the starter&apos;s normal tip range.
                </AppTypography>
            ) : null}
        </SectionCard>
    );
}
