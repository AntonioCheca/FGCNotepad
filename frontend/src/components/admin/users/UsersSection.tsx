import {AppTypography} from "@/src/components/ui/AppTypography";
import {AppCircularProgress} from "@/src/components/ui/AppCircularProgress";
import {AdminUserRow} from "@/src/types/adminUsers";
import {SectionCard} from "@/src/components/ui/tactical/SectionCard";
import {InlineNotice} from "@/src/components/ui/tactical/InlineNotice";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppChip} from "@/src/components/ui/AppChip";
import {AppFormControl} from "@/src/components/ui/AppFormControl";
import {AppInputLabel} from "@/src/components/ui/AppInputLabel";
import {AppSelect} from "@/src/components/ui/AppSelect";
import {AppTableContainer} from "@/src/components/ui/AppTableContainer";
import {AppTable} from "@/src/components/ui/AppTable";
import {AppTableHead} from "@/src/components/ui/AppTableHead";
import {AppTableRow} from "@/src/components/ui/AppTableRow";
import {AppTableCell} from "@/src/components/ui/AppTableCell";
import {AppTableBody} from "@/src/components/ui/AppTableBody";
import {formatUtcDateTime} from "@/src/utils/formatDateTime";
import {RolePreset, hasRole, rolePresetFromRoles, roleMenuItems} from "@/src/components/admin/users/adminUserRoles";

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

export function UsersSection({rows, loadingUsers, page, totalPages, roleDraftById, pendingById, rowErrorById, onPreviousPage, onNextPage, onRoleDraftChange, onSaveRoles, onDeactivate, onConfirm}: UsersSectionProps) {
    const renderRoleSaveButton = (row: AdminUserRow, draft: RolePreset, pending: boolean, isRoleChanged: boolean) => (
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
    );

    const renderDeactivateButton = (row: AdminUserRow, pending: boolean) => (
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
    );

    return (
        <SectionCard
            title="Users"
            description="Use confirmation for dangerous actions. Backend validations are shown per user row."
        >
            {loadingUsers ? (
                <AppBox sx={{display: "flex", justifyContent: "center", py: 2}}>
                    <AppCircularProgress/>
                </AppBox>
            ) : rows.length === 0 ? (
                <InlineNotice severity="info">No users found for this page.</InlineNotice>
            ) : (
                <>
                <AppTableContainer sx={{display: {xs: "none", md: "block"}, maxHeight: "calc(100dvh - 320px)", backgroundColor: "fgc.surface.base"}}>
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
                                                        {roleMenuItems}
                                                    </AppSelect>
                                                </AppFormControl>

                                                {renderRoleSaveButton(row, draft, pending, isRoleChanged)}
                                            </AppBox>
                                        </AppTableCell>
                                        <AppTableCell sx={{minWidth: 220}}>
                                            <AppBox sx={{display: "grid", gap: 0.6}}>
                                                {renderDeactivateButton(row, pending)}

                                                {rowError ? <AppTypography variant="caption" color="error">{rowError}</AppTypography> : null}
                                            </AppBox>
                                        </AppTableCell>
                                    </AppTableRow>
                                );
                            })}
                        </AppTableBody>
                    </AppTable>
                </AppTableContainer>
                <AppBox sx={{display: {xs: "grid", md: "none"}, gap: 1}}>
                    {rows.map((row) => {
                        const pending = Boolean(pendingById[row.id]);
                        const draft = roleDraftById[row.id] ?? rolePresetFromRoles(row.roles);
                        const currentPreset = rolePresetFromRoles(row.roles);
                        const isRoleChanged = draft !== currentPreset;
                        const rowError = rowErrorById[row.id];

                        return (
                            <AppBox key={row.id} sx={{display: "grid", gap: 1, border: "1px solid", borderColor: "fgc.border.default", borderRadius: 1.25, p: 1.25, backgroundColor: "fgc.surface.subtle"}}>
                                <AppBox sx={{display: "flex", justifyContent: "space-between", gap: 1, alignItems: "flex-start"}}>
                                    <AppBox sx={{display: "grid", gap: 0.25, minWidth: 0}}>
                                        <AppTypography variant="body2" sx={{fontWeight: 650, overflowWrap: "anywhere"}}>{row.username}</AppTypography>
                                        <AppTypography variant="caption" color="text.secondary" sx={{overflowWrap: "anywhere"}}>ID: {row.id}</AppTypography>
                                    </AppBox>
                                    <AppChip size="small" label={row.isActive ? "Active" : "Deactivated"} color={row.isActive ? "success" : "default"} variant="outlined" />
                                </AppBox>

                                {!row.isActive ? <AppTypography variant="caption" color="text.secondary">Deactivated at {formatUtcDateTime(row.deactivatedAt)}</AppTypography> : null}

                                <AppBox sx={{display: "flex", gap: 0.5, flexWrap: "wrap"}}>
                                    {row.roles.map((role) => <AppChip key={`${row.id}-mobile-${role}`} size="small" label={role} variant="outlined"/>)}
                                </AppBox>

                                <AppBox sx={{display: "grid", gap: 0.75}}>
                                    <AppFormControl size="small" fullWidth>
                                        <AppInputLabel id={`mobile-role-select-${row.id}`}>Role Preset</AppInputLabel>
                                        <AppSelect
                                            labelId={`mobile-role-select-${row.id}`}
                                            label="Role Preset"
                                            value={draft}
                                            disabled={pending || !row.isActive}
                                            onChange={(event) => onRoleDraftChange(row.id, event.target.value as RolePreset)}
                                        >
                                            {roleMenuItems}
                                        </AppSelect>
                                    </AppFormControl>

                                    <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", sm: "repeat(2, minmax(0, 1fr))"}, gap: 0.75}}>
                                        {renderRoleSaveButton(row, draft, pending, isRoleChanged)}
                                        {renderDeactivateButton(row, pending)}
                                    </AppBox>
                                    {rowError ? <AppTypography variant="caption" color="error">{rowError}</AppTypography> : null}
                                </AppBox>
                            </AppBox>
                        );
                    })}
                </AppBox>
                </>
            )}

            <AppBox sx={{display: "flex", flexDirection: {xs: "column", sm: "row"}, justifyContent: "space-between", alignItems: {xs: "stretch", sm: "center"}, gap: 1, pt: 1}}>
                <AppTypography variant="body2" color="text.secondary">Page {page} of {totalPages}</AppTypography>
                <AppBox sx={{display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 0.75}}>
                    <AppButton type="button" variant="outlined" disabled={page <= 1 || loadingUsers} onClick={onPreviousPage}>Previous</AppButton>
                    <AppButton type="button" variant="outlined" disabled={page >= totalPages || loadingUsers} onClick={onNextPage}>Next</AppButton>
                </AppBox>
            </AppBox>
        </SectionCard>
    );
}
