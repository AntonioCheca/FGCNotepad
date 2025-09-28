import useSolverGames from "@/hooks/useSolverGame";
import {ScenarioTableState, ScenarioTableActions} from '@/hooks/useScenarioTableState';

export class GameSolverService {
    constructor(
        private state: ScenarioTableState,
        private actions: ScenarioTableActions,
        private solveGame: ReturnType<typeof useSolverGames>['solveGame']
    ) {
    }

    async solveOptimalStrategy(): Promise<void> {
        const payoffMatrix = this._formatPayoffMatrix();

        try {
            const {equilibria, derivedMetrics} = await this.solveGame(payoffMatrix);

            const eq = equilibria?.[0];
            if (eq && eq.P1 && eq.P2) {
                const newRowFrequencies = this.state.rows.map(rowName =>
                    eq.P1[rowName] || 0
                );
                const newColumnFrequencies = this.state.columns.map(colName =>
                    eq.P2[colName] || 0
                );

                this.actions.setAndUpdateRowFrequencies(newRowFrequencies);
                this.actions.setAndUpdateColumnFrequencies(newColumnFrequencies);

                const expectedVal = this._calculateExpectedValue();
                this.actions.setAndUpdateExpectedValue(parseFloat(expectedVal));
            }

            // 🔥 NEW: store derivedMetrics in state if useful
            if (derivedMetrics) {
                console.log("Derived metrics:", derivedMetrics);
                // you could add an action like:
                this.actions.setDerivedMetrics(derivedMetrics);
            }
        } catch (error) {
            console.error("Error solving game:", error);
        }
    }

    private _formatPayoffMatrix(): Record<string, Record<string, number>> {
        const payoffMatrix: Record<string, Record<string, number>> = {};

        this.state.rows.forEach((row, rowIndex) => {
            payoffMatrix[row] = {};
            this.state.columns.forEach((col, colIndex) => {
                payoffMatrix[row][col] = this.state.values[rowIndex][colIndex];
            });
        });

        return payoffMatrix;
    }

    private _calculateExpectedValue(): string {
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
}
