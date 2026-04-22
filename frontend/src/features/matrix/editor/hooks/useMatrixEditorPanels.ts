import React from "react";

interface UseMatrixEditorPanelsOptions {
    canEditReferences: boolean;
    canEditDynamicCombos: boolean;
    focusContainer: () => void;
}

export function useMatrixEditorPanels({canEditReferences, canEditDynamicCombos, focusContainer}: UseMatrixEditorPanelsOptions) {
    const [linkTargetKey, setLinkTargetKey] = React.useState<string | null>(null);
    const [dynamicComboTargetKey, setDynamicComboTargetKey] = React.useState<string | null>(null);

    const isAnyModalOpen = linkTargetKey !== null || dynamicComboTargetKey !== null;

    const closeLinkPanel = React.useCallback(() => {
        setLinkTargetKey(null);
        requestAnimationFrame(() => {
            focusContainer();
        });
    }, [focusContainer]);

    const closeDynamicComboPanel = React.useCallback(() => {
        setDynamicComboTargetKey(null);
        requestAnimationFrame(() => {
            focusContainer();
        });
    }, [focusContainer]);

    const openLinkPanelForKey = React.useCallback((key: string) => {
        if (!canEditReferences) {
            return;
        }

        setDynamicComboTargetKey(null);
        setLinkTargetKey(key);
    }, [canEditReferences]);

    const openDynamicComboPanelForKey = React.useCallback((key: string) => {
        if (!canEditDynamicCombos) {
            return;
        }

        setLinkTargetKey(null);
        setDynamicComboTargetKey(key);
    }, [canEditDynamicCombos]);

    return {
        linkTargetKey,
        dynamicComboTargetKey,
        isAnyModalOpen,
        closeLinkPanel,
        closeDynamicComboPanel,
        openLinkPanelForKey,
        openDynamicComboPanelForKey,
    };
}
