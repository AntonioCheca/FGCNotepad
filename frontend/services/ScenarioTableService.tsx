
import { ScenarioTableState, ScenarioTableActions } from '@/hooks/useScenarioTableState';

export class ScenarioTableService {
    constructor(
        private state: ScenarioTableState,
        private actions: ScenarioTableActions
    ) {}

    calculateExpectedValue(): string {
        let ev = 0;
        for (let i = 0; i < this.state.rows.length; i++) {
            for (let j = 0; j < this.state.columns.length; j++) {
                if (typeof this.state.rowFrequencies[i] !== 'number' ||
                    typeof this.state.columnFrequencies[j] !== 'number') {
                    continue;
                }
                ev += this.state.values[i][j] *
                    (this.state.rowFrequencies[i] as number) *
                    (this.state.columnFrequencies[j] as number);
            }
        }
        return ev.toFixed(2);
    }

    addRow(): void {
        const newRow = `Row ${this.state.rows.length + 1}`;
        this.actions.setAndUpdateRows([...this.state.rows, newRow]);
        this.actions.setAndUpdateValues([...this.state.values, Array(this.state.columns.length).fill(0)]);
        const newFrequencies = Array(this.state.rows.length + 1).fill(1 / (this.state.rows.length + 1));
        this.actions.setAndUpdateRowFrequencies(newFrequencies);
    }

    addColumn(): void {
        const newColumn = `Move ${this.state.columns.length + 1}`;
        this.actions.setAndUpdateColumns([...this.state.columns, newColumn]);
        this.actions.setAndUpdateValues(this.state.values.map(row => [...row, 0]));
        const newFrequencies = Array(this.state.columns.length + 1).fill(1 / (this.state.columns.length + 1));
        this.actions.setAndUpdateColumnFrequencies(newFrequencies);
    }

    removeRow(rowIndex: number): void {
        if (this.state.rows.length > 1) {
            const newRows = [...this.state.rows];
            newRows.splice(rowIndex, 1);
            this.actions.setAndUpdateRows(newRows);

            const newValues = [...this.state.values];
            newValues.splice(rowIndex, 1);
            this.actions.setAndUpdateValues(newValues);

            const newFrequencies = Array(newRows.length).fill(1 / newRows.length);
            this.actions.setAndUpdateRowFrequencies(newFrequencies);
        }
    }

    removeColumn(colIndex: number): void {
        if (this.state.columns.length > 1) {
            const newColumns = [...this.state.columns];
            newColumns.splice(colIndex, 1);
            this.actions.setAndUpdateColumns(newColumns);

            const newValues = this.state.values.map(row => {
                const newRow = [...row];
                newRow.splice(colIndex, 1);
                return newRow;
            });
            this.actions.setAndUpdateValues(newValues);

            const newFrequencies = Array(newColumns.length).fill(1 / newColumns.length);
            this.actions.setAndUpdateColumnFrequencies(newFrequencies);
        }
    }

    moveRowUp(rowIndex: number): void {
        if (rowIndex > 0) {
            this._moveRow(rowIndex, rowIndex - 1);
        }
    }

    moveRowDown(rowIndex: number): void {
        if (rowIndex < this.state.rows.length - 1) {
            this._moveRow(rowIndex, rowIndex + 1);
        }
    }

    moveColumnLeft(colIndex: number): void {
        if (colIndex > 0) {
            this._moveColumn(colIndex, colIndex - 1);
        }
    }

    moveColumnRight(colIndex: number): void {
        if (colIndex < this.state.columns.length - 1) {
            this._moveColumn(colIndex, colIndex + 1);
        }
    }

    updateValue(rowIndex: number, colIndex: number, newValue: string): void {
        if (newValue === "" || newValue === "-") {
            const newValues = [...this.state.values];
            newValues[rowIndex][colIndex] = newValue as any;
            this.actions.setAndUpdateValues(newValues);
            return;
        }

        const parsedValue = parseInt(newValue, 10);
        if (!Number.isNaN(parsedValue)) {
            const newValues = [...this.state.values];
            newValues[rowIndex][colIndex] = parsedValue;
            this.actions.setAndUpdateValues(newValues);
        }
    }

    updateRowFrequency(rowIndex: number, newValue: string): void {
        if (newValue === "" || newValue === "0." ||
            (parseFloat(newValue) >= 0 && parseFloat(newValue) <= 1)) {
            const newFrequencies = [...this.state.rowFrequencies];
            newFrequencies[rowIndex] = (newValue === "" || newValue === "0.") ? newValue : parseFloat(newValue);
            this.actions.setAndUpdateRowFrequencies(newFrequencies);
        }
    }

    updateColumnFrequency(colIndex: number, newValue: string): void {
        if (newValue === "" || newValue === "0." ||
            (parseFloat(newValue) >= 0 && parseFloat(newValue) <= 1)) {
            const newFrequencies = [...this.state.columnFrequencies];
            newFrequencies[colIndex] = (newValue === "" || newValue === "0.") ? newValue : parseFloat(newValue);
            this.actions.setAndUpdateColumnFrequencies(newFrequencies);
        }
    }

    private _moveRow(fromIndex: number, toIndex: number): void {
        const newRows = [...this.state.rows];
        const [movedRow] = newRows.splice(fromIndex, 1);
        newRows.splice(toIndex, 0, movedRow);
        this.actions.setAndUpdateRows(newRows);

        const newValues = [...this.state.values];
        const [movedValues] = newValues.splice(fromIndex, 1);
        newValues.splice(toIndex, 0, movedValues);
        this.actions.setAndUpdateValues(newValues);

        const newRowFrequencies = [...this.state.rowFrequencies];
        const [movedFreq] = newRowFrequencies.splice(fromIndex, 1);
        newRowFrequencies.splice(toIndex, 0, movedFreq);
        this.actions.setAndUpdateRowFrequencies(newRowFrequencies);
    }

    private _moveColumn(fromIndex: number, toIndex: number): void {
        const newColumns = [...this.state.columns];
        const [movedColumn] = newColumns.splice(fromIndex, 1);
        newColumns.splice(toIndex, 0, movedColumn);
        this.actions.setAndUpdateColumns(newColumns);

        const newValues = this.state.values.map((row) => {
            const newRow = [...row];
            const [movedValue] = newRow.splice(fromIndex, 1);
            newRow.splice(toIndex, 0, movedValue);
            return newRow;
        });
        this.actions.setAndUpdateValues(newValues);

        const newColumnFrequencies = [...this.state.columnFrequencies];
        const [movedFreq] = newColumnFrequencies.splice(fromIndex, 1);
        newColumnFrequencies.splice(toIndex, 0, movedFreq);
        this.actions.setAndUpdateColumnFrequencies(newColumnFrequencies);
    }
}
