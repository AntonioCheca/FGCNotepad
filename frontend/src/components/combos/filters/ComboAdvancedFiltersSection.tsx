import {AppBox} from "@/src/components/ui/AppBox";
import {AppTextField} from "@/src/components/ui/AppTextField";
import {SectionCard} from "@/src/components/ui/tactical/SectionCard";

interface ComboAdvancedFiltersSectionProps {
    minDifficulty: string;
    maxDifficulty: string;
    minDamage: string;
    maxDamage: string;
    availableDrive: string;
    availableSuper: string;
    onMinDifficultyChange: (value: string) => void;
    onMaxDifficultyChange: (value: string) => void;
    onMinDamageChange: (value: string) => void;
    onMaxDamageChange: (value: string) => void;
    onAvailableDriveChange: (value: string) => void;
    onAvailableSuperChange: (value: string) => void;
}

export function ComboAdvancedFiltersSection({
    minDifficulty,
    maxDifficulty,
    minDamage,
    maxDamage,
    availableDrive,
    availableSuper,
    onMinDifficultyChange,
    onMaxDifficultyChange,
    onMinDamageChange,
    onMaxDamageChange,
    onAvailableDriveChange,
    onAvailableSuperChange,
}: ComboAdvancedFiltersSectionProps) {
    return (
        <SectionCard title="Execution and Damage" tone="default" variant="review">
            <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", sm: "repeat(2, minmax(150px, 1fr))", md: "repeat(6, minmax(130px, 1fr))"}, gap: 1}}>
                <AppTextField label="Min difficulty" type="number" size="small" value={minDifficulty} onChange={(event) => onMinDifficultyChange(event.target.value)} />
                <AppTextField label="Max difficulty" type="number" size="small" value={maxDifficulty} onChange={(event) => onMaxDifficultyChange(event.target.value)} />
                <AppTextField label="Min damage" type="number" size="small" value={minDamage} onChange={(event) => onMinDamageChange(event.target.value)} />
                <AppTextField label="Max damage" type="number" size="small" value={maxDamage} onChange={(event) => onMaxDamageChange(event.target.value)} />
                <AppTextField label="Available drive" type="number" size="small" value={availableDrive} inputProps={{min: 0, max: 6, step: 0.5}} onChange={(event) => onAvailableDriveChange(event.target.value)} />
                <AppTextField label="Available super" type="number" size="small" value={availableSuper} inputProps={{min: 0, max: 3, step: 1}} onChange={(event) => onAvailableSuperChange(event.target.value)} />
            </AppBox>
        </SectionCard>
    );
}
