import React from "react";

import {MatrixEditorPanelFrame} from "../MatrixEditorPanelFrame";
import type {DynamicComboPresentation} from "./dynamicComboPanelTypes";

interface DynamicComboPanelFrameProps {
    presentation: DynamicComboPresentation;
    titleId: string;
    onClose: () => void;
    children: React.ReactNode;
}

export function DynamicComboPanelFrame({presentation, titleId, onClose, children}: DynamicComboPanelFrameProps) {
    return (
        <MatrixEditorPanelFrame presentation={presentation} titleId={titleId} width="560px" gap={10} onClose={onClose}>
            {children}
        </MatrixEditorPanelFrame>
    );
}
