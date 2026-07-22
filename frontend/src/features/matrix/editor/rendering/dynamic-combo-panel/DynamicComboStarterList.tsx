import type {DynamicComboMoveOption} from "./dynamicComboPanelTypes";

interface DynamicComboStarterListProps {
    starterSelections: DynamicComboMoveOption[];
    onRemoveStarter: (id: string) => void;
}

export function DynamicComboStarterList({starterSelections, onRemoveStarter}: DynamicComboStarterListProps) {
    return (
        <div style={{display: "grid", gap: 4, border: "1px solid #cfdeec", borderRadius: 8, padding: 8, background: "#fff", minWidth: 0}}>
            <span style={{fontSize: 12, color: "#595959"}}>Selected Starters</span>
            {starterSelections.length === 0 ? (
                <span style={{fontSize: 12, color: "#8c8c8c"}}>No starter moves selected yet.</span>
            ) : (
                starterSelections.map((item) => (
                    <div key={item.id} style={{display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, minWidth: 0}}>
                        <span style={{fontSize: 13, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}>{item.summary}</span>
                        <button type="button" style={{flexShrink: 0}} onClick={() => onRemoveStarter(item.id)}>
                            Remove
                        </button>
                    </div>
                ))
            )}
        </div>
    );
}
