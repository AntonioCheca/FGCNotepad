interface DynamicComboPanelActionsProps {
    error: string | null;
    onCancel: () => void;
    onSave: () => void;
}

export function DynamicComboPanelActions({error, onCancel, onSave}: DynamicComboPanelActionsProps) {
    return (
        <>
            {error ? <div style={{fontSize: 12, color: "#cf1322"}}>{error}</div> : null}

            <div style={{display: "flex", justifyContent: "flex-end", gap: 8}}>
                <button type="button" onClick={onCancel} style={{height: 30}}>Cancel</button>
                <button
                    type="button"
                    style={{
                        height: 30,
                        borderRadius: 6,
                        border: "1px solid #2c5e93",
                        background: "linear-gradient(135deg, #356ba4 0%, #4a80b8 100%)",
                        color: "#fff",
                        fontWeight: 600,
                    }}
                    onClick={onSave}
                >
                    Save Dynamic Combo
                </button>
            </div>
        </>
    );
}
