import React from "react";
import AuthContext from "@/services/AuthContext";
import {useCharacters} from "@/hooks/useCharacters";
import {useFrameDataModeration} from "@/hooks/useFrameDataModeration";
import {AppAlert} from "@/src/components/ui/AppAlert";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppCheckbox} from "@/src/components/ui/AppCheckbox";
import {AppCircularProgress} from "@/src/components/ui/AppCircularProgress";
import {AppContainer} from "@/src/components/ui/AppContainer";
import {AppFormControl} from "@/src/components/ui/AppFormControl";
import {AppInputLabel} from "@/src/components/ui/AppInputLabel";
import {AppMenuItem} from "@/src/components/ui/AppMenuItem";
import {AppSelect} from "@/src/components/ui/AppSelect";
import {AppSnackbar} from "@/src/components/ui/AppSnackbar";
import {AppTable} from "@/src/components/ui/AppTable";
import {AppTableBody} from "@/src/components/ui/AppTableBody";
import {AppTableCell} from "@/src/components/ui/AppTableCell";
import {AppTableContainer} from "@/src/components/ui/AppTableContainer";
import {AppTableHead} from "@/src/components/ui/AppTableHead";
import {AppTableRow} from "@/src/components/ui/AppTableRow";
import {AppTextField} from "@/src/components/ui/AppTextField";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {InlineNotice} from "@/src/components/ui/tactical/InlineNotice";
import {PageShell} from "@/src/components/ui/tactical/PageShell";
import {SectionCard} from "@/src/components/ui/tactical/SectionCard";
import {FrameDataEditableColumn, FrameDataModerationMove} from "@/src/types/frameDataModeration";

function normalizeApiError(error: unknown, fallbackMessage: string): string {
    if (typeof error !== "object" || error === null) {
        return fallbackMessage;
    }

    const maybeResponse = error as {response?: {data?: {error?: string; message?: string}}; message?: string};

    return maybeResponse.response?.data?.error || maybeResponse.response?.data?.message || maybeResponse.message || fallbackMessage;
}

function inputValue(value: number | string | null | undefined): string {
    return value === null || typeof value === "undefined" ? "" : String(value);
}

function manualMetadataFor(move: FrameDataModerationMove): {whiffOnCrouch: boolean; forcesStanding: boolean} {
    return {
        whiffOnCrouch: Boolean(move.manualMetadata?.whiffOnCrouch),
        forcesStanding: Boolean(move.manualMetadata?.forcesStanding),
    };
}

