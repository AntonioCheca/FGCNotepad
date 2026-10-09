
import {ComboKnowledgeItem} from "@/src/types/scenarioExecution";

export function knownComboIds(combos: ComboKnowledgeItem[]): number[] {
    const ids: number[] = [];
    for (const combo of combos) {
        if (combo.known) {
            ids.push(combo.id);
        }
    }

    return ids;
}

export function visibleCombos(combos: ComboKnowledgeItem[], difficultyFilter: number | null): ComboKnowledgeItem[] {
    if (difficultyFilter === null) {
        return combos;
    }

    const visible: ComboKnowledgeItem[] = [];
    for (const combo of combos) {
        if (combo.difficultyLevel !== null && combo.difficultyLevel <= difficultyFilter) {
            visible.push(combo);
        }
    }

    return visible;
}
