import sys
import json
import numpy as np
import nashpy as nash

# ---------- JSON encoder ----------
class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return super().default(obj)

# ---------- GameMatrix ----------
class GameMatrix:
    def __init__(self, matrix, row_labels, col_labels):
        self.matrix = np.array(matrix, dtype=float)
        self.row_labels = row_labels
        self.col_labels = col_labels

    def rescale(self):
        """Rescale payoffs into [0,1] range for stability."""
        min_val, max_val = self.matrix.min(), self.matrix.max()
        if max_val > min_val:
            self.matrix = (self.matrix - min_val) / (max_val - min_val)

    def perturb(self, epsilon=1e-6):
        """Add deterministic noise to avoid degeneracy."""
        rng = np.random.default_rng(seed=42)
        self.matrix += rng.normal(0, epsilon, self.matrix.shape)

    def prune(self):
        """Remove strictly dominated strategies (naive)."""
        keep_rows = []
        for i, row in enumerate(self.matrix):
            dominated = any(np.all(other >= row) and np.any(other > row)
                            for j, other in enumerate(self.matrix) if j != i)
            if not dominated:
                keep_rows.append(i)
        self.matrix = self.matrix[keep_rows, :]
        self.row_labels = [self.row_labels[i] for i in keep_rows]

        keep_cols = []
        for j, col in enumerate(self.matrix.T):
            dominated = any(np.all(other <= col) and np.any(other < col)
                            for k, other in enumerate(self.matrix.T) if k != j)
            if not dominated:
                keep_cols.append(j)
        self.matrix = self.matrix[:, keep_cols]
        self.col_labels = [self.col_labels[j] for j in keep_cols]

# ---------- Solver base ----------
class EquilibriumSolver:
    def solve(self, game_matrix: GameMatrix):
        raise NotImplementedError

# ---------- Nashpy exact ----------
class NashpySolver(EquilibriumSolver):
    def solve(self, game_matrix: GameMatrix):
        game = nash.Game(game_matrix.matrix)
        equilibria = list(game.lemke_howson_enumeration())
        return equilibria

# ---------- Multiplicative Weights approximate ----------
class MWUSolver(EquilibriumSolver):
    def __init__(self, iterations=2000, eta=0.1):
        self.iterations = iterations
        self.eta = eta

    def solve(self, game_matrix: GameMatrix):
        m, n = game_matrix.matrix.shape
        p1_dist = np.ones(m) / m
        p2_dist = np.ones(n) / n

        # Track running averages
        avg_p1 = np.zeros(m)
        avg_p2 = np.zeros(n)

        for t in range(1, self.iterations + 1):
            p1_payoffs = game_matrix.matrix @ p2_dist
            p2_payoffs = -game_matrix.matrix.T @ p1_dist  # zero-sum

            # Update multiplicative weights
            p1_dist *= np.exp(self.eta * p1_payoffs)
            p2_dist *= np.exp(self.eta * p2_payoffs)

            # Normalize
            p1_dist /= p1_dist.sum()
            p2_dist /= p2_dist.sum()

            # Update averages
            avg_p1 += p1_dist
            avg_p2 += p2_dist

        # Return average distribution, not the final step
        avg_p1 /= self.iterations
        avg_p2 /= self.iterations

        return [(avg_p1, avg_p2)]


# ---------- Validation ----------
class EquilibriumValidator:
    @staticmethod
    def remove_duplicates(equilibria, epsilon=0.001):
        unique = []
        for eq in equilibria:
            if not any(all(np.allclose(eq[i], other[i], atol=epsilon)
                           for i in range(2)) for other in unique):
                unique.append(eq)
        return unique

# ---------- Formatting ----------
class ResultFormatter:
    @staticmethod
    def format(equilibria, row_labels, col_labels):
        return [
            {
                "P1": {row_labels[i]: float(prob) for i, prob in enumerate(eq[0])},
                "P2": {col_labels[j]: float(prob) for j, prob in enumerate(eq[1])},
            }
            for eq in equilibria
        ]

# ---------- Main ----------
if __name__ == "__main__":
    try:
        matrixAsDict = json.loads(sys.argv[1])
        row_labels = list(matrixAsDict.keys())
        col_labels = list(next(iter(matrixAsDict.values())).keys())
        matrix = [[matrixAsDict[r][c] for c in col_labels] for r in row_labels]

        gm = GameMatrix(matrix, row_labels, col_labels)
        gm.rescale()
        gm.prune()
        gm.perturb()

        # Choose solver: exact or approximate
        solver = MWUSolver(iterations=2000, eta=0.05)
        equilibria = solver.solve(gm)

        equilibria = EquilibriumValidator.remove_duplicates(equilibria)
        formatted = ResultFormatter.format(equilibria, gm.row_labels, gm.col_labels)

        print(json.dumps({"equilibria": formatted}, cls=NumpyEncoder))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
