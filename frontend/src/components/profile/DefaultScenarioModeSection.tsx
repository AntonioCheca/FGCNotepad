import React from "react";

import {AppTypography} from "@/src/components/ui/AppTypography";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppBox} from "@/src/components/ui/AppBox";
import {HelpTip} from "@/src/components/ui/tactical/HelpTip";
import {ScenarioExecutionSelection} from "@/src/types/scenarioExecution";
import {SectionCard} from "@/src/components/ui/tactical/SectionCard";

interface DefaultScenarioModeSectionProps {
    executionSelection: ScenarioExecutionSelection;
    savingPreference: boolean;
    onSelectionChange: React.Dispatch<React.SetStateAction<ScenarioExecutionSelection>>;
    onSave: () => Promise<void>;
}

export function DefaultScenarioModeSection({executionSelection, savingPreference, onSelectionChange, onSave}: DefaultScenarioModeSectionProps) {
    return (
        <SectionCard title="Default Scenario Mode" tone="raised">
            <AppBox sx={{display: "flex", gap: {xs: 1, md: 2}, alignItems: {xs: "flex-start", md: "center"}, flexDirection: {xs: "column", sm: "row"}, flexWrap: "wrap"}}>
                <span style={{display: "inline-flex", alignItems: "center", gap: 6}}>
                    <AppTypography variant="body2">My Current Knowledge</AppTypography>
                    <HelpTip text="Use only combos you marked as known in Combo Knowledge."/>
                </span>
                <span style={{display: "inline-flex", alignItems: "center", gap: 6}}>
                    <AppTypography variant="body2">Standard Assumption</AppTypography>
                    <HelpTip text="Use a practical default combo pool for quick browsing and guest mode."/>
                </span>
                <span style={{display: "inline-flex", alignItems: "center", gap: 6}}>
                    <AppTypography variant="body2">Difficulty Cap</AppTypography>
                    <HelpTip text="Include all combos with difficulty less than or equal to your selected cap."/>
                </span>
            </AppBox>

            <AppBox sx={(theme) => ({
                display: "grid",
                gridTemplateColumns: {xs: "1fr", sm: "repeat(2, minmax(0, 220px))", md: "repeat(3, minmax(0, 220px))"},
                gap: 1.5,
                alignItems: "center",
                "& .profile-control": {
                    height: 38,
                    width: "100%",
                    borderRadius: 1,
                    border: `1px solid ${theme.fgc.border.default}`,
                    padding: "0 10px",
                    backgroundColor: theme.fgc.control.default,
                    color: theme.fgc.text.primary,
                },
            })}>
                <select
                    className="profile-control"
                    aria-label="Default scenario mode"
                    value={executionSelection.mode}
                    onChange={(event) => {
                        const nextMode = event.target.value as ScenarioExecutionSelection["mode"];
                        onSelectionChange((current) => ({mode: nextMode, difficultyCap: nextMode === "difficulty_cap" ? current.difficultyCap ?? 3 : null}));
                    }}
                >
                    <option value="my_knowledge">My Current Knowledge</option>
                    <option value="standard">Standard Assumption</option>
                    <option value="difficulty_cap">Difficulty Cap</option>
                </select>

                {executionSelection.mode === "difficulty_cap" ? (
                    <select
                        className="profile-control"
                        aria-label="Default difficulty cap"
                        value={executionSelection.difficultyCap ?? 3}
                        onChange={(event) => {
                            const cap = Number.parseInt(event.target.value, 10);
                            onSelectionChange((current) => ({...current, difficultyCap: Number.isFinite(cap) ? cap : 3}));
                        }}
                    >
                        {Array.from({length: 7}).map((_, index) => {
                            const level = index + 1;
                            return <option key={level} value={level}>Difficulty {level}</option>;
                        })}
                    </select>
                ) : null}

                <AppButton type="button" disabled={savingPreference} onClick={() => void onSave()} sx={{width: {xs: "100%", sm: "auto"}}}>{savingPreference ? "Saving..." : "Save Mode"}</AppButton>
            </AppBox>
        </SectionCard>
    );
}
