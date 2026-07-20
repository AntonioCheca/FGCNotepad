import React from "react";

import {MatrixEditorState, MatrixDynamicComboData} from "@/src/features/matrix/model";
import {MatrixAction, matrixActions} from "@/src/features/matrix/state/actions";
import {DynamicComboPanel} from "./DynamicComboPanel";
import {ScenarioLinkPanel} from "./ScenarioLinkPanel";

interface MatrixEditorInlinePanelsProps {
    state: MatrixEditorState;
    mode: "link" | "dynamic" | null;
    linkTargetKey: string | null;
    dynamicComboTargetKey: string | null;
    moveLabelById: Record<string, string>;
    dispatch: React.Dispatch<MatrixAction>;
    actions: typeof matrixActions;
    mergeMoveLabels: (labels: Record<string, string>) => void;
    resolveDynamicComboValue: (dynamicCombo: MatrixDynamicComboData) => Promise<number | null>;
    closeLinkPanel: () => void;
    closeDynamicComboPanel: () => void;
}

const INLINE_PANEL_STYLE: React.CSSProperties = {
    flex: "0 1 340px",
    width: "100%",
    maxWidth: 360,
    minWidth: 0,
    border: "1px solid #d9e2ec",
    borderRadius: 10,
    background: "linear-gradient(180deg, #f8fbff 0%, #f1f6fc 100%)",
    padding: 10,
    maxHeight: "62vh",
    overflowY: "auto",
    overflowX: "hidden",
    boxSizing: "border-box",
};

export function MatrixEditorInlinePanels({
    state,
    mode,
    linkTargetKey,
    dynamicComboTargetKey,
    moveLabelById,
    dispatch,
    actions,
    mergeMoveLabels,
    resolveDynamicComboValue,
    closeLinkPanel,
    closeDynamicComboPanel,
}: MatrixEditorInlinePanelsProps) {
    if (!mode) {
        return null;
    }

    return (
        <div style={INLINE_PANEL_STYLE}>
            {mode === "link" ? (
                <ScenarioLinkPanel
                    open={linkTargetKey !== null}
                    presentation="inline"
                    initialScenarioId={
                        linkTargetKey && state.grid.bodyCells[linkTargetKey]?.kind === "reference"
                            ? state.grid.bodyCells[linkTargetKey].reference?.scenarioId
                            : undefined
                    }
                    initialScenarioLabel={
                        linkTargetKey && state.grid.bodyCells[linkTargetKey]?.kind === "reference"
                            ? state.grid.bodyCells[linkTargetKey].reference?.scenarioLabel
                            : undefined
                    }
                    initialPreValue={
                        linkTargetKey && state.grid.bodyCells[linkTargetKey]?.kind === "reference"
                            ? state.grid.bodyCells[linkTargetKey].reference?.preValue
                            : {kind: "none"}
                    }
                    resetKey={linkTargetKey ?? "closed"}
                    moveLabelById={moveLabelById}
                    onClose={closeLinkPanel}
                    onConfirm={(item, preValue, starterLabels) => {
                        if (!linkTargetKey) {
                            return;
                        }

                        mergeMoveLabels(starterLabels);
                        dispatch(actions.linkReferenceCell(linkTargetKey, item.id, item.label));
                        dispatch(actions.setReferencePreValue(linkTargetKey, preValue));
                        closeLinkPanel();
                    }}
                    onRemove={() => {
                        if (!linkTargetKey) {
                            return;
                        }

                        dispatch(actions.unlinkReferenceCell(linkTargetKey));
                        closeLinkPanel();
                    }}
                />
            ) : null}

            {mode === "dynamic" ? (
                <DynamicComboPanel
                    open={dynamicComboTargetKey !== null}
                    presentation="inline"
                    initialValue={
                        dynamicComboTargetKey && state.grid.bodyCells[dynamicComboTargetKey]?.kind === "dynamic_combo"
                            ? state.grid.bodyCells[dynamicComboTargetKey].dynamicCombo
                            : null
                    }
                    resetKey={dynamicComboTargetKey ?? "closed"}
                    moveLabelById={moveLabelById}
                    onClose={closeDynamicComboPanel}
                    onConfirm={(value, starterLabels) => {
                        if (!dynamicComboTargetKey) {
                            return;
                        }

                        const targetKey = dynamicComboTargetKey;

                        void (async () => {
                            mergeMoveLabels(starterLabels);
                            dispatch(actions.setDynamicComboCell(targetKey, value));

                            const resolvedValue = await resolveDynamicComboValue(value);
                            dispatch(actions.setDynamicComboResolvedValue(targetKey, resolvedValue));
                            closeDynamicComboPanel();
                        })();
                    }}
                />
            ) : null}
        </div>
    );
}
