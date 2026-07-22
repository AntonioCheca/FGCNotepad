import React from "react";
import AuthContext from "@/services/AuthContext";
import {AppContainer} from "@/src/components/ui/AppContainer";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {AppCircularProgress} from "@/src/components/ui/AppCircularProgress";
import {useAdminUsers} from "@/hooks/useAdminUsers";
import {AdminUserRole, AdminUserRow} from "@/src/types/adminUsers";
import {PageShell} from "@/src/components/ui/tactical/PageShell";
import {SectionCard} from "@/src/components/ui/tactical/SectionCard";
import {InlineNotice} from "@/src/components/ui/tactical/InlineNotice";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppChip} from "@/src/components/ui/AppChip";
import {AppFormControl} from "@/src/components/ui/AppFormControl";
import {AppInputLabel} from "@/src/components/ui/AppInputLabel";
import {AppSelect} from "@/src/components/ui/AppSelect";
import {AppMenuItem} from "@/src/components/ui/AppMenuItem";
import {AppTableContainer} from "@/src/components/ui/AppTableContainer";
import {AppTable} from "@/src/components/ui/AppTable";
import {AppTableHead} from "@/src/components/ui/AppTableHead";
import {AppTableRow} from "@/src/components/ui/AppTableRow";
import {AppTableCell} from "@/src/components/ui/AppTableCell";
import {AppTableBody} from "@/src/components/ui/AppTableBody";
import {AppDialog} from "@/src/components/ui/AppDialog";
import {AppDialogTitle} from "@/src/components/ui/AppDialogTitle";
import {AppDialogContent} from "@/src/components/ui/AppDialogContent";
import {AppDialogActions} from "@/src/components/ui/AppDialogActions";
import {AppSnackbar} from "@/src/components/ui/AppSnackbar";
import {AppAlert} from "@/src/components/ui/AppAlert";
import {formatUtcDateTime} from "@/src/utils/formatDateTime";

type RolePreset = "user" | "moderator" | "admin";

const ROLE_PRESET_TO_ROLES: Record<RolePreset, AdminUserRole[]> = {
    user: ["ROLE_USER"],
    moderator: ["ROLE_MODERATOR", "ROLE_USER"],
    admin: ["ROLE_ADMIN", "ROLE_USER"],
};

function hasRole(roles: string[], role: AdminUserRole): boolean {
    return roles.includes(role);
}

function rolePresetFromRoles(roles: string[]): RolePreset {
    if (hasRole(roles, "ROLE_ADMIN")) {
        return "admin";
    }

    if (hasRole(roles, "ROLE_MODERATOR")) {
        return "moderator";
    }

    return "user";
}

function normalizeApiError(error: unknown, fallbackMessage: string): string {
    if (typeof error !== "object" || error === null) {
        return fallbackMessage;
    }

    const maybeResponse = error as {
        response?: {
            data?: {error?: string; message?: string};
        };
        message?: string;
    };

    return maybeResponse.response?.data?.error
        || maybeResponse.response?.data?.message
        || maybeResponse.message
        || fallbackMessage;
}

interface AdminControlsProps {
    size: number;
    loadingUsers: boolean;
    onSizeChange: (size: number) => void;
    onRefresh: () => void;
}

function AdminControls({size, loadingUsers, onSizeChange, onRefresh}: AdminControlsProps) {
    return (
        <SectionCard
            title="Admin Controls"
            variant="review"
            tone="raised"
        >
            <AppBox sx={{display: "flex", justifyContent: "space-between", gap: 1, alignItems: "center", flexWrap: "wrap"}}>
                <AppBox sx={{display: "flex", gap: 0.8, alignItems: "center", flexWrap: "wrap"}}>
                    <AppTypography variant="body2">Rows per page</AppTypography>
                    <AppFormControl size="small" sx={{minWidth: 100}}>
                        <AppInputLabel id="admin-size-label">Size</AppInputLabel>
                        <AppSelect
                            labelId="admin-size-label"
                            label="Size"
                            value={String(size)}
                            onChange={(event) => onSizeChange(Number(event.target.value))}
                        >
                            <AppMenuItem value="10">10</AppMenuItem>
                            <AppMenuItem value="20">20</AppMenuItem>
                            <AppMenuItem value="50">50</AppMenuItem>
                        </AppSelect>
                    </AppFormControl>
                </AppBox>

                <AppButton type="button" variant="outlined" onClick={onRefresh} disabled={loadingUsers}>
                    {loadingUsers ? "Refreshing..." : "Refresh"}
                </AppButton>
            </AppBox>
        </SectionCard>
    );
}

