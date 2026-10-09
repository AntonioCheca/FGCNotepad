import {AppTypography} from "@/src/components/ui/AppTypography";
import {SectionCard} from "@/src/components/ui/tactical/SectionCard";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppFormControl} from "@/src/components/ui/AppFormControl";
import {AppInputLabel} from "@/src/components/ui/AppInputLabel";
import {AppSelect} from "@/src/components/ui/AppSelect";
import {AppMenuItem} from "@/src/components/ui/AppMenuItem";

interface AdminControlsProps {
    size: number;
    loadingUsers: boolean;
    onSizeChange: (size: number) => void;
    onRefresh: () => void;
}

export function AdminControls({size, loadingUsers, onSizeChange, onRefresh}: AdminControlsProps) {
    return (
        <SectionCard
            title="Admin Controls"
            tone="raised"
        >
            <AppBox sx={{display: "flex", flexDirection: {xs: "column", sm: "row"}, justifyContent: "space-between", gap: 1, alignItems: {xs: "stretch", sm: "center"}}}>
                <AppBox sx={{display: "flex", gap: 0.8, alignItems: "center", flexWrap: "wrap"}}>
                    <AppTypography variant="body2">Rows per page</AppTypography>
                    <AppFormControl size="small" sx={{minWidth: 100, flex: {xs: "1 1 140px", sm: "0 0 auto"}}}>
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

                <AppButton type="button" variant="outlined" onClick={onRefresh} disabled={loadingUsers} sx={{width: {xs: "100%", sm: "auto"}}}>
                    {loadingUsers ? "Refreshing..." : "Refresh"}
                </AppButton>
            </AppBox>
        </SectionCard>
    );
}
