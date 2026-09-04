"""
Linear Systems, Gaussian Elimination, Matrix Inversion & Determinants
Implemented from first principles in pure Python (no external dependencies).
"""

from typing import List, Tuple, Optional
import math


class LinearSystemSolver:
    """
    Solves linear systems A * x = b, computes determinants, matrix inverses,
    and row echelon forms via Gaussian elimination with partial pivoting.
    """

    @staticmethod
    def gaussian_elimination(A: List[List[float]], b: List[float]) -> List[float]:
        """
        Solves A * x = b using Gaussian elimination with partial pivoting.
        Time complexity: O(n^3).
        """
        n = len(A)
        # Construct augmented matrix [A | b]
        aug = [[float(A[i][j]) for j in range(n)] + [float(b[i])] for i in range(n)]

        # 1. Forward Elimination
        for col in range(n):
            # Partial pivoting: select row with largest absolute value in current column
            max_row = col
            max_val = abs(aug[col][col])
            for r in range(col + 1, n):
                if abs(aug[r][col]) > max_val:
                    max_val = abs(aug[r][col])
                    max_row = r

            if max_val < 1e-12:
                raise ValueError("Matrix is singular or near-singular; unique solution does not exist.")

            # Swap pivot row
            if max_row != col:
                aug[col], aug[max_row] = aug[max_row], aug[col]

            # Eliminate subsequent rows
            for r in range(col + 1, n):
                factor = aug[r][col] / aug[col][col]
                for c in range(col, n + 1):
                    aug[r][c] -= factor * aug[col][c]

        # 2. Back Substitution
        x = [0.0] * n
        for i in range(n - 1, -1, -1):
            sum_known = sum(aug[i][j] * x[j] for j in range(i + 1, n))
            x[i] = (aug[i][n] - sum_known) / aug[i][i]

        return x

    @staticmethod
    def compute_rref(matrix: List[List[float]]) -> Tuple[List[List[float]], int]:
        """
        Computes Reduced Row Echelon Form (RREF) and returns (RREF_matrix, rank).
        """
        rows = len(matrix)
        cols = len(matrix[0]) if rows > 0 else 0
        mat = [[float(matrix[r][c]) for c in range(cols)] for r in range(rows)]

        lead = 0
        rank = 0

        for r in range(rows):
            if lead >= cols:
                break
            i = r
            while abs(mat[i][lead]) < 1e-12:
                i += 1
                if i == rows:
                    i = r
                    lead += 1
                    if cols == lead:
                        break

            if lead >= cols:
                break

            # Swap rows
            mat[i], mat[r] = mat[r], mat[i]

            # Normalize pivot row
            pivot_val = mat[r][lead]
            if abs(pivot_val) > 1e-12:
                for c in range(cols):
                    mat[r][c] /= pivot_val
                rank += 1

            # Zero out all other entries in this column
            for j in range(rows):
                if j != r:
                    factor = mat[j][lead]
                    for c in range(cols):
                        mat[j][c] -= factor * mat[r][c]

            lead += 1

        return mat, rank

    @staticmethod
    def determinant(A: List[List[float]]) -> float:
        """
        Calculates det(A) using Gaussian elimination with row swap tracking.
        det(A) = (-1)^swaps * prod(pivots)
        """
        n = len(A)
        mat = [[float(A[i][j]) for j in range(n)] for i in range(n)]
        swaps = 0
        det = 1.0

        for col in range(n):
            max_row = col
            max_val = abs(mat[col][col])
            for r in range(col + 1, n):
                if abs(mat[r][col]) > max_val:
                    max_val = abs(mat[r][col])
                    max_row = r

            if max_val < 1e-12:
                return 0.0

            if max_row != col:
                mat[col], mat[max_row] = mat[max_row], mat[col]
                swaps += 1

            det *= mat[col][col]

            for r in range(col + 1, n):
                factor = mat[r][col] / mat[col][col]
                for c in range(col, n):
                    mat[r][c] -= factor * mat[col][c]

        if swaps % 2 == 1:
            det = -det
        return det

    @staticmethod
    def matrix_inverse(A: List[List[float]]) -> List[List[float]]:
        """
        Computes A^-1 via Gauss-Jordan elimination on augmented matrix [A | I].
        """
        n = len(A)
        # Augment with identity matrix
        aug = [[float(A[i][j]) for j in range(n)] + [1.0 if i == k else 0.0 for k in range(n)] for i in range(n)]

        for col in range(n):
            max_row = col
            max_val = abs(aug[col][col])
            for r in range(col + 1, n):
                if abs(aug[r][col]) > max_val:
                    max_val = abs(aug[r][col])
                    max_row = r

            if max_val < 1e-12:
                raise ValueError("Matrix is singular and cannot be inverted.")

            if max_row != col:
                aug[col], aug[max_row] = aug[max_row], aug[col]

            pivot = aug[col][col]
            for c in range(2 * n):
                aug[col][c] /= pivot

            for r in range(n):
                if r != col:
                    factor = aug[r][col]
                    for c in range(2 * n):
                        aug[r][c] -= factor * aug[col][c]

        # Extract inverse matrix from right half
        inv = [[aug[i][n + j] for j in range(n)] for i in range(n)]
        return inv