interface UsersSectionProps {
    rows: AdminUserRow[];
    loadingUsers: boolean;
    page: number;
    totalPages: number;
    roleDraftById: Record<string, RolePreset>;
    pendingById: Record<string, boolean>;
    rowErrorById: Record<string, string>;
    onPreviousPage: () => void;
    onNextPage: () => void;
    onRoleDraftChange: (rowId: string, preset: RolePreset) => void;
    onSaveRoles: (row: AdminUserRow) => Promise<void>;
    onDeactivate: (row: AdminUserRow) => Promise<void>;
    onConfirm: (title: string, body: string, action: () => Promise<void>) => void;
}

function UsersSection({rows, loadingUsers, page, totalPages, roleDraftById, pendingById, rowErrorById, onPreviousPage, onNextPage, onRoleDraftChange, onSaveRoles, onDeactivate, onConfirm}: UsersSectionProps) {
    return (
        <SectionCard
            title="Users"
            description="Use confirmation for dangerous actions. Backend validations are shown per user row."
            variant="review"
        >
            {loadingUsers ? (
                <AppBox sx={{display: "flex", justifyContent: "center", py: 2}}>
                    <AppCircularProgress/>
                </AppBox>
            ) : rows.length === 0 ? (
                <InlineNotice severity="info">No users found for this page.</InlineNotice>
            ) : (
                <AppTableContainer sx={{maxHeight: "calc(100vh - 320px)", backgroundColor: "fgc.surface.base"}}>
                    <AppTable stickyHeader size="small">
                        <AppTableHead>
                            <AppTableRow>
                                <AppTableCell sx={{fontWeight: 700, backgroundColor: "fgc.surface.sunken"}}>Username</AppTableCell>
                                <AppTableCell sx={{fontWeight: 700, backgroundColor: "fgc.surface.sunken"}}>Status</AppTableCell>
                                <AppTableCell sx={{fontWeight: 700, backgroundColor: "fgc.surface.sunken"}}>Current Roles</AppTableCell>
                                <AppTableCell sx={{fontWeight: 700, backgroundColor: "fgc.surface.sunken"}}>Role Action</AppTableCell>
                                <AppTableCell sx={{fontWeight: 700, backgroundColor: "fgc.surface.sunken"}}>Account Action</AppTableCell>
                            </AppTableRow>
                        </AppTableHead>

                        <AppTableBody>
                            {rows.map((row) => {
                                const pending = Boolean(pendingById[row.id]);
                                const draft = roleDraftById[row.id] ?? rolePresetFromRoles(row.roles);
                                const currentPreset = rolePresetFromRoles(row.roles);
                                const isRoleChanged = draft !== currentPreset;
                                const rowError = rowErrorById[row.id];

                                return (
                                    <AppTableRow key={row.id} hover>
                                        <AppTableCell>
                                            <AppBox sx={{display: "grid", gap: 0.4}}>
                                                <AppTypography variant="body2" sx={{fontWeight: 650}}>{row.username}</AppTypography>
                                                <AppTypography variant="caption" color="text.secondary">ID: {row.id}</AppTypography>
                                            </AppBox>
                                        </AppTableCell>
                                        <AppTableCell>
                                            <AppBox sx={{display: "grid", gap: 0.4}}>
                                                <AppChip size="small" label={row.isActive ? "Active" : "Deactivated"} color={row.isActive ? "success" : "default"} variant="outlined" />
                                                {!row.isActive ? (
                                                    <AppTypography variant="caption" color="text.secondary">
                                                        Deactivated at {formatUtcDateTime(row.deactivatedAt)}
                                                    </AppTypography>
                                                ) : null}
                                            </AppBox>
                                        </AppTableCell>
                                        <AppTableCell>
                                            <AppBox sx={{display: "flex", gap: 0.5, flexWrap: "wrap"}}>
                                                {row.roles.map((role) => <AppChip key={`${row.id}-${role}`} size="small" label={role} variant="outlined"/>)}
                                            </AppBox>
                                        </AppTableCell>
                                        <AppTableCell sx={{minWidth: 280}}>
                                            <AppBox sx={{display: "grid", gap: 0.6}}>
                                                <AppFormControl size="small" fullWidth>
                                                    <AppInputLabel id={`role-select-${row.id}`}>Role Preset</AppInputLabel>
                                                    <AppSelect
                                                        labelId={`role-select-${row.id}`}
                                                        label="Role Preset"
                                                        value={draft}
                                                        disabled={pending || !row.isActive}
                                                        onChange={(event) => onRoleDraftChange(row.id, event.target.value as RolePreset)}
                                                    >
                                                        <AppMenuItem value="user">User</AppMenuItem>
                                                        <AppMenuItem value="moderator">Moderator</AppMenuItem>
                                                        <AppMenuItem value="admin">Admin</AppMenuItem>
                                                    </AppSelect>
                                                </AppFormControl>

                                                <AppButton
                                                    type="button"
                                                    size="small"
                                                    disabled={pending || !isRoleChanged || !row.isActive}
                                                    onClick={() => {
                                                        if (hasRole(row.roles, "ROLE_ADMIN") && draft !== "admin") {
                                                            onConfirm(
                                                                "Confirm Admin Role Removal",
                                                                `Remove admin privileges from ${row.username}? Last-active-admin protection may block this action.`,
                                                                async () => onSaveRoles(row)
                                                            );
                                                            return;
                                                        }

                                                        void onSaveRoles(row);
                                                    }}
                                                >
                                                    {pending ? "Saving..." : "Save Roles"}
                                                </AppButton>
                                            </AppBox>
                                        </AppTableCell>
                                        <AppTableCell sx={{minWidth: 220}}>
                                            <AppBox sx={{display: "grid", gap: 0.6}}>
                                                <AppButton
                                                    type="button"
                                                    size="small"
                                                    color="error"
                                                    variant="outlined"
                                                    disabled={pending || !row.isActive}
                                                    onClick={() => {
                                                        onConfirm(
                                                            "Confirm Deactivation",
                                                            `Deactivate ${row.username}? This user will no longer be able to authenticate.`,
                                                            async () => onDeactivate(row)
                                                        );
                                                    }}
                                                >
                                                    {pending ? "Processing..." : "Deactivate"}
                                                </AppButton>

                                                {rowError ? <AppTypography variant="caption" color="error">{rowError}</AppTypography> : null}
                                            </AppBox>
                                        </AppTableCell>
                                    </AppTableRow>
                                );
                            })}
                        </AppTableBody>
                    </AppTable>
                </AppTableContainer>
            )}

            <AppBox sx={{display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1, pt: 1}}>
                <AppTypography variant="body2" color="text.secondary">Page {page} of {totalPages}</AppTypography>
                <AppBox sx={{display: "flex", gap: 0.75}}>
                    <AppButton type="button" variant="outlined" disabled={page <= 1 || loadingUsers} onClick={onPreviousPage}>Previous</AppButton>
                    <AppButton type="button" variant="outlined" disabled={page >= totalPages || loadingUsers} onClick={onNextPage}>Next</AppButton>
                </AppBox>
            </AppBox>
        </SectionCard>
    );
}