export default function FrameDataModerationPage() {
    const authContext = React.useContext(AuthContext);
    const {characters, loading: loadingCharacters} = useCharacters();
    const {getMovesForCharacter, saveOverride, saveManualMetadata} = useFrameDataModeration();

    const [selectedCharacterId, setSelectedCharacterId] = React.useState("");
    const [columns, setColumns] = React.useState<FrameDataEditableColumn[]>([]);
    const [moves, setMoves] = React.useState<FrameDataModerationMove[]>([]);
    const [drafts, setDrafts] = React.useState<Record<string, string>>({});
    const [loadingMoves, setLoadingMoves] = React.useState(false);
    const [pageError, setPageError] = React.useState<string | null>(null);
    const [pendingCell, setPendingCell] = React.useState<string | null>(null);
    const [toast, setToast] = React.useState<{open: boolean; severity: "success" | "error"; message: string}>({open: false, severity: "success", message: ""});

    if (!authContext) {
        throw new Error("AuthContext must be used within an AuthProvider");
    }

    const {loading, isAuthenticated, canModerate} = authContext;

    const loadMoves = React.useCallback(async (characterId: string) => {
        if (!characterId) {
            setMoves([]);
            return;
        }

        setLoadingMoves(true);
        setPageError(null);
        try {
            const payload = await getMovesForCharacter(characterId);
            setColumns(payload.columns);
            setMoves(payload.moves.map((move) => ({...move, manualMetadata: manualMetadataFor(move)})));
            const nextDrafts: Record<string, string> = {};
            for (const move of payload.moves) {
                for (const column of payload.columns) {
                    nextDrafts[`${move.frameDataId}:${column.columnName}`] = inputValue(move.values[column.columnName]?.effectiveValue);
                }
            }
            setDrafts(nextDrafts);
        } catch (error: unknown) {
            setPageError(normalizeApiError(error, "Unable to load frame data moderation rows."));
        } finally {
            setLoadingMoves(false);
        }
    }, [getMovesForCharacter]);

    const handleCharacterChange = (characterId: string) => {
        setSelectedCharacterId(characterId);
        void loadMoves(characterId);
    };

    const showToast = (severity: "success" | "error", message: string) => {
        setToast({open: true, severity, message});
    };

    const handleSaveOverride = async (move: FrameDataModerationMove, column: FrameDataEditableColumn) => {
        const key = `${move.frameDataId}:${column.columnName}`;
        const rawDraft = drafts[key] ?? "";
        const value = rawDraft.trim() === "" ? null : column.type === "integer" ? Number(rawDraft) : rawDraft;

        if (column.type === "integer" && value !== null && !Number.isInteger(value)) {
            showToast("error", `${column.label} must be an integer.`);
            return;
        }

        setPendingCell(key);
        try {
            const response = await saveOverride(move.frameDataId, column.columnName, value);
            setMoves((current) => current.map((currentMove) => currentMove.frameDataId === move.frameDataId
                ? {...currentMove, values: {...currentMove.values, [column.columnName]: response}}
                : currentMove
            ));
            setDrafts((current) => ({...current, [key]: inputValue(response.effectiveValue)}));
            showToast("success", "Override saved.");
        } catch (error: unknown) {
            showToast("error", normalizeApiError(error, "Unable to save override."));
        } finally {
            setPendingCell(null);
        }
    };

    const handleSaveMetadata = async (move: FrameDataModerationMove, nextMetadata: {whiffOnCrouch: boolean; forcesStanding: boolean}) => {
        const key = `metadata:${move.moveId}`;
        setPendingCell(key);
        try {
            const response = await saveManualMetadata(move.moveId, nextMetadata.whiffOnCrouch, nextMetadata.forcesStanding);
            setMoves((current) => current.map((currentMove) => currentMove.moveId === move.moveId
                ? {...currentMove, manualMetadata: {whiffOnCrouch: Boolean(response.whiffOnCrouch), forcesStanding: Boolean(response.forcesStanding)}}
                : currentMove
            ));
            showToast("success", "Manual metadata saved.");
        } catch (error: unknown) {
            showToast("error", normalizeApiError(error, "Unable to save manual metadata."));
        } finally {
            setPendingCell(null);
        }
    };

    if (loading) {
        return <AppContainer maxWidth={false}><AppCircularProgress/></AppContainer>;
    }

    if (!isAuthenticated) {
        return null;
    }

    if (!canModerate) {
        return (
            <AppContainer maxWidth={false}>
                <AppTypography variant="h4" gutterBottom>Frame Data Moderation</AppTypography>
                <AppTypography>You do not have permission to access moderation tools.</AppTypography>
            </AppContainer>
        );
    }

    return (
        <AppContainer maxWidth={false}>
            <PageShell title="Frame Data Moderation" badgeLabel={selectedCharacterId ? `${moves.length} moves` : "Select character"}>
                <SectionCard title="Character" variant="review" tone="raised">
                    <AppBox sx={{display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap"}}>
                        <AppFormControl size="small" sx={{minWidth: 260}}>
                            <AppInputLabel id="frame-data-character-label">Character</AppInputLabel>
                            <AppSelect
                                labelId="frame-data-character-label"
                                label="Character"
                                value={selectedCharacterId}
                                onChange={(event) => handleCharacterChange(String(event.target.value))}
                                disabled={loadingCharacters}
                            >
                                {characters.map((character) => <AppMenuItem key={character.id} value={character.id}>{character.name}</AppMenuItem>)}
                            </AppSelect>
                        </AppFormControl>
                        <AppButton type="button" variant="outlined" disabled={!selectedCharacterId || loadingMoves} onClick={() => void loadMoves(selectedCharacterId)}>
                            {loadingMoves ? "Refreshing..." : "Refresh"}
                        </AppButton>
                    </AppBox>
                </SectionCard>

                {pageError ? <InlineNotice severity="error">{pageError}</InlineNotice> : null}

                <SectionCard title="Imported FAT Fields" variant="review">
                    {loadingMoves ? (
                        <AppBox sx={{display: "flex", justifyContent: "center", py: 2}}><AppCircularProgress/></AppBox>
                    ) : moves.length === 0 ? (
                        <InlineNotice severity="info">Select a character to edit FAT overrides.</InlineNotice>
                    ) : (
                        <AppTableContainer sx={{maxHeight: "calc(100vh - 330px)", backgroundColor: "fgc.surface.base"}}>
                            <AppTable stickyHeader size="small">
                                <AppTableHead>
                                    <AppTableRow>
                                        <AppTableCell sx={{fontWeight: 700, backgroundColor: "fgc.surface.sunken", minWidth: 180}}>Move</AppTableCell>
                                        <AppTableCell sx={{fontWeight: 700, backgroundColor: "fgc.surface.sunken", minWidth: 110}}>Numpad</AppTableCell>
                                        {columns.map((column) => <AppTableCell key={column.columnName} sx={{fontWeight: 700, backgroundColor: "fgc.surface.sunken", minWidth: 150}}>{column.label}</AppTableCell>)}
                                    </AppTableRow>
                                </AppTableHead>
                                <AppTableBody>
                                    {moves.map((move) => (
                                        <AppTableRow key={move.moveId} hover>
                                            <AppTableCell>{move.name}</AppTableCell>
                                            <AppTableCell>{move.numpadNotation}</AppTableCell>
                                            {columns.map((column) => {
                                                const key = `${move.frameDataId}:${column.columnName}`;
                                                const value = move.values[column.columnName];
                                                return (
                                                    <AppTableCell key={column.columnName}>
                                                        <AppTextField
                                                            size="small"
                                                            value={drafts[key] ?? ""}
                                                            onChange={(event) => setDrafts((current) => ({...current, [key]: event.target.value}))}
                                                            onBlur={() => void handleSaveOverride(move, column)}
                                                            disabled={!move.frameDataId || pendingCell === key}
                                                            inputProps={{inputMode: column.type === "integer" ? "numeric" : "text"}}
                                                            helperText={value?.isOverridden ? `Base: ${inputValue(value.baseValue)}` : " "}
                                                        />
                                                    </AppTableCell>
                                                );
                                            })}
                                        </AppTableRow>
                                    ))}
                                </AppTableBody>
                            </AppTable>
                        </AppTableContainer>
                    )}
                </SectionCard>

                <SectionCard title="Manual Metadata" variant="review">
                    {moves.length === 0 ? (
                        <InlineNotice severity="info">Select a character to edit project-specific metadata.</InlineNotice>
                    ) : (
                        <AppTableContainer sx={{backgroundColor: "fgc.surface.base"}}>
                            <AppTable size="small">
                                <AppTableHead>
                                    <AppTableRow>
                                        <AppTableCell sx={{fontWeight: 700, backgroundColor: "fgc.surface.sunken"}}>Move</AppTableCell>
                                        <AppTableCell sx={{fontWeight: 700, backgroundColor: "fgc.surface.sunken"}}>Numpad</AppTableCell>
                                        <AppTableCell sx={{fontWeight: 700, backgroundColor: "fgc.surface.sunken"}}>Whiff on Crouch</AppTableCell>
                                        <AppTableCell sx={{fontWeight: 700, backgroundColor: "fgc.surface.sunken"}}>Forces Standing</AppTableCell>
                                    </AppTableRow>
                                </AppTableHead>
                                <AppTableBody>
                                    {moves.map((move) => {
                                        const key = `metadata:${move.moveId}`;
                                        const metadata = manualMetadataFor(move);
                                        return (
                                            <AppTableRow key={move.moveId} hover>
                                                <AppTableCell>{move.name}</AppTableCell>
                                                <AppTableCell>{move.numpadNotation}</AppTableCell>
                                                <AppTableCell>
                                                    <AppCheckbox
                                                        checked={metadata.whiffOnCrouch}
                                                        disabled={pendingCell === key}
                                                        onChange={(event) => void handleSaveMetadata(move, {...metadata, whiffOnCrouch: event.target.checked})}
                                                        inputProps={{"aria-label": `${move.name} whiffs on crouch`}}
                                                    />
                                                </AppTableCell>
                                                <AppTableCell>
                                                    <AppCheckbox
                                                        checked={metadata.forcesStanding}
                                                        disabled={pendingCell === key}
                                                        onChange={(event) => void handleSaveMetadata(move, {...metadata, forcesStanding: event.target.checked})}
                                                        inputProps={{"aria-label": `${move.name} forces standing`}}
                                                    />
                                                </AppTableCell>
                                            </AppTableRow>
                                        );
                                    })}
                                </AppTableBody>
                            </AppTable>
                        </AppTableContainer>
                    )}
                </SectionCard>
            </PageShell>

            <AppSnackbar open={toast.open} autoHideDuration={3000} onClose={() => setToast((current) => ({...current, open: false}))} anchorOrigin={{vertical: "bottom", horizontal: "right"}}>
                <AppAlert severity={toast.severity} variant="filled" onClose={() => setToast((current) => ({...current, open: false}))} sx={{width: "100%"}}>{toast.message}</AppAlert>
            </AppSnackbar>
        </AppContainer>
    );
}