def test_linear_systems_and_determinants():
    print("--- 1. Solving A * x = b via Gaussian Elimination ---")
    # System:
    # 2x + y - z = 8
    # -3x - y + 2z = -11
    # -2x + y + 2z = -3
    # Exact solution: x = 2, y = 3, z = -1
    A = [
        [ 2.0,  1.0, -1.0],
        [-3.0, -1.0,  2.0],
        [-2.0,  1.0,  2.0]
    ]
    b = [8.0, -11.0, -3.0]

    x = LinearSystemSolver.gaussian_elimination(A, b)
    print(f"Computed solution x: {[round(val, 4) for val in x]}")
    assert math.isclose(x[0], 2.0, abs_tol=1e-5)
    assert math.isclose(x[1], 3.0, abs_tol=1e-5)
    assert math.isclose(x[2], -1.0, abs_tol=1e-5)
    print("Linear system solved accurately.")

    print("\n--- 2. Determinant Calculation ---")
    det_val = LinearSystemSolver.determinant(A)
    print(f"det(A) = {det_val:.4f}")
    # Analytical determinant:
    # 2(-1*2 - 2*1) - 1(-3*2 - 2*-2) + (-1)(-3*1 - -1*-2)
    # = 2(-4) - 1(-2) - 1(-5) = -8 + 2 + 5 = -1
    assert math.isclose(det_val, -1.0, abs_tol=1e-5)
    print("Determinant matches theoretical value.")

    print("\n--- 3. Matrix Inversion via Gauss-Jordan ---")
    A_inv = LinearSystemSolver.matrix_inverse(A)
    print("A^-1:")
    for row in A_inv:
        print("  [" + ", ".join(f"{v:+.4f}" for v in row) + "]")

    # Verify A * A^-1 == Identity
    n = len(A)
    identity_check = [[sum(A[i][k] * A_inv[k][j] for k in range(n)) for j in range(n)] for i in range(n)]
    for i in range(n):
        for j in range(n):
            expected = 1.0 if i == j else 0.0
            assert math.isclose(identity_check[i][j], expected, abs_tol=1e-5)
    print("A * A^-1 strictly equals identity matrix.")

    print("\n--- 4. Rank & Reduced Row Echelon Form (RREF) ---")
    # Singular matrix with linearly dependent row 3 (Row3 = Row1 + Row2)
    singular_A = [
        [1.0, 2.0, 3.0],
        [4.0, 5.0, 6.0],
        [5.0, 7.0, 9.0]
    ]
    rref, rank = LinearSystemSolver.compute_rref(singular_A)
    print(f"Rank of dependent matrix: {rank} (Expected: 2)")
    assert rank == 2
    det_sing = LinearSystemSolver.determinant(singular_A)
    print(f"det(singular_A) = {det_sing:.4f} (Expected: 0.0)")
    assert math.isclose(det_sing, 0.0, abs_tol=1e-5)
    print("RREF and rank-nullity consistency verified.")


if __name__ == "__main__":
    test_linear_systems_and_determinants()
