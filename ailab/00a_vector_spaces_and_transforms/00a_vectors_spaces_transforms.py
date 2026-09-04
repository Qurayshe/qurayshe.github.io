"""
Linear Algebra Fundamentals: Vector Spaces, Linear Independence, and Transformations
Implemented from first principles in pure Python (no external dependencies).
"""

import math
from typing import List, Tuple, Optional


class Vector:
    """A mathematical vector in R^n with fundamental algebraic operations."""
    def __init__(self, elements: List[float]):
        self.data = [float(x) for x in elements]
        self.dim = len(elements)

    def __len__(self) -> int:
        return self.dim

    def __getitem__(self, idx: int) -> float:
        return self.data[idx]

    def __repr__(self) -> str:
        formatted = ", ".join(f"{x:+.4f}" for x in self.data)
        return f"Vector([{formatted}])"

    def __add__(self, other: 'Vector') -> 'Vector':
        if self.dim != other.dim:
            raise ValueError(f"Dimension mismatch: {self.dim} != {other.dim}")
        return Vector([a + b for a, b in zip(self.data, other.data)])

    def __sub__(self, other: 'Vector') -> 'Vector':
        if self.dim != other.dim:
            raise ValueError(f"Dimension mismatch: {self.dim} != {other.dim}")
        return Vector([a - b for a, b in zip(self.data, other.data)])

    def __mul__(self, scalar: float) -> 'Vector':
        return Vector([x * scalar for x in self.data])

    __rmul__ = __mul__

    def dot(self, other: 'Vector') -> float:
        """Inner product <u, v> = sum(u_i * v_i)."""
        if self.dim != other.dim:
            raise ValueError(f"Dimension mismatch: {self.dim} != {other.dim}")
        return sum(a * b for a, b in zip(self.data, other.data))

    def norm(self, p: int = 2) -> float:
        """L_p norm ||v||_p."""
        if p == 2:
            return math.sqrt(sum(x * x for x in self.data))
        elif p == 1:
            return sum(abs(x) for x in self.data)
        elif p == float('inf'):
            return max(abs(x) for x in self.data)
        return sum(abs(x) ** p for x in self.data) ** (1.0 / p)

    def normalize(self) -> 'Vector':
        """Returns unit vector v / ||v||_2."""
        n = self.norm(2)
        if n < 1e-12:
            raise ZeroDivisionError("Cannot normalize zero vector.")
        return self * (1.0 / n)

    def project_onto(self, target: 'Vector') -> 'Vector':
        """Orthogonal projection of self onto target: (u . v / ||v||^2) * v."""
        denom = target.dot(target)
        if denom < 1e-12:
            raise ZeroDivisionError("Cannot project onto zero vector.")
        scalar = self.dot(target) / denom
        return target * scalar


class Matrix:
    """A 2D matrix representing linear transformations."""
    def __init__(self, rows: List[List[float]]):
        self.rows = [[float(x) for x in r] for r in rows]
        self.m = len(rows)
        self.n = len(rows[0]) if self.m > 0 else 0
        for r in self.rows:
            if len(r) != self.n:
                raise ValueError("All rows must have identical column length.")

    def __repr__(self) -> str:
        lines = []
        for r in self.rows:
            lines.append("  [" + ", ".join(f"{x:+.4f}" for x in r) + "]")
        return "Matrix([\n" + ",\n".join(lines) + "\n])"

    def shape(self) -> Tuple[int, int]:
        return (self.m, self.n)

    def matmul_vec(self, v: Vector) -> Vector:
        """Matrix-vector product T(v) = A * v."""
        if self.n != v.dim:
            raise ValueError(f"Incompatible dimensions for A*v: ({self.m}x{self.n}) and {v.dim}")
        result = [sum(self.rows[i][j] * v[j] for j in range(self.n)) for i in range(self.m)]
        return Vector(result)

    def matmul(self, other: 'Matrix') -> 'Matrix':
        """Matrix-matrix product C = A * B."""
        if self.n != other.m:
            raise ValueError(f"Dimension mismatch for A*B: {self.shape()} and {other.shape()}")
        out = [[0.0] * other.n for _ in range(self.m)]
        for i in range(self.m):
            for k in range(self.n):
                for j in range(other.n):
                    out[i][j] += self.rows[i][k] * other.rows[k][j]
        return Matrix(out)

    def transpose(self) -> 'Matrix':
        """Returns transpose A^T."""
        out = [[self.rows[i][j] for i in range(self.m)] for j in range(self.n)]
        return Matrix(out)

    @staticmethod
    def identity(dim: int) -> 'Matrix':
        out = [[1.0 if i == j else 0.0 for j in range(dim)] for i in range(dim)]
        return Matrix(out)

    @staticmethod
    def rotation_2d(radians: float) -> 'Matrix':
        """2D rotation matrix R(theta)."""
        c = math.cos(radians)
        s = math.sin(radians)
        return Matrix([
            [c, -s],
            [s,  c]
        ])

    @staticmethod
    def scaling_2d(sx: float, sy: float) -> 'Matrix':
        """2D scaling matrix S(sx, sy)."""
        return Matrix([
            [sx, 0.0],
            [0.0, sy]
        ])

    @staticmethod
    def shear_2d(kx: float, ky: float) -> 'Matrix':
        """2D shear matrix."""
        return Matrix([
            [1.0, kx],
            [ky, 1.0]
        ])


