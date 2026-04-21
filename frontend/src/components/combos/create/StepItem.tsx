import {useState} from "react";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppIconButton} from "@/src/components/ui/AppIconButton";
import {DeleteIcon} from "@/src/components/ui/AppIcons";
import {AppTextField} from "@/src/components/ui/AppTextField";
import {WrappedAutocomplete} from "@/src/components/ui/WrappedAutocomplete";
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
        <AppBox sx={{display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap"}}>
            <WrappedAutocomplete<ConnectionType>
                label="Connection"
                options={connections}
                value={step.connection}
                onChange={(v) => onChange({connection: v})}
                getOptionLabel={(o) => o?.name ?? ""}
                loading={connectionsLoading}
                disabled={false}
                sx={{flex: 1, minWidth: 150}}
            />

            <WrappedAutocomplete<LeafSequenceOption>
                label={`Step ${index + 1} Move`}
                options={filteredMoves}
                value={step.move}
                onChange={(v) => onChange({move: v})}
                getOptionLabel={(o) => o?.name ?? ""}
                inputValue={movesInputValue}
                onInputChange={(event, newValue) => setMovesInputValue(newValue)}
                filterOptions={(options) => options}
                required
                sx={{flex: 1, minWidth: 200}}
            />

            {delaySelected && (
                <>
                    <label style={{display: "flex", alignItems: "center", gap: 6}}>
                        <input
                            type="radio"
                            name={`delay-mode-${index}`}
                            checked={delayType === "fixed"}
                            onChange={() => onChange({delay_type: "fixed"})}
                        />
                        Fixed
                    </label>
                    <label style={{display: "flex", alignItems: "center", gap: 6}}>
                        <input
                            type="radio"
                            name={`delay-mode-${index}`}
                            checked={delayType === "window"}
                            onChange={() => onChange({delay_type: "window"})}
                        />
                        Window
                    </label>

                    {delayType === "fixed" ? (
                        <AppTextField
                            label="Delay Frames"
                            value={step.delay_frames ?? ""}
                            onChange={(event) => onChange({delay_frames: event.target.value})}
                            inputMode="numeric"
                            sx={{width: 140}}
                        />
                    ) : (
                        <>
                            <AppTextField
                                label="Delay Min"
                                value={step.delay_min_frames ?? ""}
                                onChange={(event) => onChange({delay_min_frames: event.target.value})}
                                inputMode="numeric"
                                sx={{width: 120}}
                            />
                            <AppTextField
                                label="Delay Max"
                                value={step.delay_max_frames ?? ""}
                                onChange={(event) => onChange({delay_max_frames: event.target.value})}
                                inputMode="numeric"
                                sx={{width: 120}}
                            />
                        </>
                    )}
                </>
            )}

            <AppIconButton aria-label="Remove step" onClick={onRemove}>
                <DeleteIcon/>
            </AppIconButton>
        </AppBox>
    );
}
