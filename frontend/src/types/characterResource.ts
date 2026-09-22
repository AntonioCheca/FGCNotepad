export type CharacterResourceKind = "stock" | "scaler" | "state";
export type CharacterResourceSpendBehavior = "consumed" | "maintained";
export type CharacterResourceExtractorSource = "named" | "install";

export interface CharacterResource {
    id: number;
    object_key: string;
    name: string;
    character_id: string | null;
    character_name: string;
    display_name: string;
    kind: CharacterResourceKind;
    spend_behavior: CharacterResourceSpendBehavior;
    starts_with: number;
    resets_each_round: boolean;
    min_status: number;
    max_status: number | null;
    extractor_key: string | null;
    extractor_source: CharacterResourceExtractorSource;
    sort_order: number;
}

export interface CharacterResourceInput {
    character_id?: string;
    name: string;
    kind: CharacterResourceKind;
    spend_behavior: CharacterResourceSpendBehavior;
    starts_with: number;
    min_status: number;
    max_status: number | null;
    resets_each_round: boolean;
    extractor_key: string;
    extractor_source: CharacterResourceExtractorSource;
}

export const CHARACTER_RESOURCE_KIND_LABELS: Record<CharacterResourceKind, string> = {
    stock: "Stock (spent to enhance or unlock)",
    scaler: "Scaler (more = more damage)",
    state: "On/off state (install)",
};
