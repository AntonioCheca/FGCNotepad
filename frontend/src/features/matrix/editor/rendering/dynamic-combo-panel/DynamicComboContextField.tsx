import type {StarterContextPreset} from "./dynamicComboPanelTypes";

interface DynamicComboContextFieldProps {
    starterPreset: StarterContextPreset;
    onStarterPresetChange: (value: StarterContextPreset) => void;
}

export function DynamicComboContextField({starterPreset, onStarterPresetChange}: DynamicComboContextFieldProps) {
    return (
        <label style={{display: "grid", gap: 4}}>
            <span style={{fontSize: 12, color: "#595959"}}>Starter Context</span>
            <select value={starterPreset} onChange={(event) => onStarterPresetChange(event.target.value as StarterContextPreset)}>
                <option value="normal">Normal Hit</option>
                <option value="punish_counter">Punish Counter</option>
                <option value="counter_hit">Counter Hit</option>
            </select>
        </label>
    );
}
