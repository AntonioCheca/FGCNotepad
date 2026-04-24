import {useState} from "react";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppIconButton} from "@/src/components/ui/AppIconButton";
import {DeleteIcon} from "@/src/components/ui/AppIcons";
import {AppChip} from "@/src/components/ui/AppChip";
import {AppTextField} from "@/src/components/ui/AppTextField";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {WrappedAutocomplete} from "@/src/components/ui/WrappedAutocomplete";
import {AppFormControlLabel} from "@/src/components/ui/AppFormControlLabel";
import {AppCheckbox} from "@/src/components/ui/AppCheckbox";
import {isDelayConnection, type StepDraft, type ConnectionType, type LeafSequenceOption} from "@/src/types/combo";

interface StepItemProps {
    index: number;
    step: StepDraft;
    onChange: (update: Partial<StepDraft>) => void;
    onRemove: () => void;
    moves: LeafSequenceOption[];
    connections: ConnectionType[];
    connectionsLoading: boolean;
}

export default function StepItem({
                                     index,
                                     step,
                                     onChange,
                                     onRemove,
                                     moves = [],
                                     connections,
                                     connectionsLoading,
                                 }: StepItemProps) {
    const [movesInputValue, setMovesInputValue] = useState<string>("");

    const filteredMoves = moves.filter((m) =>
        m.name.toLowerCase().includes(movesInputValue.toLowerCase())
    );

    const delaySelected = isDelayConnection(step.connection);
    const delayType = step.delay_type ?? "fixed";

    return (
        <AppBox
            sx={{
                display: "grid",
                gap: 1,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1.25,
                p: 1,
                backgroundColor: (theme) => index % 2 === 0 ? theme.fgc.surface.subtle : theme.fgc.surface.raised,
            }}
        >
            <AppBox sx={{display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1}}>
                <AppBox sx={{display: "flex", gap: 0.6, alignItems: "center", flexWrap: "wrap"}}>
                    <AppTypography variant="subtitle2">Step {index + 1}</AppTypography>
                    <AppChip
                        size="small"
                        variant="outlined"
                        color={step.move?.id ? "success" : "warning"}
                        label={step.move?.id ? "Move Locked" : "Move Missing"}
                    />
                    {index === 0 ? <AppChip size="small" variant="outlined" color="secondary" label="Route Opener" /> : null}
                </AppBox>
                <AppIconButton size="small" aria-label="Remove step" onClick={onRemove}>
                    <DeleteIcon/>
                </AppIconButton>
            </AppBox>

            <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", md: "minmax(180px, 0.45fr) minmax(260px, 1fr)"}, gap: 1}}>
                <WrappedAutocomplete<ConnectionType>
                    label="Connection"
                    options={connections}
                    value={step.connection}
                    onChange={(v) => onChange({connection: v})}
                    getOptionLabel={(o) => o?.name ?? ""}
                    loading={connectionsLoading}
                    disabled={false}
                />

                <WrappedAutocomplete<LeafSequenceOption>
                    label="Move"
                    options={filteredMoves}
                    value={step.move}
                    onChange={(v) => onChange({move: v})}
                    getOptionLabel={(o) => o?.name ?? ""}
                    inputValue={movesInputValue}
                    onInputChange={(_event, newValue) => setMovesInputValue(newValue)}
                    filterOptions={(options) => options}
                    required
                />
            </AppBox>

            {delaySelected ? (
                <AppBox sx={{display: "grid", gap: 1}}>
                    <AppBox sx={{display: "inline-flex", gap: 0.75, p: 0.5, borderRadius: 1, border: "1px solid", borderColor: "divider", backgroundColor: (theme) => theme.fgc.surface.sunken}}>
                        <AppButton
                            type="button"
                            variant={delayType === "fixed" ? "contained" : "outlined"}
                            size="small"
                            onClick={() => onChange({delay_type: "fixed"})}
                        >
                            Fixed Delay
                        </AppButton>
                        <AppButton
                            type="button"
                            variant={delayType === "window" ? "contained" : "outlined"}
                            size="small"
                            onClick={() => onChange({delay_type: "window"})}
                        >
                            Delay Window
                        </AppButton>
                    </AppBox>

                    {delayType === "fixed" ? (
                        <AppBox sx={{display: "grid", gap: 0.6}}>
                            <AppTextField
                                label="Delay Frames"
                                value={step.delay_frames ?? ""}
                                onChange={(event) => onChange({delay_frames: event.target.value})}
                                inputMode="numeric"
                            />
                            <AppBox sx={{display: "grid", gap: 0.25}}>
                                <AppTypography variant="caption" color="text.secondary">Timing meter</AppTypography>
                                <AppBox sx={{height: 6, borderRadius: 99, border: "1px solid", borderColor: "divider", backgroundColor: (theme) => theme.fgc.surface.sunken}}>
                                    <AppBox
                                        sx={{
                                            height: "100%",
                                            width: `${Math.min(100, Math.max(16, (Number.parseInt(step.delay_frames ?? "0", 10) || 0) * 6))}%`,
                                            borderRadius: 99,
                                            backgroundColor: (theme) => theme.fgc.action.secondary,
                                        }}
                                    />
                                </AppBox>
                            </AppBox>
                        </AppBox>
                    ) : (
                        <AppBox sx={{display: "grid", gap: 0.75}}>
                            <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", md: "1fr auto 1fr auto"}, gap: 1, alignItems: "center"}}>
                                <AppTextField
                                    label="Delay Min"
                                    value={step.delay_min_frames ?? ""}
                                    onChange={(event) => onChange({delay_min_frames: event.target.value})}
                                    inputMode="numeric"
                                />
                                <AppFormControlLabel
                                    sx={{mx: 0}}
                                    label="Min uncertain"
                                    control={
                                        <AppCheckbox
                                            checked={Boolean(step.delay_min_unverified)}
                                            onChange={(event) => onChange({delay_min_unverified: event.target.checked})}
                                        />
                                    }
                                />
                                <AppTextField
                                    label="Delay Max"
                                    value={step.delay_max_frames ?? ""}
                                    onChange={(event) => onChange({delay_max_frames: event.target.value})}
                                    inputMode="numeric"
                                />
                                <AppFormControlLabel
                                    sx={{mx: 0}}
                                    label="Max uncertain"
                                    control={
                                        <AppCheckbox
                                            checked={Boolean(step.delay_max_unverified)}
                                            onChange={(event) => onChange({delay_max_unverified: event.target.checked})}
                                        />
                                    }
                                />
                            </AppBox>
                            <AppBox sx={{display: "grid", gap: 0.25}}>
                                <AppTypography variant="caption" color="text.secondary">Window meter</AppTypography>
                                <AppBox sx={{height: 6, borderRadius: 99, border: "1px solid", borderColor: "divider", backgroundColor: (theme) => theme.fgc.surface.sunken}}>
                                    <AppBox
                                        sx={{
                                            height: "100%",
                                            width: `${Math.min(100, Math.max(16, (Number.parseInt(step.delay_max_frames ?? "0", 10) || 0) * 5))}%`,
                                            borderRadius: 99,
                                            backgroundColor: (theme) => theme.fgc.action.secondary,
                                        }}
                                    />
                                </AppBox>
                            </AppBox>
                        </AppBox>
                    )}
                </AppBox>
            ) : null}
        </AppBox>
    );
}
