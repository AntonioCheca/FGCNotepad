import {useState} from "react";

import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppDialog} from "@/src/components/ui/AppDialog";
import {AppDialogActions} from "@/src/components/ui/AppDialogActions";
import {AppDialogContent} from "@/src/components/ui/AppDialogContent";
import {AppDialogTitle} from "@/src/components/ui/AppDialogTitle";
import {AppIconButton} from "@/src/components/ui/AppIconButton";
import {AppTextField} from "@/src/components/ui/AppTextField";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {WrappedAutocomplete} from "@/src/components/ui/WrappedAutocomplete";
import {SectionCard} from "@/src/components/ui/tactical/SectionCard";
import {InlineNotice} from "@/src/components/ui/tactical/InlineNotice";
import {
    AddIcon,
    DeleteIcon,
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
import {resourceChangesByOrdinal, resourceLedgerWarnings} from "@/src/components/combos/resources/resourceTimeline";
import {StartingRequirements} from "@/src/components/combos/resources/StartingRequirements";
import {StepResourceBadges} from "@/src/components/combos/resources/StepResourceBadges";
import type {ResourceLedgerEntry} from "@/src/types/resourceLedger";

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
    resourceLedger?: ResourceLedgerEntry[];
    startingRequirements?: string[];
    readOnly?: boolean;
    onSelectStep: (index: number) => void;
    onChangeStep: (index: number, update: Partial<StepDraft>) => void;
    onAddStep: () => void;
    onRemoveStep: (index: number) => void;
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
    resourceLedger = [],
    startingRequirements = [],
    readOnly = false,
    onSelectStep,
    onChangeStep,
    onAddStep,
    onRemoveStep,
}: ParserVerificationSectionProps) {
    const [mobileEditorOpen, setMobileEditorOpen] = useState(false);

    if (!hasParseResult) {
        return null;
    }

    const resourceChanges = resourceChangesByOrdinal(resourceLedger);
    const stepResourceChanges = (stepIndex: number | undefined) => (stepIndex === undefined ? [] : resourceChanges.get(stepIndex + 1) ?? []);
    const warnings = [...translateWarnings, ...resourceLedgerWarnings(resourceLedger)];

    return (
        <SectionCard
            title="Parser Verification"
            tone="raised"
            variant="review"
        >
            <StartingRequirements labels={startingRequirements} />
            <AppBox sx={{display: "grid", gap: 1, gridTemplateColumns: {xs: "1fr", lg: "minmax(0, 1fr) 320px"}, alignItems: {xs: "start", lg: "stretch"}, minWidth: 0}}>
                <AppBox sx={{display: {xs: "none", lg: "flex"}, gap: 0.35, flexWrap: "wrap", alignItems: "center", minWidth: 0, overflowX: "hidden"}}>
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
                                        minWidth: {xs: "min(118px, 100%)", sm: 118},
                                        maxWidth: {xs: "100%", sm: 170},
                                        cursor: mappedStepIndex !== undefined ? "pointer" : "default",
                                        position: "relative",
                                    }}
                                >
                                    {mappedStepIndex !== undefined && !readOnly ? (
                                        <AppIconButton
                                            type="button"
                                            size="small"
                                            aria-label={`Remove step ${mappedStepIndex + 1}`}
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                onRemoveStep(mappedStepIndex);
                                            }}
                                            sx={{
                                                position: "absolute",
                                                top: 2,
                                                right: 2,
                                                width: 18,
                                                height: 18,
                                                color: "fgc.action.danger",
                                                "&:hover": {backgroundColor: "fgc.parser.nodeWarningBg"},
                                            }}
                                        >
                                            <DeleteIcon sx={{fontSize: 13}} />
                                        </AppIconButton>
                                    ) : null}
                                    <AppBox sx={{display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 0.5, pr: mappedStepIndex !== undefined && !readOnly ? 2.5 : 0}}>
                                        <AppTypography variant="caption" color="text.secondary" sx={{fontWeight: 600, whiteSpace: "nowrap"}}>
                                            Step {token.index}
                                        </AppTypography>
                                        <StepResourceBadges changes={stepResourceChanges(mappedStepIndex)} />
                                    </AppBox>
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
                    {!readOnly ? <AppButton
                        type="button"
                        size="small"
                        variant="outlined"
                        color="secondary"
                        aria-label="Add combo step"
                        onClick={onAddStep}
                        sx={{
                            minWidth: 36,
                            height: 24,
                            px: 0.5,
                            borderColor: "fgc.parser.connector",
                            color: "fgc.icon.muted",
                            "&:hover": {
                                borderColor: "fgc.parser.nodeSelectedBorder",
                                backgroundColor: "fgc.parser.nodeSelectedBg",
                            },
                        }}
                    >
                        <AddIcon sx={{fontSize: 16}} />
                    </AppButton> : null}
                </AppBox>

                <AppBox sx={{display: {xs: "grid", lg: "none"}, gap: 0.55, minWidth: 0}}>
                    {verificationTokens.map((token) => {
                        const tokenError = errorByIndex.get(token.index);
                        const recognized = token.child_sequence_id !== null;
                        const mappedStepIndex = tokenToStepIndex.get(token.index);
                        const matchingStep = mappedStepIndex !== undefined ? steps[mappedStepIndex] : null;
                        const delayLabel = matchingStep ? getDelayLabel(matchingStep) : null;
                        const connectionLabel = matchingStep?.connection?.name ? `${matchingStep.connection.name}${delayLabel ? ` / ${delayLabel}` : ""}` : null;
                        const isSelected = mappedStepIndex !== undefined && mappedStepIndex === selectedStepIndex;

                        return (
                            <AppBox
                                key={`mobile-token-${token.index}-${token.token}`}
                                role={mappedStepIndex !== undefined ? "button" : undefined}
                                tabIndex={mappedStepIndex !== undefined ? 0 : undefined}
                                onClick={() => {
                                    if (mappedStepIndex !== undefined) {
                                        onSelectStep(mappedStepIndex);
                                        setMobileEditorOpen(true);
                                    }
                                }}
                                onKeyDown={(event) => {
                                    if (mappedStepIndex !== undefined && (event.key === "Enter" || event.key === " ")) {
                                        event.preventDefault();
                                        onSelectStep(mappedStepIndex);
                                        setMobileEditorOpen(true);
                                    }
                                }}
                                sx={(theme) => ({
                                    display: "grid",
                                    gridTemplateColumns: "2.25rem minmax(0, 1fr) auto auto",
                                    gap: 0.75,
                                    alignItems: "center",
                                    width: "100%",
                                    minHeight: 44,
                                    px: 0.8,
                                    py: 0.55,
                                    border: "1px solid",
                                    borderColor: isSelected
                                        ? theme.fgc.parser.nodeSelectedBorder
                                        : tokenError
                                            ? theme.palette.error.main
                                            : recognized
                                                ? theme.fgc.parser.nodeBorder
                                                : theme.fgc.accent.warning,
                                    borderRadius: 1.25,
                                    backgroundColor: isSelected
                                        ? theme.fgc.parser.nodeSelectedBg
                                        : tokenError || !recognized
                                            ? theme.fgc.parser.nodeWarningBg
                                            : theme.fgc.parser.nodeBg,
                                    color: theme.palette.text.primary,
                                    cursor: mappedStepIndex !== undefined ? "pointer" : "default",
                                    textAlign: "left",
                                    minWidth: 0,
                                })}
                            >
                                <AppTypography variant="caption" color="text.secondary" sx={{fontWeight: 800, fontFamily: "'IBM Plex Mono', 'Consolas', monospace"}}>
                                    {token.index}
                                </AppTypography>
                                <AppBox sx={{display: "grid", minWidth: 0}}>
                                    <AppTypography variant="body2" sx={{fontWeight: 800, fontFamily: "'IBM Plex Mono', 'Consolas', monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}>
                                        {token.token}{connectionLabel ? ` · ${connectionLabel}` : ""}
                                    </AppTypography>
                                    {!recognized ? (
                                        <AppTypography variant="caption" color="warning.main" sx={{overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}>
                                            ? {tokenError?.message ?? tokenError?.token ?? token.token}
                                        </AppTypography>
                                    ) : null}
                                </AppBox>
                                <StepResourceBadges changes={stepResourceChanges(mappedStepIndex)} />
                                {mappedStepIndex !== undefined && !readOnly ? (
                                    <AppIconButton
                                        type="button"
                                        size="small"
                                        aria-label={`Remove step ${mappedStepIndex + 1}`}
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            onRemoveStep(mappedStepIndex);
                                        }}
                                        sx={{width: 34, height: 34, color: "fgc.action.danger"}}
                                    >
                                        <DeleteIcon sx={{fontSize: 17}} />
                                    </AppIconButton>
                                ) : null}
                            </AppBox>
                        );
                    })}
                    {!readOnly ? (
                        <AppButton type="button" size="small" variant="outlined" color="secondary" onClick={onAddStep} sx={{minHeight: 40, borderColor: "fgc.parser.connector", color: "fgc.icon.muted"}}>
                            Add step
                        </AppButton>
                    ) : null}
                </AppBox>

                <StepEditorPanel
                    selectedStepIndex={selectedStepIndex}
                    selectedStep={selectedStep}
                    leafs={leafs}
                    connections={connections}
                    connectionsLoading={connectionsLoading}
                    readOnly={readOnly}
                    onChangeStep={onChangeStep}
                    sx={{display: {xs: "none", lg: "grid"}}}
                />
            </AppBox>

            <AppDialog
                open={mobileEditorOpen && selectedStep !== null && selectedStepIndex !== null}
                onClose={() => setMobileEditorOpen(false)}
                fullWidth
                maxWidth="sm"
                PaperProps={{
                    sx: {
                        alignSelf: "flex-end",
                        m: {xs: 0, sm: 2},
                        width: {xs: "100%", sm: "calc(100% - 32px)"},
                        maxHeight: {xs: "82dvh", sm: "calc(100% - 64px)"},
                        borderRadius: {xs: "16px 16px 0 0", sm: 2},
                        backgroundColor: "fgc.surface.base",
                    },
                }}
            >
                <AppDialogTitle sx={{pb: 0.75}}>{selectedStepIndex !== null ? `${readOnly ? "Step" : "Edit Step"} ${selectedStepIndex + 1}` : "Step Editor"}</AppDialogTitle>
                <AppDialogContent sx={{pt: 0.5}}>
                    <StepEditorPanel
                        selectedStepIndex={selectedStepIndex}
                        selectedStep={selectedStep}
                        leafs={leafs}
                        connections={connections}
                        connectionsLoading={connectionsLoading}
                        readOnly={readOnly}
                        onChangeStep={onChangeStep}
                    />
                </AppDialogContent>
                <AppDialogActions>
                    <AppButton type="button" variant="outlined" color="secondary" onClick={() => setMobileEditorOpen(false)}>Close</AppButton>
                </AppDialogActions>
            </AppDialog>

            {warnings.length > 0 ? (
                <InlineNotice severity="warning">
                    <AppBox sx={{display: "grid", gap: 0.35}}>
                        {warnings.map((warning) => (
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

interface StepEditorPanelProps {
    selectedStepIndex: number | null;
    selectedStep: StepDraft | null;
    leafs: LeafSequenceOption[];
    connections: ConnectionType[];
    connectionsLoading: boolean;
    readOnly: boolean;
    onChangeStep: (index: number, update: Partial<StepDraft>) => void;
    sx?: object;
}

function StepEditorPanel({selectedStepIndex, selectedStep, leafs, connections, connectionsLoading, readOnly, onChangeStep, sx}: StepEditorPanelProps) {
    return (
        <AppBox
            sx={{
                display: "grid",
                gap: 0.75,
                p: {xs: 0, lg: 0.9},
                borderRadius: 1,
                border: {xs: 0, lg: "1px solid"},
                borderColor: selectedStep ? "fgc.border.default" : "fgc.border.subtle",
                backgroundColor: {xs: "transparent", lg: selectedStep ? "fgc.surface.subtle" : "fgc.surface.sunken"},
                ...sx,
            }}
        >
            <AppTypography variant="subtitle2" sx={{fontWeight: 650, display: {xs: "none", lg: "block"}}}>
                {selectedStep ? `${readOnly ? "Step" : "Edit Parsed Step"} ${(selectedStepIndex as number) + 1}` : "Step Editor"}
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
                        disabled={readOnly}
                    />
                    <WrappedAutocomplete<ConnectionType>
                        label="Connection"
                        options={connections}
                        value={selectedStep.connection}
                        onChange={(value) => onChangeStep(selectedStepIndex, {connection: value})}
                        getOptionLabel={(option) => option?.name ?? ""}
                        loading={connectionsLoading}
                        disableClearable={false}
                        disabled={readOnly}
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
                                    disabled={readOnly}
                                >
                                    Fixed
                                </AppButton>
                                <AppButton
                                    type="button"
                                    size="small"
                                    color="secondary"
                                    variant={(selectedStep.delay_type ?? "fixed") === "window" ? "contained" : "outlined"}
                                    onClick={() => onChangeStep(selectedStepIndex, {delay_type: "window"})}
                                    disabled={readOnly}
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
                                    disabled={readOnly}
                                />
                            ) : (
                                <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", sm: "1fr 1fr"}, gap: 0.75}}>
                                    <AppTextField
                                        label="Delay Min"
                                        value={selectedStep.delay_min_frames ?? ""}
                                        onChange={(event) => onChangeStep(selectedStepIndex, {delay_min_frames: event.target.value})}
                                        inputMode="numeric"
                                        disabled={readOnly}
                                    />
                                    <AppTextField
                                        label="Delay Max"
                                        value={selectedStep.delay_max_frames ?? ""}
                                        onChange={(event) => onChangeStep(selectedStepIndex, {delay_max_frames: event.target.value})}
                                        inputMode="numeric"
                                        disabled={readOnly}
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
    );
}
