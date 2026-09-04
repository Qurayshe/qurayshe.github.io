# Module 00b: Linear Systems, Inverses & Determinants

Solving systems of linear equations is the central computational problem of scientific computing. In machine learning, every training step of linear regression, every Newton-Raphson curvature correction, every Kalman filter update, and every attention matrix inversion in graph neural networks relies on the principles of Gaussian elimination and matrix rank.

---

## 1. The Geometry of $A\mathbf{x} = \mathbf{b}$

A system of $m$ linear equations in $n$ unknowns is written compactly in matrix form:

$$\begin{bmatrix} a_{11} & a_{12} & \cdots & a_{1n} \\ a_{21} & a_{22} & \cdots & a_{2n} \\ \vdots & \vdots & \ddots & \vdots \\ a_{m1} & a_{m2} & \cdots & a_{mn} \end{bmatrix} \begin{bmatrix} x_1 \\ x_2 \\ \vdots \\ x_n \end{bmatrix} = \begin{bmatrix} b_1 \\ b_2 \\ \vdots \\ b_m \end{bmatrix} \iff A \mathbf{x} = \mathbf{b}$$

There are two dual geometric perspectives on this equation:

### The Row Picture
Each row of the matrix represents a flat geometric hyperplane in $\mathbb{R}^n$:

$$a_{i1} x_1 + a_{i2} x_2 + \dots + a_{in} x_n = b_i$$

The solution $\mathbf{x}$ is the single geometric intersection point where all $m$ hyperplanes meet simultaneously.

### The Column Picture
The column picture rewrites the system as a linear combination of the column vectors:

$$x_1 \begin{bmatrix} a_{11} \\ a_{21} \\ \vdots \\ a_{m1} \end{bmatrix} + x_2 \begin{bmatrix} a_{12} \\ a_{22} \\ \vdots \\ a_{m2} \end{bmatrix} + \dots + x_n \begin{bmatrix} a_{1n} \\ a_{2n} \\ \vdots \\ a_{mn} \end{bmatrix} = \mathbf{b}$$

The fundamental question becomes: *Can vector $\mathbf{b}$ be reached by scaling and adding the column vectors of $A$?* A solution exists if and only if $\mathbf{b}$ lies within the **Column Space** (the span of the columns) of $A$.

---

## 2. Gaussian Elimination & Partial Pivoting

Gaussian elimination transforms the system into an upper triangular matrix $U$ using elementary row operations:
1. Swapping two rows ($R_i \leftrightarrow R_j$).
2. Multiplying a row by a non-zero scalar ($R_i \leftarrow c R_i$).
3. Adding a multiple of one row to another ($R_i \leftarrow R_i + c R_j$).

### Forward Elimination
For each column $k \in \{1, \dots, n-1\}$, eliminate the entries below the diagonal $a_{kk}$:

$$\text{factor} = \frac{a_{ik}}{a_{kk}}, \quad R_i \leftarrow R_i - \text{factor} \cdot R_k \quad (\forall i > k)$$

### Why Partial Pivoting is Mandatory
If the diagonal pivot $a_{kk} \approx 0$, dividing by it causes floating-point overflow and catastrophic loss of precision. **Partial pivoting** scans all rows below and on the diagonal:

$$\text{pivot\_row} = \arg\max_{i \ge k} |a_{ik}|$$

If $\text{pivot\_row} \neq k$, rows are swapped. This guarantees numerical stability across all IEEE 754 floating-point operations.

### Back Substitution
Once in upper triangular form $U\mathbf{x} = \mathbf{c}$, we solve from bottom to top in $O(n^2)$ operations:

$$x_n = \frac{c_n}{u_{nn}}, \quad x_i = \frac{c_i - \sum_{j=i+1}^n u_{ij} x_j}{u_{ii}}$$

---

## 3. Four Fundamental Subspaces & The Rank-Nullity Theorem

For any matrix $A \in \mathbb{R}^{m \times n}$, Gilbert Strang identified the **Four Fundamental Subspaces**:

