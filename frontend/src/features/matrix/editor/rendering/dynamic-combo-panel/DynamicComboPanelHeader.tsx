interface DynamicComboPanelHeaderProps {
    titleId: string;
    onClose: () => void;
}

export function DynamicComboPanelHeader({titleId, onClose}: DynamicComboPanelHeaderProps) {
    return (
        <div style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
            <div style={{display: "grid", gap: 2}}>
                <strong id={titleId} style={{fontSize: 14, color: "#2a4a6f"}}>Dynamic Combo Cell</strong>
                <span style={{fontSize: 12, color: "#5e7795"}}>Visible only for selected dynamic combo-capable cell</span>
            </div>
            <button type="button" onClick={onClose} style={{height: 30}}>Close</button>
        </div>
    );
}
