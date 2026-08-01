import {AppChip} from "@/src/components/ui/AppChip";
import {formatBlockstringLabel} from "@/src/types/blockstring";

export function BlockstringStatusChip({classification}: {classification: string}) {
    const color = classification === "fake" || classification === "knowledge_check" ? "error" : classification === "true" ? "success" : "warning";

    return <AppChip size="small" color={color} label={formatBlockstringLabel(classification)} />;
}
