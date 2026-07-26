import {AppBox} from "@/src/components/ui/AppBox";
import {AppTextField} from "@/src/components/ui/AppTextField";
import {SectionCard} from "@/src/components/ui/tactical/SectionCard";

interface ComboAdvancedFiltersSectionProps {
    minDifficulty: string;
    maxDifficulty: string;
    minDamage: string;
    maxDamage: string;
    onMinDifficultyChange: (value: string) => void;
    onMaxDifficultyChange: (value: string) => void;
    onMinDamageChange: (value: string) => void;
    onMaxDamageChange: (value: string) => void;
}

export function ComboAdvancedFiltersSection({
    minDifficulty,
    maxDifficulty,
    minDamage,
    maxDamage,
    onMinDifficultyChange,
    onMaxDifficultyChange,
    onMinDamageChange,
    onMaxDamageChange,
}: ComboAdvancedFiltersSectionProps) {
    return (
        <SectionCard title="Execution and Damage" tone="default" variant="review">
            <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", sm: "repeat(2, minmax(150px, 1fr))", md: "repeat(4, minmax(150px, 1fr))"}, gap: 1}}>
                <AppTextField label="Min difficulty" type="number" size="small" value={minDifficulty} onChange={(event) => onMinDifficultyChange(event.target.value)} />
                <AppTextField label="Max difficulty" type="number" size="small" value={maxDifficulty} onChange={(event) => onMaxDifficultyChange(event.target.value)} />
                <AppTextField label="Min damage" type="number" size="small" value={minDamage} onChange={(event) => onMinDamageChange(event.target.value)} />
                <AppTextField label="Max damage" type="number" size="small" value={maxDamage} onChange={(event) => onMaxDamageChange(event.target.value)} />
            </AppBox>
        </SectionCard>
    );
}
