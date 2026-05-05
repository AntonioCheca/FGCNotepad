import React from "react";

import {useMode} from "@/src/context/ThemeContext";
import {MatrixResourceRequirement, MatrixResourceOwner, MatrixResourceType} from "@/src/features/matrix/model";

interface AxisRequirementTriggerProps {
    axisLabel: string;
    requirements: MatrixResourceRequirement[];
    isActive: boolean;
    readOnly: boolean;
    onOpen: (anchor: HTMLElement) => void;
}

interface FloatingAxisRequirementEditorProps {
    axisLabel: string;
    requirements: MatrixResourceRequirement[];
    readOnly: boolean;
    anchorRect: DOMRect;
    onAdd: (requirement: MatrixResourceRequirement) => void;
    onUpdate: (index: number, requirement: MatrixResourceRequirement) => void;
    onRemove: (index: number) => void;
    onClose: () => void;
}

const DEFAULT_REQUIREMENT: MatrixResourceRequirement = {
    owner: "attacker",
    resource: "drive",
    operator: ">=",
    threshold: 1,
};

function formatRequirement(requirement: MatrixResourceRequirement): string {
    const owner = requirement.owner === "attacker" ? "Atk" : "Def";
    const resource = requirement.resource === "health" ? "HP" : requirement.resource === "drive" ? "Drv" : "Sup";
    return `${owner} ${resource} >= ${requirement.threshold}`;
}

function normalizeThreshold(resource: MatrixResourceType, value: string): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
        return 0;
    }

    return resource === "drive" ? parsed : Math.trunc(parsed);
}

function thresholdStep(resource: MatrixResourceType): number {
    if (resource === "drive") {
        return 0.5;
    }
    if (resource === "health") {
        return 100;
    }
    return 1;
}

function stopGridEvent(event: React.SyntheticEvent): void {
    event.stopPropagation();
}

export function AxisRequirementTrigger({
    axisLabel,
    requirements,
    isActive,
    readOnly,
    onOpen,
}: AxisRequirementTriggerProps) {
    const {theme} = useMode();
    const shouldShow = requirements.length > 0 || (isActive && !readOnly);

    if (!shouldShow) {
        return null;
    }

    return (
        <button
            type="button"
            onMouseDown={stopGridEvent}
            onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onOpen(event.currentTarget);
            }}
            aria-label={`${axisLabel} resource requirements`}
            title={requirements.length > 0 ? requirements.map(formatRequirement).join(" | ") : "Add requirements"}
            style={{
                position: "absolute",
                right: 4,
                bottom: 3,
                zIndex: 8,
                minHeight: 16,
                maxWidth: 54,
                padding: "0 5px",
                borderRadius: 999,
                border: `1px solid ${requirements.length > 0 ? theme.fgc.selection.active : theme.fgc.border.default}`,
                background: requirements.length > 0 ? theme.fgc.surface.raised : theme.fgc.surface.sunken,
                color: requirements.length > 0 ? theme.fgc.text.primary : theme.fgc.text.secondary,
                fontSize: 9,
                lineHeight: "14px",
                cursor: "pointer",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
            }}
        >
            {requirements.length > 0 ? `Req ${requirements.length}` : "+ Req"}
        </button>
    );
}

