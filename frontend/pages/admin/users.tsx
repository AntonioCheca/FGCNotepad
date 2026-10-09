import React from "react";
import AuthContext from "@/services/AuthContext";
import {AppContainer} from "@/src/components/ui/AppContainer";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {AppCircularProgress} from "@/src/components/ui/AppCircularProgress";
import {useAdminUsers} from "@/hooks/useAdminUsers";
import {AdminUserRow} from "@/src/types/adminUsers";
import {PageShell} from "@/src/components/ui/tactical/PageShell";
import {InlineNotice} from "@/src/components/ui/tactical/InlineNotice";
import {normalizeApiError} from "@/src/utils/apiErrorMessage";
import {ActionToast} from "@/src/components/ui/tactical/ActionToast";
import {RolePreset, ROLE_PRESET_TO_ROLES, rolePresetFromRoles} from "@/src/components/admin/users/adminUserRoles";
import {AdminControls} from "@/src/components/admin/users/AdminControls";
import {UsersSection} from "@/src/components/admin/users/UsersSection";
import {ConfirmActionDialog} from "@/src/components/admin/users/ConfirmActionDialog";

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
        <AppContainer maxWidth={false} sx={{py: {xs: 2.25, md: 3.25}, px: {xs: 1.75, md: 3, xl: 4}}}>
            <PageShell desktopOnly
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
            <ActionToast open={toastOpen} severity={toastSeverity} message={toastMessage} onClose={() => setToastOpen(false)} />
        </AppContainer>
    );
}
