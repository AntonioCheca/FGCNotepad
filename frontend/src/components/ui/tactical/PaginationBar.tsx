import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";

interface PaginationBarProps {
    page: number;
    pageSize: number;
    total: number;
    disabled?: boolean;
    onPageChange: (page: number) => void;
}

export function PaginationBar({page, pageSize, total, disabled = false, onPageChange}: PaginationBarProps) {
    if (total <= pageSize) {
        return null;
    }

    const lastPage = Math.ceil(total / pageSize);
    const first = (page - 1) * pageSize + 1;
    const last = Math.min(page * pageSize, total);

    return (
        <AppBox component="nav" aria-label="Pagination" sx={{display: "flex", alignItems: "center", justifyContent: {xs: "space-between", sm: "flex-end"}, gap: 1, pt: 1}}>
            <AppButton type="button" variant="text" color="secondary" disabled={disabled || page <= 1} onClick={() => onPageChange(page - 1)} sx={{minHeight: 44}}>
                Previous
            </AppButton>
            <AppBox component="span" aria-live="polite" sx={{typography: "body2", color: "text.secondary", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap"}}>
                {first}–{last} of {total}
            </AppBox>
            <AppButton type="button" variant="text" color="secondary" disabled={disabled || page >= lastPage} onClick={() => onPageChange(page + 1)} sx={{minHeight: 44}}>
                Next
            </AppButton>
        </AppBox>
    );
}