1. **Column Space** $\mathcal{C}(A) = \{ A\mathbf{x} \mid \mathbf{x} \in \mathbb{R}^n \} \subseteq \mathbb{R}^m$ (Dimension: $\text{rank}(A) = r$)
2. **Null Space** $\mathcal{N}(A) = \{ \mathbf{x} \in \mathbb{R}^n \mid A\mathbf{x} = \mathbf{0} \} \subseteq \mathbb{R}^n$ (Dimension: $n - r$)
3. **Row Space** $\mathcal{C}(A^T) = \{ A^T \mathbf{y} \mid \mathbf{y} \in \mathbb{R}^m \} \subseteq \mathbb{R}^n$ (Dimension: $r$)
4. **Left Null Space** $\mathcal{N}(A^T) = \{ \mathbf{y} \in \mathbb{R}^m \mid A^T \mathbf{y} = \mathbf{0} \} \subseteq \mathbb{R}^m$ (Dimension: $m - r$)

### The Rank-Nullity Theorem
For any $m \times n$ matrix $A$:

$$\text{rank}(A) + \text{nullity}(A) = n$$

- If $\text{nullity}(A) = 0$, the only vector mapped to zero is $\mathbf{0}$. The matrix transformation is injective (one-to-one), and $A\mathbf{x} = \mathbf{b}$ has at most one unique solution.
- If $\text{nullity}(A) > 0$, the transformation collapses non-zero dimensions into zero, creating an infinite family of solutions $\mathbf{x}_p + \mathbf{x}_n$ where $\mathbf{x}_n \in \mathcal{N}(A)$.

---

## 4. Determinants: The Geometric Scaling Factor

The determinant $\det(A)$ is a scalar that measures how much a linear transformation scales $n$-dimensional volumes.

### Geometric Intuition
- In 2D: $\det(A)$ is the signed area of the parallelogram formed by the transformed unit vectors $A\mathbf{e}_1$ and $A\mathbf{e}_2$.
- In 3D: $\det(A)$ is the signed volume of the parallelepiped formed by the columns of $A$.
- **Sign**: A negative determinant means the transformation inverted spatial orientation (like a mirror reflection).
- **Singularity**: $\det(A) = 0$ means the transformation squashed the entire space into a lower dimension (e.g. flattening a 3D sphere into a 2D pancake or a 1D line). Once flattened, the operation cannot be reversed!

### Key Algebraic Properties
1. $\det(I) = 1$
2. $\det(AB) = \det(A) \det(B)$
3. $\det(A^T) = \det(A)$
4. $\det(A^{-1}) = \frac{1}{\det(A)}$
5. Swapping two rows flips the sign: $\det(A') = -\det(A)$
6. Multiplying a row by $c$ scales the determinant: $\det(A') = c \det(A)$

Using Gaussian elimination with $s$ row swaps and upper triangular pivots $u_{ii}$:

$$\det(A) = (-1)^s \prod_{i=1}^n u_{ii}$$

---

## 5. Matrix Inverses & Gauss-Jordan Elimination

A square matrix $A \in \mathbb{R}^{n \times n}$ is invertible (non-singular) if and only if:
- $\det(A) \neq 0$
- $\text{rank}(A) = n$ (Full rank)
- The null space $\mathcal{N}(A) = \{\mathbf{0}\}$

The inverse matrix $A^{-1}$ satisfies:

$$A A^{-1} = A^{-1} A = I_n$$

### Gauss-Jordan Inversion Algorithm
To compute $A^{-1}$, construct the $n \times 2n$ augmented block matrix $[A \mid I_n]$. Apply row operations until the left block becomes the identity matrix $I_n$:

$$[A \mid I_n] \xrightarrow{\text{Gauss-Jordan}} [I_n \mid A^{-1}]$$

If a zero pivot is encountered that cannot be avoided by swapping rows, the matrix is singular and its inverse does not exist.
