import {AppBox} from "@/src/components/ui/AppBox";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {ResourceLedgerEntry} from "@/src/types/resourceLedger";

function signed(delta: number): string {
    return delta > 0 ? `+${delta}` : String(delta);
}

function summary(entry: ResourceLedgerEntry): string {
    if (entry.resource.kind === "state") {
        return `${entry.start > 0 ? "Active at start" : "Inactive at start"} · ${entry.end > 0 ? "active at end" : "inactive at end"}`;
    }

    return `Starts ${entry.start} · ends ${entry.end}`;
}

export function ComboResourceCard({ledger}: {ledger: ResourceLedgerEntry[]}) {
    if (ledger.length === 0) {
        return null;
    }

    return (
        <AppBox sx={{display: "grid", gap: 0.75}}>
            {ledger.map((entry) => (
                <AppBox
                    key={entry.resource.id}
                    sx={{display: "grid", gap: 0.5, border: "1px solid", borderColor: "fgc.border.default", borderRadius: 1.25, px: 1.25, py: 0.85, backgroundColor: "fgc.surface.subtle"}}
                >
                    <AppBox sx={{display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: 1}}>
                        <AppTypography variant="subtitle2" sx={{fontWeight: 700}}>{entry.resource.name}</AppTypography>
                        <AppTypography variant="body2" color="text.secondary">{summary(entry)}</AppTypography>
                    </AppBox>
                    <AppBox sx={{display: "flex", flexWrap: "wrap", gap: 0.75}}>
                        {entry.steps.map((step) => (
                            <AppBox
                                key={`${step.ordinal}:${step.notation}`}
                                sx={{
                                    px: 0.75,
                                    py: 0.15,
                                    borderRadius: 1,
                                    border: "1px solid",
                                    borderColor: "fgc.border.default",
                                    backgroundColor: "fgc.surface.sunken",
                                }}
                            >
                                <AppTypography variant="caption" sx={{fontWeight: 650}}>
                                    {signed(step.delta)} {entry.resource.name} <AppTypography component="span" variant="caption" color="text.secondary">({step.notation})</AppTypography>
                                </AppTypography>
                            </AppBox>
                        ))}
                    </AppBox>
                    {entry.warnings.map((warning) => (
                        <AppTypography key={warning} variant="caption" color="warning.main">{warning}</AppTypography>
                    ))}
                </AppBox>
            ))}
        </AppBox>
    );
}
