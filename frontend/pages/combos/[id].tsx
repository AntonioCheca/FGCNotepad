import React from "react";
import Link from "next/link";
import {useRouter} from "next/router";

import useCombos from "@/hooks/useCombos";
import {AppContainer} from "@/src/components/ui/AppContainer";
import {AppCircularProgress} from "@/src/components/ui/AppCircularProgress";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {ContentFlagButton} from "@/src/components/flags/ContentFlagButton";
import {ComboDetailApi, ComboDetailView, ComboRequirement, ComboStep, mapComboToDetailView} from "@/src/types/combo";

function getAuditStatusLabel(needsTechnicalReview: boolean): string {
    return needsTechnicalReview ? "Usable - pending technical review" : "Fully audited";
}

function getRequirementLines(requirement: ComboRequirement | null): string[] {
    if (!requirement) {
        return [];
    }

    const lines: string[] = [];

    if (requirement.counter_hit_required) {
        lines.push("Counter Hit required");
    }
    if (requirement.punish_counter_required) {
        lines.push("Punish Counter required");
    }
    if (requirement.corner_required) {
        lines.push("Corner required");
    }
    if (requirement.airborne_required) {
        lines.push("Opponent airborne required");
    }
    if (requirement.mid_screen_required) {
        lines.push("Mid-screen required");
    }
    if (requirement.not_crouching_required) {
        lines.push("Opponent not crouching");
    }

    const specificRequirement = requirement.requirement_specific_character;
    if (specificRequirement?.object_name) {
        const status = specificRequirement.status_required;
        lines.push(
            `Specific requirement: ${specificRequirement.object_name}${status !== undefined ? ` = ${String(status)}` : ""}`,
        );
    }

    return lines;
}

function formatDelay(step: ComboStep): string {
    const min = step.delay_min_frames;
    const max = step.delay_max_frames;

    if (min === null && max === null) {
        return "-";
    }

    if (min !== null && max !== null && min === max) {
        return `${min}f`;
    }

    if (min !== null && max !== null) {
        const minStatus = step.delay_min_unverified ? "?" : "";
        const maxStatus = step.delay_max_unverified ? "?" : "";
        return `${min}${minStatus}-${max}${maxStatus}f`;
    }

    return `${min ?? "?"}-${max ?? "?"}f`;
}

export default function ComboDetailPage() {
    const router = useRouter();
    const {id} = router.query;
    const comboId = typeof id === "string" ? id : null;
    const numericComboId = comboId ? Number.parseInt(comboId, 10) : null;

    const {getCombo} = useCombos();

    const [combo, setCombo] = React.useState<ComboDetailView | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (!comboId) {
            return;
        }

        let canceled = false;
        setLoading(true);
        setError(null);

        getCombo(comboId)
            .then((response: ComboDetailApi) => {
                if (canceled) {
                    return;
                }

                setCombo(mapComboToDetailView(response));
            })
            .catch(() => {
                if (!canceled) {
                    setError("Unable to load combo.");
                }
            })
            .finally(() => {
                if (!canceled) {
                    setLoading(false);
                }
            });

        return () => {
            canceled = true;
        };
    }, [comboId, getCombo]);

    if (loading) {
        return (
            <AppContainer maxWidth={false}>
                <AppCircularProgress sx={{display: "block", margin: "auto", mt: 4}}/>
            </AppContainer>
        );
    }

    if (error || !combo || !comboId) {
        return (
            <AppContainer maxWidth={false}>
                <AppTypography color="error">{error ?? "Combo not found."}</AppTypography>
                <div style={{marginTop: 12}}>
                    <Link href="/combos" style={{textDecoration: "none"}}>
                        <AppTypography variant="body2">Back to Search Combos</AppTypography>
                    </Link>
                </div>
            </AppContainer>
        );
    }

    const requirementLines = getRequirementLines(combo.requirements);

    return (
        <AppContainer maxWidth={false}>
            <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 16}}>
                <div style={{display: "grid", gap: 6}}>
                    <AppTypography variant="h4">{combo.title}</AppTypography>
                    <AppTypography variant="body2">Character: {combo.characterName}</AppTypography>
                    <AppTypography variant="body2">Damage: {combo.damage}</AppTypography>
                    <AppTypography variant="body2">Resource-adjusted damage: {combo.resourceAdjustedDamage}</AppTypography>
                    <AppTypography variant="body2">
                        Resources: Drive {combo.driveCost}/{combo.driveGain} · Super {combo.superCost}/{combo.superGain}
                    </AppTypography>
                    <AppTypography variant="body2">Audit Status: {getAuditStatusLabel(combo.needsTechnicalReview)}</AppTypography>
                    <AppTypography variant="body2">
                        Seasons: {combo.seasonLabels.length > 0 ? combo.seasonLabels.join(", ") : "-"}
                    </AppTypography>
                </div>
                {numericComboId !== null && Number.isFinite(numericComboId)
                    ? <ContentFlagButton targetType="combo" targetId={numericComboId}/>
                    : null}
            </div>

            <div style={{display: "grid", gap: 8, marginBottom: 20}}>
                <AppTypography variant="h6">Description</AppTypography>
                <AppTypography variant="body2">{combo.description || "No description provided."}</AppTypography>
            </div>

            <div style={{display: "grid", gap: 8, marginBottom: 20}}>
                <AppTypography variant="h6">Requirements</AppTypography>
                {requirementLines.length === 0 ? (
                    <AppTypography variant="body2">No requirements.</AppTypography>
                ) : (
                    <ul style={{margin: 0, paddingLeft: 20}}>
                        {requirementLines.map((line) => (
                            <li key={line}>
                                <AppTypography variant="body2">{line}</AppTypography>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div style={{display: "grid", gap: 8, marginBottom: 20}}>
                <AppTypography variant="h6">Steps</AppTypography>
                {combo.steps.length === 0 ? (
                    <AppTypography variant="body2">No steps found.</AppTypography>
                ) : (
                    <div style={{overflowX: "auto"}}>
                        <table style={{width: "100%", borderCollapse: "collapse"}}>
                            <thead>
                            <tr>
                                <th style={{textAlign: "left", borderBottom: "1px solid #e0e0e0", padding: "8px 4px"}}>Order</th>
                                <th style={{textAlign: "left", borderBottom: "1px solid #e0e0e0", padding: "8px 4px"}}>Move</th>
                                <th style={{textAlign: "left", borderBottom: "1px solid #e0e0e0", padding: "8px 4px"}}>Connection</th>
                                <th style={{textAlign: "left", borderBottom: "1px solid #e0e0e0", padding: "8px 4px"}}>Delay</th>
                            </tr>
                            </thead>
                            <tbody>
                            {combo.steps.map((step) => (
                                <tr key={step.id}>
                                    <td style={{borderBottom: "1px solid #f0f0f0", padding: "8px 4px"}}>{step.ordinal_in_combo}</td>
                                    <td style={{borderBottom: "1px solid #f0f0f0", padding: "8px 4px"}}>{step.child_sequence_name ?? "-"}</td>
                                    <td style={{borderBottom: "1px solid #f0f0f0", padding: "8px 4px"}}>{step.connection_type_name ?? "-"}</td>
                                    <td style={{borderBottom: "1px solid #f0f0f0", padding: "8px 4px"}}>{formatDelay(step)}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <Link href="/combos" style={{textDecoration: "none"}}>
                <AppTypography variant="body2">Back to Search Combos</AppTypography>
            </Link>
        </AppContainer>
    );
}
