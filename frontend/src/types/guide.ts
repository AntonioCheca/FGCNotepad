export type TurnsGuideHeuristicTone = "danger" | "warning" | "info";

export interface TurnsGuideHeuristic {
    title: string;
    body: string;
    tone: TurnsGuideHeuristicTone;
}

export interface TurnsGuideMove {
    id: string;
    character: {
        id: string;
        name: string;
    };
    numpadNotation: string;
    moveType: string;
    advantageOnBlock: number;
}

export interface TurnsGuideMoveSection {
    title: string;
    status: "ready" | "planned_data_column";
    moves: TurnsGuideMove[];
}

export interface TurnsGuide {
    title: string;
    heuristics: TurnsGuideHeuristic[];
    sections: {
        plusNormals: TurnsGuideMoveSection;
        plusSpecials: TurnsGuideMoveSection;
        spacedNormals: TurnsGuideMoveSection;
        spacedSpecials: TurnsGuideMoveSection;
    };
}
