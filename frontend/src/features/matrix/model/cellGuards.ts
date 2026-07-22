import {MatrixBodyCell} from "./stateTypes";

export function isEditableBodyCell(cell: MatrixBodyCell | undefined): boolean {
    return Boolean(cell && cell.kind === "static");
}
