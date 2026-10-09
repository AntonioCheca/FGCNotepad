import {AppBox} from "@/src/components/ui/AppBox";
import {AppTextField} from "@/src/components/ui/AppTextField";
import {AppToggleButton} from "@/src/components/ui/AppToggleButton";
import {AppToggleButtonGroup} from "@/src/components/ui/AppToggleButtonGroup";
import {TriStateFilter} from "@/src/components/ui/tactical/TriStateFilter";
import type {ComboSpacingOption} from "@/src/types/combo";
import type {ComboBooleanFilterValue, ComboRequirementFilterKey, ComboRequirementFilters} from "./comboFilterTypes";

interface ComboKeyFiltersSectionProps {
    requirements: ComboRequirementFilters;
    spacingOptions: ComboSpacingOption[];
    spacingCodes: string[];
    availableDrive: string;
    availableSuper: string;
    onRequirementToggle: (key: ComboRequirementFilterKey, value: ComboBooleanFilterValue) => void;
    onSpacingCodesChange: (codes: string[]) => void;
    onAvailableDriveChange: (value: string) => void;
    onAvailableSuperChange: (value: string) => void;
}

const resourceFieldSx = {width: {xs: "calc(50% - 6px)", sm: 140}};

export function ComboKeyFiltersSection({
    requirements,
    spacingOptions,
    spacingCodes,
    availableDrive,
    availableSuper,
    onRequirementToggle,
    onSpacingCodesChange,
    onAvailableDriveChange,
    onAvailableSuperChange,
}: ComboKeyFiltersSectionProps) {
    return (
        <AppBox sx={{display: "flex", flexWrap: "wrap", alignItems: "center", columnGap: 2.5, rowGap: 1}}>
            <TriStateFilter label="PC" ariaLabel="Punish Counter" value={requirements.punishCounterRequired} onChange={(value) => onRequirementToggle("punishCounterRequired", value)} />
            <TriStateFilter label="CH" ariaLabel="Counter Hit" value={requirements.counterHitRequired} onChange={(value) => onRequirementToggle("counterHitRequired", value)} />
            <TriStateFilter label="Corner" value={requirements.cornerRequired} onChange={(value) => onRequirementToggle("cornerRequired", value)} />
            <AppBox sx={{display: "inline-flex", alignItems: "center", gap: 0.75, minWidth: 0, flexWrap: "wrap"}}>
                <AppBox component="span" aria-hidden sx={{typography: "body2", fontWeight: 700}}>Spacing</AppBox>
                <AppToggleButtonGroup size="small" value={spacingCodes} aria-label="Spacing" onChange={(_, codes: string[]) => onSpacingCodesChange(codes)}>
                    {spacingOptions.map((option) => (
                        <AppToggleButton
                            key={option.code}
                            value={option.code}
                            title={option.description}
                            sx={{px: 1, py: 0.25, minHeight: {xs: 40, md: 32}, textTransform: "none", fontWeight: 600, "&.Mui-selected": {fontWeight: 800, backgroundColor: "fgc.selection.active", color: "text.primary"}}}
                        >
                            {option.name}
                        </AppToggleButton>
                    ))}
                </AppToggleButtonGroup>
            </AppBox>
            <TriStateFilter label="PP" ariaLabel="Perfect Parry" value={requirements.perfectParryRequired} onChange={(value) => onRequirementToggle("perfectParryRequired", value)} />
            <AppBox sx={{display: "flex", gap: 1.5, width: {xs: "100%", sm: "auto"}}}>
                <AppTextField label="Available Drive" type="number" size="small" value={availableDrive} InputLabelProps={{shrink: true}} inputProps={{min: 0, max: 6, step: 0.5}} onChange={(event) => onAvailableDriveChange(event.target.value)} sx={resourceFieldSx} />
                <AppTextField label="Available Super" type="number" size="small" value={availableSuper} InputLabelProps={{shrink: true}} inputProps={{min: 0, max: 3, step: 1}} onChange={(event) => onAvailableSuperChange(event.target.value)} sx={resourceFieldSx} />
            </AppBox>
        </AppBox>
    );
}
