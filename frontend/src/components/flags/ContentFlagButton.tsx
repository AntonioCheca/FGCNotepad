import React from "react";

import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppTextField} from "@/src/components/ui/AppTextField";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {useContentFlags} from "@/hooks/useContentFlags";
import AuthContext from "@/services/AuthContext";

interface ContentFlagButtonProps {
    targetType: "scenario" | "combo";
    targetId: string | number;
}

export function ContentFlagButton({targetType, targetId}: ContentFlagButtonProps) {
    const {createScenarioFlag, createComboFlag} = useContentFlags();
    const authContext = React.useContext(AuthContext);
    const [isOpen, setIsOpen] = React.useState(false);
    const [comment, setComment] = React.useState("");
    const [submitting, setSubmitting] = React.useState(false);
    const [feedback, setFeedback] = React.useState<string | null>(null);
    const [error, setError] = React.useState<string | null>(null);

    if (!authContext) {
        throw new Error("AuthContext must be used within an AuthProvider");
    }

    if (!authContext.isAuthenticated) {
        return null;
    }

    const submitFlag = async () => {
        setSubmitting(true);
        setError(null);
        setFeedback(null);

        try {
            if (targetType === "scenario" && typeof targetId === "string") {
                await createScenarioFlag(targetId, comment);
            } else if (targetType === "combo" && typeof targetId === "number") {
                await createComboFlag(targetId, comment);
            } else {
                throw new Error("Invalid content target");
            }

            setComment("");
            setFeedback("Thanks. Your report has been submitted.");
            setIsOpen(false);
        } catch {
            setError("Unable to submit the report right now.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AppBox sx={{display: "grid", gap: 1, minWidth: {xs: 0, sm: 220}, width: "100%"}}>
            <AppButton
                type="button"
                size="small"
                variant="outlined"
                sx={{width: {xs: "100%", sm: "auto"}}}
                onClick={() => {
                    setIsOpen((previous) => !previous);
                    setError(null);
                    setFeedback(null);
                }}
            >
                Report Incorrect Data
            </AppButton>

            {isOpen ? (
                <AppBox sx={{display: "grid", gap: 1, p: 1, border: "1px solid", borderColor: "fgc.border.default", borderRadius: 1.25, backgroundColor: "fgc.surface.sunken"}}>
                    <AppTextField
                        label="Optional comment"
                        value={comment}
                        onChange={(event) => setComment(event.target.value)}
                        multiline
                        minRows={2}
                        maxRows={4}
                        placeholder="What seems incorrect?"
                    />

                    <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", sm: "repeat(2, minmax(0, auto))"}, gap: 1, justifyContent: "flex-end"}}>
                        <AppButton
                            type="button"
                            size="small"
                            variant="outlined"
                            onClick={() => setIsOpen(false)}
                            disabled={submitting}
                        >
                            Cancel
                        </AppButton>
                        <AppButton
                            type="button"
                            size="small"
                            onClick={submitFlag}
                            disabled={submitting}
                        >
                            {submitting ? "Submitting..." : "Submit"}
                        </AppButton>
                    </AppBox>
                </AppBox>
            ) : null}

            {feedback ? <AppTypography variant="body2">{feedback}</AppTypography> : null}
            {error ? <AppTypography variant="body2" color="error">{error}</AppTypography> : null}
        </AppBox>
    );
}
