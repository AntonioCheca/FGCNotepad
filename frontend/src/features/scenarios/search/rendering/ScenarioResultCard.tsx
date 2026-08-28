import Link from "next/link";

import {AppBox} from "@/src/components/ui/AppBox";
import {AppChip} from "@/src/components/ui/AppChip";
import {AppPaper} from "@/src/components/ui/AppPaper";
import {AppTypography} from "@/src/components/ui/AppTypography";
import type {ScenarioListItem} from "@/hooks/useScenarios";

interface ScenarioResultCardProps {
    item: ScenarioListItem;
}

export function ScenarioResultCard({item}: ScenarioResultCardProps) {
    return (
        <Link href={`/scenarios/${item.id}`} style={{textDecoration: "none", color: "inherit"}}>
            <AppPaper
                variant="outlined"
                sx={{
                    p: {xs: 1, md: 1.5},
                    borderRadius: {xs: 2, md: 2.5},
                    display: "grid",
                    gap: {xs: 0.45, md: 0.35},
                    borderColor: "fgc.border.default",
                    backgroundColor: "fgc.surface.base",
                    minWidth: 0,
                    transition: "border-color 0.2s ease, background-color 0.2s ease",
                    "&:hover": {
                        borderColor: "fgc.border.strong",
                        backgroundColor: "fgc.selection.hover",
                    },
                }}
            >
                <AppBox sx={{display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1, flexWrap: "wrap", minWidth: 0}}>
                    <AppTypography variant="subtitle1" sx={{fontWeight: 650, overflowWrap: "anywhere"}}>{item.name}</AppTypography>
                    <AppChip size="small" variant="outlined" label={item.typeLabel} />
                </AppBox>
                <AppTypography variant="body2" color="text.secondary">
                    {item.defenderCharacterName ?? "?"} defends vs {item.attackerCharacterName ?? "?"}
                </AppTypography>
                <AppTypography variant="body2" sx={{overflowWrap: "anywhere"}}>Trigger: {item.triggerMoveLabel ?? item.triggerMoveId ?? "Unknown"}</AppTypography>
            </AppPaper>
        </Link>
    );
}