interface ConfirmActionDialogProps {
    open: boolean;
    title: string;
    body: string;
    loading: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

function ConfirmActionDialog({open, title, body, loading, onClose, onConfirm}: ConfirmActionDialogProps) {
    return (
        <AppDialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <AppDialogTitle>{title}</AppDialogTitle>
            <AppDialogContent>
                <AppTypography>{body}</AppTypography>
            </AppDialogContent>
            <AppDialogActions>
                <AppButton type="button" variant="outlined" onClick={onClose} disabled={loading}>Cancel</AppButton>
                <AppButton type="button" color="error" onClick={onConfirm} disabled={loading}>{loading ? "Confirming..." : "Confirm"}</AppButton>
            </AppDialogActions>
        </AppDialog>
    );
}

interface AdminToastProps {
    open: boolean;
    severity: "success" | "error";
    message: string;
    onClose: () => void;
}

function AdminToast({open, severity, message, onClose}: AdminToastProps) {
    return (
        <AppSnackbar open={open} autoHideDuration={3000} onClose={onClose} anchorOrigin={{vertical: "bottom", horizontal: "right"}}>
            <AppAlert severity={severity} variant="filled" onClose={onClose} sx={{width: "100%"}}>
                {message}
            </AppAlert>
        </AppSnackbar>
    );
}

export default function AdminUsersPage() {
    const authContext = React.useContext(AuthContext);
    const {listUsers, updateUserRoles, deactivateUser} = useAdminUsers();

    const [rows, setRows] = React.useState<AdminUserRow[]>([]);
    const [page, setPage] = React.useState<number>(1);
    const [size, setSize] = React.useState<number>(20);
    const [total, setTotal] = React.useState<number>(0);
    const [loadingUsers, setLoadingUsers] = React.useState<boolean>(true);
    const [pageError, setPageError] = React.useState<string | null>(null);

    const [roleDraftById, setRoleDraftById] = React.useState<Record<string, RolePreset>>({});
    const [pendingById, setPendingById] = React.useState<Record<string, boolean>>({});
    const [rowErrorById, setRowErrorById] = React.useState<Record<string, string>>({});

    const [confirmOpen, setConfirmOpen] = React.useState(false);
    const [confirmTitle, setConfirmTitle] = React.useState("");
    const [confirmBody, setConfirmBody] = React.useState("");
    const confirmActionRef = React.useRef<(() => Promise<void>) | null>(null);
    const [confirmLoading, setConfirmLoading] = React.useState(false);

    const [toastOpen, setToastOpen] = React.useState(false);
    const [toastSeverity, setToastSeverity] = React.useState<"success" | "error">("success");
    const [toastMessage, setToastMessage] = React.useState("");

    if (!authContext) {
        throw new Error("AuthContext must be used within an AuthProvider");
    }

    const {loading, isAuthenticated, canManageUsers} = authContext;

    const showToast = (severity: "success" | "error", message: string) => {
        setToastSeverity(severity);
        setToastMessage(message);
        setToastOpen(true);
    };

    const loadUsers = React.useCallback(async () => {
        setLoadingUsers(true);
        setPageError(null);

        try {
            const payload = await listUsers(page, size);
            setRows(payload.data ?? []);
            setTotal(payload.total ?? 0);
            setRoleDraftById((current) => {
                const next = {...current};
                for (const row of payload.data ?? []) {
                    if (!(row.id in next)) {
                        next[row.id] = rolePresetFromRoles(row.roles);
                    }
                }
                return next;
            });
        } catch (error: unknown) {
            setPageError(normalizeApiError(error, "Unable to load users."));
        } finally {
            setLoadingUsers(false);
        }
    }, [listUsers, page, size]);

    const openConfirmation = (title: string, body: string, action: () => Promise<void>) => {
        setConfirmTitle(title);
        setConfirmBody(body);
        confirmActionRef.current = action;
        setConfirmOpen(true);
    };

    const closeConfirmation = () => {
        if (confirmLoading) {
            return;
        }

        setConfirmOpen(false);
        confirmActionRef.current = null;
        setConfirmTitle("");
        setConfirmBody("");
    };

    const runConfirmedAction = async () => {
        if (!confirmActionRef.current) {
            return;
        }

        setConfirmLoading(true);
        try {
            await confirmActionRef.current();
            setConfirmOpen(false);
            confirmActionRef.current = null;
        } finally {
            setConfirmLoading(false);
        }
    };

    React.useEffect(() => {
        if (loading || !isAuthenticated || !canManageUsers) {
            return;
        }

        void loadUsers();
    }, [canManageUsers, isAuthenticated, loadUsers, loading]);

    const handleSaveRoles = async (row: AdminUserRow): Promise<void> => {
        const rowId = row.id;
        const nextPreset = roleDraftById[rowId] ?? rolePresetFromRoles(row.roles);
        const nextRoles = ROLE_PRESET_TO_ROLES[nextPreset];

        setRowErrorById((current) => ({...current, [rowId]: ""}));
        setPendingById((current) => ({...current, [rowId]: true}));

        try {
            const updated = await updateUserRoles(rowId, nextRoles);
            setRows((current) => current.map((entry) => (entry.id === rowId ? updated : entry)));
            setRoleDraftById((current) => ({...current, [rowId]: rolePresetFromRoles(updated.roles)}));
            showToast("success", `Updated roles for ${row.username}.`);
        } catch (error: unknown) {
            const message = normalizeApiError(error, "Unable to update roles.");
            setRowErrorById((current) => ({...current, [rowId]: message}));
            showToast("error", message);
        } finally {
            setPendingById((current) => ({...current, [rowId]: false}));
        }
    };

    const handleDeactivate = async (row: AdminUserRow): Promise<void> => {
        const rowId = row.id;
        setRowErrorById((current) => ({...current, [rowId]: ""}));
        setPendingById((current) => ({...current, [rowId]: true}));

        try {
            const updated = await deactivateUser(rowId);
            setRows((current) => current.map((entry) => (entry.id === rowId ? updated : entry)));
            showToast("success", `Deactivated ${row.username}.`);
        } catch (error: unknown) {
            const message = normalizeApiError(error, "Unable to deactivate user.");
            setRowErrorById((current) => ({...current, [rowId]: message}));
            showToast("error", message);
        } finally {
            setPendingById((current) => ({...current, [rowId]: false}));
        }
    };

    if (loading) {
        return (
            <AppContainer maxWidth={false}>
                <AppCircularProgress/>
            </AppContainer>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    if (!canManageUsers) {
        return (
            <AppContainer maxWidth={false}>
                <AppTypography variant="h4" gutterBottom>User Management</AppTypography>
                <AppTypography>You do not have permission to access admin user management.</AppTypography>
            </AppContainer>
        );
    }

    const totalPages = Math.max(1, Math.ceil(total / size));

    return (
        <AppContainer maxWidth={false}>
            <PageShell
                title="User Management"
                badgeLabel={`Total users: ${total}`}
            >
                <AdminControls
                    size={size}
                    loadingUsers={loadingUsers}
                    onSizeChange={(nextSize) => {
                        setSize(nextSize);
                        setPage(1);
                    }}
                    onRefresh={() => void loadUsers()}
                />

                {pageError ? <InlineNotice severity="error">{pageError}</InlineNotice> : null}

                <UsersSection
                    rows={rows}
                    loadingUsers={loadingUsers}
                    page={page}
                    totalPages={totalPages}
                    roleDraftById={roleDraftById}
                    pendingById={pendingById}
                    rowErrorById={rowErrorById}
                    onPreviousPage={() => setPage((current) => Math.max(1, current - 1))}
                    onNextPage={() => setPage((current) => Math.min(totalPages, current + 1))}
                    onRoleDraftChange={(rowId, preset) => setRoleDraftById((current) => ({...current, [rowId]: preset}))}
                    onSaveRoles={handleSaveRoles}
                    onDeactivate={handleDeactivate}
                    onConfirm={openConfirmation}
                />
            </PageShell>

            <ConfirmActionDialog open={confirmOpen} title={confirmTitle} body={confirmBody} loading={confirmLoading} onClose={closeConfirmation} onConfirm={() => void runConfirmedAction()} />
            <AdminToast open={toastOpen} severity={toastSeverity} message={toastMessage} onClose={() => setToastOpen(false)} />
        </AppContainer>
    );
}
