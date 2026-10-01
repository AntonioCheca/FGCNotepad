export type ComboExecutionMode = "classic" | "modern_max" | "modern_simple";

export const COMBO_EXECUTION_MODE_OPTIONS: ReadonlyArray<{value: ComboExecutionMode; label: string}> = [
    {value: "classic", label: "Classic"},
    {value: "modern_max", label: "Modern · max damage"},
    {value: "modern_simple", label: "Modern · simple inputs"},
];

export function isComboExecutionMode(value: unknown): value is ComboExecutionMode {
    return value === "classic" || value === "modern_max" || value === "modern_simple";
}

export function isModernExecutionMode(mode: ComboExecutionMode): boolean {
    return mode !== "classic";
}

/** Damage is labelled with its mode only when it is not the Classic default. */
export function modernDamageModeLabel(mode: ComboExecutionMode): string | null {
    return isModernExecutionMode(mode) ? COMBO_EXECUTION_MODE_OPTIONS.find((option) => option.value === mode)?.label ?? null : null;
}
