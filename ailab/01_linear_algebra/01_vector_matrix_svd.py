"""
Module 01: Linear Algebra & Tensor Operations from Scratch
===========================================================
Concepts:
1. Vectors, dot products, norms, and cosine similarity.
2. Matrix transformations and four views of multiplication.
3. Power iteration algorithm for finding dominant eigenvalues.
4. Truncated SVD for optimal low-rank matrix approximation (Eckart-Young Theorem).
"""

import math
import numpy as np


# =====================================================================
# 1. Pure Python Vector Operations
# =====================================================================

def vector_dot(u, v):
    """Compute inner product <u, v> = sum(u_i * v_i)"""
    assert len(u) == len(v), "Vectors must have matching dimensions"
    return sum(a * b for a, b in zip(u, v))


def vector_norm(u, p=2):
    """Compute Lp norm: (sum |u_i|^p)^(1/p)"""
    if p == float('inf'):
        return max(abs(x) for x in u)
    return (sum(abs(x) ** p for x in u)) ** (1.0 / p)


def cosine_similarity(u, v):
    """Compute cos(theta) = <u, v> / (||u||_2 * ||v||_2)"""
    dot = vector_dot(u, v)
    norm_u = vector_norm(u, 2)
    norm_v = vector_norm(v, 2)
    if norm_u == 0.0 or norm_v == 0.0:
        return 0.0
    return dot / (norm_u * norm_v)


# =====================================================================
# 2. Matrix Multiplication (4 Perspectives)
# =====================================================================

def matrix_multiply(A, B):
    """Compute C = A @ B with explicit nested loops (Entry-wise)"""
    m, k = len(A), len(A[0])
    k2, n = len(B), len(B[0])
    assert k == k2, f"Dimension mismatch: ({m}x{k}) cannot multiply ({k2}x{n})"

    C = [[0.0 for _ in range(n)] for _ in range(m)]
    for i in range(m):
        for j in range(n):
            for r in range(k):
                C[i][j] += A[i][r] * B[r][j]
    return C


# =====================================================================
# 3. Power Iteration (Dominant Eigenvector & Eigenvalue)
# =====================================================================

def power_iteration(A, num_iterations=100, tolerance=1e-7):
    """
    Computes the dominant eigenvalue and eigenvector of matrix A
    via iterative projection: v_{k+1} = A v_k / ||A v_k||.
    """
    n = len(A)
    # Start with a non-zero random vector
    np.random.seed(42)
    v = np.random.rand(n)
    v = v / np.linalg.norm(v)

    lambda_old = 0.0
    for _ in range(num_iterations):
        # Multiply: w = A @ v
        w = np.dot(A, v)
        # Normalize
        v = w / np.linalg.norm(w)
        # Rayleigh quotient: lambda = (v^T A v) / (v^T v)
        lambda_new = np.dot(v, np.dot(A, v))

        if abs(lambda_new - lambda_old) < tolerance:
            break
        lambda_old = lambda_new

    return lambda_new, v


# =====================================================================
# 4. Truncated SVD (Low-Rank Matrix Approximation)
# =====================================================================

def truncated_svd_approximation(A, k):
    """
    Computes the optimal rank-k approximation:
    A_k = sum_{i=1}^k sigma_i * u_i * v_i^T
    """
    U, S, Vt = np.linalg.svd(A, full_matrices=False)
    # Truncate to top-k components
    U_k = U[:, :k]
    S_k = np.diag(S[:k])
    Vt_k = Vt[:k, :]

    A_k = U_k @ S_k @ Vt_k
    reconstruction_error = np.linalg.norm(A - A_k, 'fro') / np.linalg.norm(A, 'fro')
    return A_k, reconstruction_error, S


# =====================================================================
# Execution & Verification
# =====================================================================

if __name__ == '__main__':
    print("=== 1. Vector Geometry & Cosine Similarity ===")
    token_embed_1 = [0.85, 0.45, 0.12, -0.25]   # e.g., "king"
    token_embed_2 = [0.80, 0.40, 0.18, -0.22]   # e.g., "queen"
    token_embed_3 = [-0.60, 0.10, 0.75, 0.80]   # e.g., "apple"

    print("Cosine Similarity ('king', 'queen'):", f"{cosine_similarity(token_embed_1, token_embed_2):.4f}")
    print("Cosine Similarity ('king', 'apple'):", f"{cosine_similarity(token_embed_1, token_embed_3):.4f}")

    print("\n=== 2. Power Iteration for Eigenvalues ===")
    sym_matrix = np.array([
        [4.0, 1.0, 2.0],
        [1.0, 2.0, 0.0],
        [2.0, 0.0, 3.0]
    ])
    eigenval, eigenvec = power_iteration(sym_matrix)
    numpy_vals, _ = np.linalg.eigh(sym_matrix)
    print(f"Dominant Eigenvalue (Power Iteration): {eigenval:.5f}")
    print(f"Exact Dominant Eigenvalue (NumPy):     {max(numpy_vals):.5f}")

    print("\n=== 3. SVD Low-Rank Compression (Eckart-Young Theorem) ===")
    # Construct synthetic 100x50 feature matrix
    np.random.seed(1337)
    X = np.random.randn(100, 10) @ np.random.randn(10, 50) + 0.1 * np.random.randn(100, 50)
    for rank in [1, 3, 5, 10]:
        _, rel_err, singular_vals = truncated_svd_approximation(X, rank)
        print(f"Rank-{rank:02d} Approx Relative Frobenius Error: {rel_err * 100:.2f}%")

