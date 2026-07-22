import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppTextField} from "@/src/components/ui/AppTextField";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {WrappedAutocomplete} from "@/src/components/ui/WrappedAutocomplete";
import {SectionCard} from "@/src/components/ui/tactical/SectionCard";
import {InlineNotice} from "@/src/components/ui/tactical/InlineNotice";
import {
    ErrorOutlineIcon,
    TimelineIcon,
    WarningAmberIcon,
} from "@/src/components/ui/AppIcons";
import {isDelayConnection} from "@/src/types/combo";
import type {
    ConnectionType,
    LeafSequenceOption,
    StepDraft,
    TranslateErrorToken,
    TranslateParsedToken,
} from "@/src/types/combo";
import {getDelayLabel} from "@/src/components/combos/create/utils/comboForm";

interface ParserVerificationSectionProps {
    hasParseResult: boolean;
    verificationTokens: TranslateParsedToken[];
    errorByIndex: Map<number, TranslateErrorToken>;
    tokenToStepIndex: Map<number, number>;
    selectedStepIndex: number | null;
    steps: StepDraft[];
    selectedStep: StepDraft | null;
    leafNameById: Map<number, string>;
    leafs: LeafSequenceOption[];
    connections: ConnectionType[];
    connectionsLoading: boolean;
    translateWarnings: string[];
    translateErrors: TranslateErrorToken[];
    onSelectStep: (index: number) => void;
    onChangeStep: (index: number, update: Partial<StepDraft>) => void;
}

