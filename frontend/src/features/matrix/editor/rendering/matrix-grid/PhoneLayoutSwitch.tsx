import {useMode} from "@/src/context/ThemeContext";

export type PhoneMatrixLayout = "rows" | "grid";

const PHONE_LAYOUTS: Array<{value: PhoneMatrixLayout; label: string}> = [
    {value: "rows", label: "By option"},
    {value: "grid", label: "Full grid"},
];

export function PhoneLayoutSwitch({value, onChange}: {value: PhoneMatrixLayout; onChange: (layout: PhoneMatrixLayout) => void}) {
    const {theme} = useMode();
    return (
        <div role="group" aria-label="Matrix layout" style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, padding: 4, marginBottom: 10, borderRadius: 10, border: `1px solid ${theme.fgc.border.default}`, background: theme.fgc.surface.sunken}}>
            {PHONE_LAYOUTS.map((layout) => (
                <button
                    key={layout.value}
                    type="button"
                    aria-pressed={value === layout.value}
                    onClick={() => onChange(layout.value)}
                    style={{minHeight: 36, borderRadius: 8, border: "none", font: "inherit", fontSize: 14, fontWeight: 600, cursor: "pointer", background: value === layout.value ? theme.fgc.surface.selected : "transparent", color: value === layout.value ? theme.fgc.text.primary : theme.fgc.text.secondary}}
                >
                    {layout.label}
                </button>
            ))}
        </div>
    );
}
