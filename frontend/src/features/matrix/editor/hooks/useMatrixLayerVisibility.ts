import React from "react";

import {MatrixEditorState} from "@/src/features/matrix/model";
import {buildVisibleMatrixState, computeHighestLayer} from "../services/matrixLayerVisibility";

interface UseMatrixLayerVisibilityOptions {
    state: MatrixEditorState;
    editable: boolean;
}

export function useMatrixLayerVisibility({state, editable}: UseMatrixLayerVisibilityOptions) {
    const [selectedLayer, setSelectedLayer] = React.useState(1);
    const [showAllLayers, setShowAllLayers] = React.useState<boolean>(editable);

    const highestLayer = React.useMemo(() => computeHighestLayer(state), [state]);

    React.useEffect(() => {
        if (selectedLayer > highestLayer) {
            setSelectedLayer(highestLayer);
        }
    }, [highestLayer, selectedLayer]);

    const effectiveLayerLimit = showAllLayers ? null : selectedLayer;

    const visibleState = React.useMemo(() => buildVisibleMatrixState(state, effectiveLayerLimit), [effectiveLayerLimit, state]);

    return {
        selectedLayer,
        setSelectedLayer,
        showAllLayers,
        setShowAllLayers,
        highestLayer,
        effectiveLayerLimit,
        visibleState,
    };
}
