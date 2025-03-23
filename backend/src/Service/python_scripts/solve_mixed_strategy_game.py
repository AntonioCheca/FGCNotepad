import sys
import json
import numpy as np
import nashpy as nash

class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return super().default(obj)

def solve_game(matrix, row_labels, col_labels):
    game = nash.Game(np.array(matrix))
    raw_equilibria = list(game.lemke_howson_enumeration())

    # Remove near-duplicate equilibria
    unique_equilibria = remove_duplicate_equilibria(raw_equilibria, epsilon=0.001)

    # Format equilibria with move names
    formatted_equilibria = [
        {
            "P1": {row_labels[i]: prob for i, prob in enumerate(eq[0])},
            "P2": {col_labels[j]: prob for j, prob in enumerate(eq[1])}
        }
        for eq in unique_equilibria
    ]

    return {"equilibria": formatted_equilibria}

def is_near_duplicate(eq1, eq2, epsilon=0.001):
    return all(np.allclose(np.array(eq1[i]), np.array(eq2[i]), atol=epsilon) for i in range(len(eq1)))

def remove_duplicate_equilibria(equilibria, epsilon=0.001):
    unique_equilibria = []

    for eq in equilibria:
        if not any(is_near_duplicate(eq, unique_eq, epsilon) for unique_eq in unique_equilibria):
            unique_equilibria.append(eq)

    return unique_equilibria

if __name__ == "__main__":
    try:
        matrixAsDict = json.loads(sys.argv[1])

        # Extract row and column labels
        row_labels = list(matrixAsDict.keys())
        col_labels = list(next(iter(matrixAsDict.values())).keys())

        # Convert matrix to a NumPy-friendly format
        matrix = [[matrixAsDict[row][column] for column in col_labels] for row in row_labels]

        # Solve the game
        result = solve_game(matrix, row_labels, col_labels)

        # Print JSON output
        print(json.dumps(result, cls=NumpyEncoder))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