export function FloatingAxisRequirementEditor({
    axisLabel,
    requirements,
    readOnly,
    anchorRect,
    onAdd,
    onUpdate,
    onRemove,
    onClose,
}: FloatingAxisRequirementEditorProps) {
    const {theme} = useMode();
    const panelRef = React.useRef<HTMLDivElement | null>(null);
    const panelWidth = 292;
    const panelMaxHeight = 260;
    const top = Math.min(window.innerHeight - panelMaxHeight - 12, anchorRect.bottom + 6);
    const left = Math.min(window.innerWidth - panelWidth - 12, Math.max(12, anchorRect.left));

    React.useEffect(() => {
        function handlePointerDown(event: PointerEvent): void {
            if (panelRef.current?.contains(event.target as Node)) {
                return;
            }
            onClose();
        }

        function handleKeyDown(event: KeyboardEvent): void {
            if (event.key === "Escape") {
                onClose();
            }
        }

        document.addEventListener("pointerdown", handlePointerDown);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("pointerdown", handlePointerDown);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [onClose]);

    const controlStyle: React.CSSProperties = {
        minHeight: 26,
        borderRadius: 6,
        border: `1px solid ${theme.fgc.border.default}`,
        background: theme.fgc.control.default,
        color: theme.fgc.text.primary,
        fontSize: 11,
    };

    return (
        <div
            ref={panelRef}
            onMouseDown={stopGridEvent}
            onClick={stopGridEvent}
            style={{
                position: "fixed",
                top,
                left,
                zIndex: 10000,
                width: panelWidth,
                maxHeight: panelMaxHeight,
                overflowY: "auto",
                display: "grid",
                gap: 7,
                padding: 9,
                borderRadius: 10,
                border: `1px solid ${theme.fgc.border.strong ?? theme.fgc.border.default}`,
                background: theme.fgc.surface.raised,
                boxShadow: "0 16px 38px rgba(0,0,0,0.36)",
                boxSizing: "border-box",
            }}
        >
            <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8}}>
                <strong style={{fontSize: 12, color: theme.fgc.text.primary, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}>
                    Requirements: {axisLabel}
                </strong>
                <button type="button" onClick={onClose} style={{...controlStyle, minHeight: 22, padding: "0 7px"}}>
                    Close
                </button>
            </div>

            {requirements.length > 0 ? (
                <div style={{display: "flex", flexWrap: "wrap", gap: 4}}>
                    {requirements.map((requirement, index) => (
                        <span
                            key={`${requirement.owner}-${requirement.resource}-summary-${index}`}
                            style={{
                                borderRadius: 999,
                                padding: "2px 7px",
                                background: theme.fgc.surface.sunken,
                                color: theme.fgc.text.secondary,
                                fontSize: 10,
                            }}
                        >
                            {formatRequirement(requirement)}
                        </span>
                    ))}
                </div>
            ) : (
                <span style={{fontSize: 11, color: theme.fgc.text.secondary}}>No resource requirements yet.</span>
            )}

            {requirements.map((requirement, index) => (
                <div key={`${requirement.owner}-${requirement.resource}-${index}`} style={{display: "grid", gridTemplateColumns: "58px 72px 62px 28px", gap: 4}}>
                    <select
                        value={requirement.owner}
                        disabled={readOnly}
                        onChange={(event) => onUpdate(index, {...requirement, owner: event.target.value as MatrixResourceOwner})}
                        style={controlStyle}
                        aria-label={`${axisLabel} requirement owner`}
                    >
                        <option value="attacker">Atk</option>
                        <option value="defender">Def</option>
                    </select>
                    <select
                        value={requirement.resource}
                        disabled={readOnly}
                        onChange={(event) => {
                            const resource = event.target.value as MatrixResourceType;
                            onUpdate(index, {...requirement, resource, threshold: normalizeThreshold(resource, String(requirement.threshold))});
                        }}
                        style={controlStyle}
                        aria-label={`${axisLabel} requirement resource`}
                    >
                        <option value="health">HP</option>
                        <option value="drive">Drive</option>
                        <option value="super">Super</option>
                    </select>
                    <input
                        type="number"
                        min={0}
                        step={thresholdStep(requirement.resource)}
                        value={requirement.threshold}
                        readOnly={readOnly}
                        onChange={(event) => onUpdate(index, {...requirement, threshold: normalizeThreshold(requirement.resource, event.target.value)})}
                        style={{...controlStyle, width: "100%", boxSizing: "border-box", padding: "1px 5px"}}
                        aria-label={`${axisLabel} requirement threshold`}
                    />
                    <button
                        type="button"
                        disabled={readOnly}
                        onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            onRemove(index);
                        }}
                        style={controlStyle}
                        aria-label={`Remove ${axisLabel} requirement`}
                    >
                        x
                    </button>
                </div>
            ))}

            <button
                type="button"
                disabled={readOnly}
                onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onAdd(DEFAULT_REQUIREMENT);
                }}
                style={{...controlStyle, justifySelf: "start", padding: "1px 9px"}}
            >
                + Add Requirement
            </button>
        </div>
    );
}