export function ParserVerificationSection({
    hasParseResult,
    verificationTokens,
    errorByIndex,
    tokenToStepIndex,
    selectedStepIndex,
    steps,
    selectedStep,
    leafNameById,
    leafs,
    connections,
    connectionsLoading,
    translateWarnings,
    translateErrors,
    onSelectStep,
    onChangeStep,
}: ParserVerificationSectionProps) {
    if (!hasParseResult) {
        return null;
    }

    return (
        <SectionCard
            title="Parser Verification"
            tone="raised"
            variant="review"
        >
            <AppBox sx={{display: "grid", gap: 1, gridTemplateColumns: {xs: "1fr", lg: "minmax(0, 1fr) 320px"}, alignItems: {xs: "start", lg: "stretch"}}}>
                <AppBox sx={{display: "flex", gap: 0.35, flexWrap: "wrap", alignItems: "center"}}>
                    {verificationTokens.map((token, index) => {
                        const tokenError = errorByIndex.get(token.index);
                        const recognized = token.child_sequence_id !== null;
                        const mappedStepIndex = tokenToStepIndex.get(token.index);
                        const matchingStep = mappedStepIndex !== undefined ? steps[mappedStepIndex] : null;
                        const delayLabel = matchingStep ? getDelayLabel(matchingStep) : null;
                        const isSelected = mappedStepIndex !== undefined && mappedStepIndex === selectedStepIndex;

                        return (
                            <AppBox key={`token-${token.index}-${token.token}`} sx={{display: "inline-flex", gap: 0.5, alignItems: "center"}}>
                                <AppBox
                                    onClick={() => {
                                        if (mappedStepIndex !== undefined) {
                                            onSelectStep(mappedStepIndex);
                                        }
                                    }}
                                    sx={{
                                        display: "grid",
                                        gap: 0.15,
                                        py: 0.55,
                                        px: 0.75,
                                        borderRadius: 1,
                                        border: "1px solid",
                                        borderColor: isSelected
                                            ? "fgc.parser.nodeSelectedBorder"
                                            : tokenError
                                                ? "error.main"
                                                : recognized
                                                    ? "fgc.parser.nodeBorder"
                                                    : "fgc.accent.warning",
                                        backgroundColor: (theme) => {
                                            if (isSelected) {
                                                return theme.fgc.parser.nodeSelectedBg;
                                            }

                                            if (tokenError) {
                                                return theme.fgc.parser.nodeWarningBg;
                                            }

                                            return recognized ? theme.fgc.parser.nodeBg : theme.fgc.parser.nodeWarningBg;
                                        },
                                        minWidth: 118,
                                        maxWidth: 170,
                                        cursor: mappedStepIndex !== undefined ? "pointer" : "default",
                                    }}
                                >
                                    <AppTypography variant="caption" color="text.secondary" sx={{fontWeight: 600}}>
                                        Step {token.index}
                                    </AppTypography>
                                    <AppTypography variant="caption" sx={{fontWeight: 700, fontFamily: "'IBM Plex Mono', 'Consolas', monospace", fontSize: "0.73rem"}}>
                                        {token.token}
                                    </AppTypography>
                                    <AppTypography variant="caption" color={recognized ? "text.secondary" : "warning.main"}>
                                        {recognized
                                            ? (leafNameById.get(token.child_sequence_id as number) ?? "Recognized")
                                            : `? (${tokenError?.token ?? token.token})`}
                                    </AppTypography>
                                    {matchingStep?.connection?.name ? (
                                        <AppTypography variant="caption" color="text.secondary" sx={{fontSize: "0.7rem"}}>
                                            {matchingStep.connection.name}{delayLabel ? ` • ${delayLabel}` : ""}
                                        </AppTypography>
                                    ) : null}
                                </AppBox>
                                {index < verificationTokens.length - 1 ? (
                                    <AppBox sx={{display: "inline-flex", alignItems: "center", gap: 0.25, px: 0.15, color: "fgc.icon.muted"}}>
                                        <AppBox sx={{height: "1px", width: 12, backgroundColor: "fgc.parser.connector"}} />
                                        <TimelineIcon fontSize="inherit" />
                                        <AppBox sx={{height: "1px", width: 12, backgroundColor: "fgc.parser.connector"}} />
                                    </AppBox>
                                ) : null}
                            </AppBox>
                        );
                    })}
                </AppBox>

                <AppBox
                    sx={{
                        display: "grid",
                        gap: 0.75,
                        p: 0.9,
                        borderRadius: 1,
                        border: "1px solid",
                        borderColor: selectedStep ? "fgc.border.default" : "fgc.border.subtle",
                        backgroundColor: selectedStep ? "fgc.surface.subtle" : "fgc.surface.sunken",
                    }}
                >
                    <AppTypography variant="subtitle2" sx={{fontWeight: 650}}>
                        {selectedStep ? `Edit Parsed Step ${(selectedStepIndex as number) + 1}` : "Step Editor"}
                    </AppTypography>

                    {selectedStep && selectedStepIndex !== null ? (
                        <>
                            <WrappedAutocomplete<LeafSequenceOption>
                                label="Move"
                                options={leafs}
                                value={selectedStep.move}
                                onChange={(value) => onChangeStep(selectedStepIndex, {move: value})}
                                getOptionLabel={(option) => option?.name ?? ""}
                                disableClearable={false}
                            />
                            <WrappedAutocomplete<ConnectionType>
                                label="Connection"
                                options={connections}
                                value={selectedStep.connection}
                                onChange={(value) => onChangeStep(selectedStepIndex, {connection: value})}
                                getOptionLabel={(option) => option?.name ?? ""}
                                loading={connectionsLoading}
                                disableClearable={false}
                            />

                            {isDelayConnection(selectedStep.connection) ? (
                                <>
                                    <AppBox sx={{display: "flex", gap: 0.5}}>
                                        <AppButton
                                            type="button"
                                            size="small"
                                            color="secondary"
                                            variant={(selectedStep.delay_type ?? "fixed") === "fixed" ? "contained" : "outlined"}
                                            onClick={() => onChangeStep(selectedStepIndex, {delay_type: "fixed"})}
                                        >
                                            Fixed
                                        </AppButton>
                                        <AppButton
                                            type="button"
                                            size="small"
                                            color="secondary"
                                            variant={(selectedStep.delay_type ?? "fixed") === "window" ? "contained" : "outlined"}
                                            onClick={() => onChangeStep(selectedStepIndex, {delay_type: "window"})}
                                        >
                                            Window
                                        </AppButton>
                                    </AppBox>

                                    {(selectedStep.delay_type ?? "fixed") === "fixed" ? (
                                        <AppTextField
                                            label="Delay Frames"
                                            value={selectedStep.delay_frames ?? ""}
                                            onChange={(event) => onChangeStep(selectedStepIndex, {delay_frames: event.target.value})}
                                            inputMode="numeric"
                                        />
                                    ) : (
                                        <AppBox sx={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0.75}}>
                                            <AppTextField
                                                label="Delay Min"
                                                value={selectedStep.delay_min_frames ?? ""}
                                                onChange={(event) => onChangeStep(selectedStepIndex, {delay_min_frames: event.target.value})}
                                                inputMode="numeric"
                                            />
                                            <AppTextField
                                                label="Delay Max"
                                                value={selectedStep.delay_max_frames ?? ""}
                                                onChange={(event) => onChangeStep(selectedStepIndex, {delay_max_frames: event.target.value})}
                                                inputMode="numeric"
                                            />
                                        </AppBox>
                                    )}
                                </>
                            ) : null}
                        </>
                    ) : (
                        <AppTypography variant="body2" color="text.secondary">
                            Select a token to edit move and connection details.
                        </AppTypography>
                    )}
                </AppBox>
            </AppBox>

            {translateWarnings.length > 0 ? (
                <InlineNotice severity="warning">
                    <AppBox sx={{display: "grid", gap: 0.35}}>
                        {translateWarnings.map((warning) => (
                            <AppTypography key={`warning-${warning}`} variant="body2" sx={{display: "flex", gap: 0.5, alignItems: "center"}}>
                                <WarningAmberIcon fontSize="inherit" />
                                {warning}
                            </AppTypography>
                        ))}
                    </AppBox>
                </InlineNotice>
            ) : null}

            {translateErrors.length > 0 ? (
                <InlineNotice severity="error">
                    <AppBox sx={{display: "grid", gap: 0.35}}>
                        {translateErrors.map((error) => (
                            <AppTypography key={`${error.index}-${error.token}`} variant="body2" sx={{display: "flex", gap: 0.5, alignItems: "center"}}>
                                <ErrorOutlineIcon fontSize="inherit" />
                                Token {error.index} ({error.token}): {error.message}
                            </AppTypography>
                        ))}
                    </AppBox>
                </InlineNotice>
            ) : null}
        </SectionCard>
    );
}