def gram_schmidt(basis: List[Vector]) -> List[Vector]:
    """
    Gram-Schmidt Orthogonalization Process.
    Converts a set of linearly independent vectors into an orthonormal basis.
    """
    ortho: List[Vector] = []
    for v in basis:
        w = Vector(v.data[:])
        for u in ortho:
            w = w - v.project_onto(u)
        if w.norm() > 1e-9:
            ortho.append(w.normalize())
    return ortho


def check_linear_independence(vectors: List[Vector]) -> bool:
    """
    Checks if a set of vectors is linearly independent via Gram-Schmidt rank.
    """
    ortho = gram_schmidt(vectors)
    return len(ortho) == len(vectors)


def test_linear_algebra_fundamentals():
    print("--- 1. Vector Operations & Norms ---")
    u = Vector([3.0, 4.0])
    v = Vector([1.0, 2.0])
    print(f"u: {u}, norm(u): {u.norm():.4f}")
    assert math.isclose(u.norm(2), 5.0, abs_tol=1e-6)

    dot_prod = u.dot(v)
    print(f"u . v = {dot_prod:.4f}")
    assert math.isclose(dot_prod, 11.0, abs_tol=1e-6)

    proj = u.project_onto(v)
    print(f"proj_v(u) = {proj}")
    residual = u - proj
    assert math.isclose(residual.dot(v), 0.0, abs_tol=1e-6)
    print("Orthogonal projection verified.")

    print("\n--- 2. Linear Transformations in 2D ---")
    R = Matrix.rotation_2d(math.pi / 2)
    x = Vector([1.0, 0.0])
    rx = R.matmul_vec(x)
    print(f"Rotate [1, 0] by 90 deg -> {rx}")
    assert math.isclose(rx[0], 0.0, abs_tol=1e-6)
    assert math.isclose(rx[1], 1.0, abs_tol=1e-6)

    S = Matrix.scaling_2d(2.0, 3.0)
    T = R.matmul(S)
    tx = T.matmul_vec(Vector([1.0, 1.0]))
    print(f"Composed Scale(2,3) then Rotate(90 deg) on [1, 1] -> {tx}")
    assert math.isclose(tx[0], -3.0, abs_tol=1e-6)
    assert math.isclose(tx[1], 2.0, abs_tol=1e-6)

    print("\n--- 3. Gram-Schmidt Orthonormalization ---")
    raw_basis = [
        Vector([1.0, 1.0, 0.0]),
        Vector([1.0, 0.0, 2.0]),
        Vector([0.0, 1.0, 1.0])
    ]
    is_indep = check_linear_independence(raw_basis)
    print(f"Raw vectors linearly independent: {is_indep}")
    assert is_indep

    orthonormal = gram_schmidt(raw_basis)
    print("Orthonormal Basis:")
    for i, e in enumerate(orthonormal):
        print(f"  e_{i+1}: {e} (norm: {e.norm():.4f})")
        assert math.isclose(e.norm(), 1.0, abs_tol=1e-6)

    for i in range(len(orthonormal)):
        for j in range(i + 1, len(orthonormal)):
            dot = orthonormal[i].dot(orthonormal[j])
            assert math.isclose(dot, 0.0, abs_tol=1e-6)
    print("Mutual orthogonality confirmed.")


if __name__ == '__main__':
    test_linear_algebra_fundamentals()
