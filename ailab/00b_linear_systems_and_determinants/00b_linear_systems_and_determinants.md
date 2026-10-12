# Module 00b: Linear Systems, Inverses & Determinants

Solving systems of linear equations is the central computational problem of scientific computing. In machine learning, every training step of linear regression, every Newton-Raphson curvature correction, every Kalman filter update, and every normalizing flow architecture relies on the principles of Gaussian elimination, matrix rank, and determinants.

Let us explore these concepts with deep geometric intuition, step-by-step arithmetic, and concrete 2D and 3D examples.

---

## 1. The Geometry of $A\mathbf{x} = \mathbf{b}$ (Row vs Column Picture)

A system of $m$ linear equations in $n$ unknowns is written compactly as:

$$A \mathbf{x} = \mathbf{b} \iff \begin{bmatrix} a_{11} & a_{12} & \cdots & a_{1n} \\ a_{21} & a_{22} & \cdots & a_{2n} \\ \vdots & \vdots & \ddots & \vdots \\ a_{m1} & a_{m2} & \cdots & a_{mn} \end{bmatrix} \begin{bmatrix} x_1 \\ x_2 \\ \vdots \\ x_n \end{bmatrix} = \begin{bmatrix} b_1 \\ b_2 \\ \vdots \\ b_m \end{bmatrix}$$

Gilbert Strang emphasized that there are two fundamental geometric ways to view this equation. Let us explore both using a concrete 2D system:

$$\begin{aligned}
2x_1 + x_2 &= 5 \\
x_1 + 3x_2 &= 10
\end{aligned} \iff \begin{bmatrix} 2 & 1 \\ 1 & 3 \end{bmatrix} \begin{bmatrix} x_1 \\ x_2 \end{bmatrix} = \begin{bmatrix} 5 \\ 10 \end{bmatrix}$$

### Perspective A: The Row Picture (Intersecting Hyperplanes)
In the row picture, each equation represents a geometric hyperplane (a straight line in 2D, a flat plane in 3D).

```
         x2
          ^        Line 2: x1 + 3x2 = 10
          |       \
       4 -+        \  Intersection Point (1, 3)
       3 -+---------(*)\
       2 -+           \ \
       1 -+            \  \   Line 1: 2x1 + x2 = 5
          |             \   \
          +---+---+---+---+---+---> x1
              1   2   3   4   5
```

- **Line 1:** $2x_1 + x_2 = 5 \implies x_2 = 5 - 2x_1$
- **Line 2:** $x_1 + 3x_2 = 10 \implies x_2 = \frac{10 - x_1}{3}$
- The solution $\mathbf{x} = \begin{bmatrix} x_1 \\ x_2 \end{bmatrix}$ is the single point where both lines intersect: $(x_1 = 1, x_2 = 3)$.

### Perspective B: The Column Picture (Linear Combination of Vectors)
In the column picture, the matrix multiplication is viewed as a linear combination of the column vectors of $A$:

$$x_1 \begin{bmatrix} 2 \\ 1 \end{bmatrix} + x_2 \begin{bmatrix} 1 \\ 3 \end{bmatrix} = \begin{bmatrix} 5 \\ 10 \end{bmatrix}$$

```
         y
         ^                                  Target b = [5, 10]^T
      10 +---------------------------------(*)
       9 |                                /
       8 |                               /
       7 |                              /  3 * [1, 3] = [3, 9]
       6 |                             /
       5 |                            /
       4 |                           /
       3 |            [1, 3]        /
       2 |             *           /
       1 |      [2, 1]*           /  1 * [2, 1]
         +------------*----------+-----------------> x
         0            2          5
```

- We start at the origin $(0, 0)$.
- Take **$1$ step** along column vector $\mathbf{a}_1 = \begin{bmatrix} 2 \\ 1 \end{bmatrix} \to (2, 1)$.
- Take **$3$ steps** along column vector $\mathbf{a}_2 = \begin{bmatrix} 1 \\ 3 \end{bmatrix} \to (2 + 3, 1 + 9) = (5, 10)$.
- We land exactly on the target vector $\mathbf{b} = \begin{bmatrix} 5 \\ 10 \end{bmatrix}$!

> [!IMPORTANT]
> The fundamental question of linear algebra is the **Column Picture**:
> *Does target vector $\mathbf{b}$ lie within the Column Space (span of the columns) of matrix $A$?*
> If yes, a solution exists. If no, no solution exists (motivating least squares approximation).

---

## 2. Gaussian Elimination & Partial Pivoting (Step-by-Step)

Gaussian elimination transforms the system $A\mathbf{x} = \mathbf{b}$ into an equivalent upper triangular system $U\mathbf{x} = \mathbf{c}$ using three elementary row operations:
1. **Row Swap ($R_i \leftrightarrow R_j$):** Swap two rows.
2. **Scalar Scaling ($R_i \leftarrow \alpha R_i$):** Multiply a row by a non-zero scalar $\alpha$.
3. **Row Addition ($R_i \leftarrow R_i - \text{factor} \cdot R_k$):** Eliminate entries below diagonal.

### Full Numerical 3x3 Walkthrough
Consider the system:
$$\begin{aligned}
2x_1 + x_2 - x_3 &= 8 \\
-3x_1 - x_2 + 2x_3 &= -11 \\
-2x_1 + x_2 + 2x_3 &= -3
\end{aligned}$$

#### Step 1: Set up Augmented Matrix $[A \mid \mathbf{b}]$
$$\left[\begin{array}{ccc|c}
2 & 1 & -1 & 8 \\
-3 & -1 & 2 & -11 \\
-2 & 1 & 2 & -3
\end{array}\right]$$

#### Step 2: Forward Elimination (Column 1)
Pivot is $a_{11} = 2$.
- Eliminate Row 2: $\text{factor} = \frac{-3}{2} = -1.5$.
  $$R_2 \leftarrow R_2 - (-1.5) R_1 = R_2 + 1.5 R_1$$
  $$R_2 = [-3 + 3, \; -1 + 1.5, \; 2 - 1.5, \; -11 + 12] = [0, \; 0.5, \; 0.5, \; 1]$$
- Eliminate Row 3: $\text{factor} = \frac{-2}{2} = -1$.
  $$R_3 \leftarrow R_3 - (-1) R_1 = R_3 + R_1$$
  $$R_3 = [-2 + 2, \; 1 + 1, \; 2 - 1, \; -3 + 8] = [0, \; 2, \; 1, \; 5]$$

Augmented matrix is now:
$$\left[\begin{array}{ccc|c}
2 & 1 & -1 & 8 \\
0 & 0.5 & 0.5 & 1 \\
0 & 2 & 1 & 5
\end{array}\right]$$

#### Step 3: Forward Elimination (Column 2) with Pivoting
Pivot is $a_{22} = 0.5$. Notice that Row 3 has a larger entry $|a_{32}| = 2 > 0.5$.
We swap $R_2 \leftrightarrow R_3$ (**Partial Pivoting**):
$$\left[\begin{array}{ccc|c}
2 & 1 & -1 & 8 \\
0 & 2 & 1 & 5 \\
0 & 0.5 & 0.5 & 1
\end{array}\right]$$

Now eliminate Row 3: $\text{factor} = \frac{0.5}{2} = 0.25$.
$$R_3 \leftarrow R_3 - 0.25 R_2$$
$$R_3 = [0, \; 0.5 - 0.5, \; 0.5 - 0.25, \; 1 - 1.25] = [0, \; 0, \; 0.25, \; -0.25]$$

The system is now in **Upper Triangular Form**:
$$\left[\begin{array}{ccc|c}
2 & 1 & -1 & 8 \\
0 & 2 & 1 & 5 \\
0 & 0 & 0.25 & -0.25
\end{array}\right]$$

#### Step 4: Back Substitution
Solve from bottom to top:
1. **Solve for $x_3$:**
   $$0.25 x_3 = -0.25 \implies x_3 = \frac{-0.25}{0.25} = -1$$
2. **Solve for $x_2$:**
   $$2x_2 + 1(x_3) = 5 \implies 2x_2 + 1(-1) = 5 \implies 2x_2 = 6 \implies x_2 = 3$$
3. **Solve for $x_1$:**
   $$2x_1 + 1(x_2) - 1(x_3) = 8 \implies 2x_1 + 3 - (-1) = 8 \implies 2x_1 + 4 = 8 \implies x_1 = 2$$

**Final Solution Vector:**
$$\mathbf{x} = \begin{bmatrix} 2 \\ 3 \\ -1 \end{bmatrix}$$

---

## 3. Why Partial Pivoting is Mandatory (Floating-Point Disaster)

Consider solving this innocent-looking 2D system using 32-bit floating-point arithmetic:

$$\begin{bmatrix} 10^{-4} & 1 \\ 1 & 1 \end{bmatrix} \begin{bmatrix} x_1 \\ x_2 \end{bmatrix} = \begin{bmatrix} 1 \\ 2 \end{bmatrix}$$

### Case 1: Without Pivoting (Numerical Catastrophe)
1. Pivot is $a_{11} = 10^{-4}$.
2. Elimination factor: $m = \frac{1}{10^{-4}} = 10,000$.
3. Row 2 becomes:
   $$(1 - 10000 \times 1) x_2 = (2 - 10000 \times 1)$$
   $$-9999 x_2 = -9998 \implies x_2 \approx 1.000$$
4. Back substitute into Row 1:
   $$10^{-4} x_1 + 1(1.000) = 1 \implies 10^{-4} x_1 = 0 \implies x_1 = 0 \quad (\text{WRONG!})$$

The algorithm claimed $x_1 = 0$ due to rounding cancellation!

### Case 2: With Partial Pivoting (Swap Rows First)
Swap Row 1 and Row 2 before eliminating:
$$\begin{bmatrix} 1 & 1 \\ 10^{-4} & 1 \end{bmatrix} \begin{bmatrix} x_1 \\ x_2 \end{bmatrix} = \begin{bmatrix} 2 \\ 1 \end{bmatrix}$$

1. Pivot is $1$.
2. Factor: $m = \frac{10^{-4}}{1} = 10^{-4}$.
3. Row 2 becomes:
   $$(1 - 10^{-4}) x_2 = 1 - 10^{-4} \times 2 \implies 0.9999 x_2 = 0.9998 \implies x_2 = \frac{0.9998}{0.9999} \approx 0.9999$$
4. Back substitute:
   $$x_1 + 0.9999 = 2 \implies x_1 = 1.0001$$

True solution is $(1, 1)$. Pivoting preserved precision across all IEEE-754 mantissa bits!

---

## 4. Determinants: The Geometric Scaling Factor

The determinant $\det(A)$ is a scalar measuring how much a linear transformation scales $n$-dimensional volumes. It is the single most important diagnostic number of a square matrix.

### Geometric Area in 2D
Given matrix $A = \begin{bmatrix} a & b \\ c & d \end{bmatrix}$, its columns $\mathbf{v}_1 = \begin{bmatrix} a \\ c \end{bmatrix}$ and $\mathbf{v}_2 = \begin{bmatrix} b \\ d \end{bmatrix}$ span a parallelogram:

$$\det(A) = ad - bc$$

```
               (a+b, c+d)
                     *
                    / \
      v2 [b,d]     /   \
           *      /     \
            \    / Area  \
             \  / =|ad-bc|\
              \/           \
              *-------------* v1 [a,c]
             (0,0)
```

### What does the sign of $\det(A)$ mean?
- **$\det(A) > 0$:** Preserves spatial orientation (counter-clockwise basis stays counter-clockwise, right-handed coordinates stay right-handed).
- **$\det(A) < 0$:** Inverts spatial orientation (mirror reflection, handedness flips).
- **$\det(A) = 0$:** **Singular (Dimension Collapse!)** The transformation squashes the entire 2D plane into a 1D line or a single 0D point. The area becomes $0$. Information is permanently destroyed, and no inverse function can ever undo the squash!

---

### Computing 3x3 Determinants: The Rule of Sarrus
For a $3 \times 3$ matrix:

$$A = \begin{bmatrix} 
a_{11} & a_{12} & a_{13} \\ 
a_{21} & a_{22} & a_{23} \\ 
a_{31} & a_{32} & a_{33} 
\end{bmatrix}$$

Write the first two columns again to the right of the matrix:

```
    a11   a12   a13 | a11   a12
       \     \     \
    a21   a22   a23 | a21   a22
       \     \     \
    a31   a32   a33 | a31   a32
       /     /     /
```

Add the products along the three down-right diagonals, and subtract the products along the three up-right diagonals:

$$\begin{aligned}
\det(A) = &+(a_{11} a_{22} a_{33} + a_{12} a_{23} a_{31} + a_{13} a_{21} a_{32}) \\
          &-(a_{31} a_{22} a_{13} + a_{32} a_{23} a_{11} + a_{33} a_{21} a_{12})
\end{aligned}$$

#### Concrete 3x3 Numerical Example
Let:
$$A = \begin{bmatrix} 
1 & 2 & 3 \\ 
0 & 1 & 4 \\ 
5 & 6 & 0 
\end{bmatrix}$$

1. **Downward Diagonals (+):**
   $$(1 \times 1 \times 0) + (2 \times 4 \times 5) + (3 \times 0 \times 6) = 0 + 40 + 0 = \mathbf{40}$$
2. **Upward Diagonals (-):**
   $$(5 \times 1 \times 3) + (6 \times 4 \times 1) + (0 \times 0 \times 2) = 15 + 24 + 0 = \mathbf{39}$$
3. **Determinant:**
   $$\det(A) = 40 - 39 = \mathbf{1}$$
Because $\det(A) = 1$, the transformation preserves 3D volume exactly without any scale change!

---

### Laplace Expansion (Minors & Cofactors for Any $n \times n$ Matrix)
For matrices larger than $3 \times 3$, the Rule of Sarrus does not apply. We use **Laplace Cofactor Expansion** along any row $i$ or column $j$:

$$\det(A) = \sum_{j=1}^n (-1)^{i+j} a_{ij} M_{ij} = \sum_{j=1}^n a_{ij} C_{ij}$$

Where:
- **Minor $M_{ij}$:** The determinant of the $(n-1) \times (n-1)$ submatrix obtained by deleting row $i$ and column $j$.
- **Cofactor $C_{ij} = (-1)^{i+j} M_{ij}$:** The signed minor, using the checkerboard sign pattern:
  $$\begin{bmatrix} + & - & + & \cdots \\ - & + & - & \cdots \\ + & - & + & \cdots \end{bmatrix}$$

---

### The Adjugate Matrix & Classical Adjoint Inverse Formula
The **Cofactor Matrix** $C$ replaces each entry $a_{ij}$ with its cofactor $C_{ij}$.
The **Adjugate Matrix** $\text{adj}(A)$ is the **transpose** of the cofactor matrix:

$$\text{adj}(A) = C^T \iff [\text{adj}(A)]_{ij} = C_{ji}$$

This yields the celebrated universal analytical formula for the inverse matrix:

$$A^{-1} = \frac{1}{\det(A)} \text{adj}(A)$$

#### Full 2x2 Derivation
For $A = \begin{bmatrix} a & b \\ c & d \end{bmatrix}$:
- Minors: $M_{11} = d, \; M_{12} = c, \; M_{21} = b, \; M_{22} = a$.
- Cofactors: $C_{11} = d, \; C_{12} = -c, \; C_{21} = -b, \; C_{22} = a$.
- Cofactor matrix: $C = \begin{bmatrix} d & -c \\ -b & a \end{bmatrix}$.
- Adjugate matrix (transpose): $\text{adj}(A) = C^T = \begin{bmatrix} d & -b \\ -c & a \end{bmatrix}$.
- Resulting inverse:
  $$A^{-1} = \frac{1}{ad - bc} \begin{bmatrix} d & -b \\ -c & a \end{bmatrix}$$

---

### Cramer's Rule: Solving Systems via Determinant Ratios
For an invertible system $A\mathbf{x} = \mathbf{b}$, each unknown variable $x_i$ can be solved as the ratio of two determinants:

$$x_i = \frac{\det(A_i)}{\det(A)}$$

Where $A_i$ is matrix $A$ with its $i$-th column replaced by the target vector $\mathbf{b}$!

#### Step-by-Step 2D Example with Cramer's Rule
Solve:
$$\begin{aligned}
2x_1 + x_2 &= 5 \\
x_1 + 3x_2 &= 10
\end{aligned} \implies A = \begin{bmatrix} 2 & 1 \\ 1 & 3 \end{bmatrix}, \quad \mathbf{b} = \begin{bmatrix} 5 \\ 10 \end{bmatrix}$$

1. **System Determinant $\det(A)$:**
   $$\det(A) = (2)(3) - (1)(1) = 6 - 1 = \mathbf{5}$$
2. **Replace Column 1 with $\mathbf{b}$ ($A_1$):**
   $$A_1 = \begin{bmatrix} 5 & 1 \\ 10 & 3 \end{bmatrix} \implies \det(A_1) = (5)(3) - (1)(10) = 15 - 10 = \mathbf{5}$$
   $$x_1 = \frac{\det(A_1)}{\det(A)} = \frac{5}{5} = \mathbf{1}$$
3. **Replace Column 2 with $\mathbf{b}$ ($A_2$):**
   $$A_2 = \begin{bmatrix} 2 & 5 \\ 1 & 10 \end{bmatrix} \implies \det(A_2) = (2)(10) - (5)(1) = 20 - 5 = \mathbf{15}$$
   $$x_2 = \frac{\det(A_2)}{\det(A)} = \frac{15}{5} = \mathbf{3}$$

**Solution:** $\mathbf{x} = \begin{bmatrix} 1 \\ 3 \end{bmatrix}$ (Matches Gaussian elimination exactly!).

---

### The Matrix Trace $\text{Tr}(A)$ & Eigenvalue Unification
The **Trace** of an $n \times n$ square matrix is the sum of its main diagonal elements:

$$\text{Tr}(A) = \sum_{i=1}^n a_{ii} = a_{11} + a_{22} + \dots + a_{nn}$$

#### Key Trace Properties
1. **Linearity:** $\text{Tr}(A + B) = \text{Tr}(A) + \text{Tr}(B)$ and $\text{Tr}(c A) = c \text{Tr}(A)$
2. **Transpose Invariance:** $\text{Tr}(A^T) = \text{Tr}(A)$
3. **Cyclic Permutation Property (Crucial for Machine Learning & Matrix Calculus):**
   $$\text{Tr}(ABC) = \text{Tr}(BCA) = \text{Tr}(CAB)$$
   *(Note: $\text{Tr}(ABC) \neq \text{Tr}(BAC)$ in general, only cyclic shifts preserve the trace!)*
4. **Frobenius Norm via Trace:**
   $$\|A\|_F^2 = \sum_{i=1}^m \sum_{j=1}^n a_{ij}^2 = \text{Tr}(A^T A)$$

#### The Deep Connection Between Trace, Determinant & Eigenvalues
For any $n \times n$ matrix with eigenvalues $\lambda_1, \dots, \lambda_n$:

$$\text{Tr}(A) = \sum_{i=1}^n \lambda_i \quad \text{and} \quad \det(A) = \prod_{i=1}^n \lambda_i$$

In 2D, the entire characteristic polynomial $\det(A - \lambda I) = 0$ is expressed purely by Trace and Determinant:

$$\lambda^2 - \text{Tr}(A)\lambda + \det(A) = 0$$

$$\lambda_{1, 2} = \frac{\text{Tr}(A) \pm \sqrt{\text{Tr}(A)^2 - 4\det(A)}}{2}$$

- If $\text{Tr}(A)^2 - 4\det(A) > 0$: Two distinct real eigenvalues.
- If $\text{Tr}(A)^2 - 4\det(A) = 0$: Repeated eigenvalue.
- If $\text{Tr}(A)^2 - 4\det(A) < 0$: Complex conjugate eigenvalues (causes rotation/spirals in dynamical systems!).

---

### The Invertible Matrix Theorem
For any square $n \times n$ matrix $A$, the following statements are **all mathematically equivalent**:
1. $A$ is invertible ($A^{-1}$ exists).
2. $\det(A) \neq 0$.
3. $\text{rank}(A) = n$ (Full rank).
4. $\text{nullity}(A) = 0$ (The only solution to $A\mathbf{x} = \mathbf{0}$ is $\mathbf{x} = \mathbf{0}$).
5. The columns of $A$ are linearly independent and span $\mathbb{R}^n$.
6. The rows of $A$ are linearly independent and span $\mathbb{R}^n$.
7. $A\mathbf{x} = \mathbf{b}$ has a unique solution for every target vector $\mathbf{b}$.
8. $A$ can be row-reduced to the identity matrix $I_n$.
9. Zero is not an eigenvalue of $A$ ($\lambda_i \neq 0$ for all $i$).
10. The linear transformation $T(\mathbf{x}) = A\mathbf{x}$ is both one-to-one (injective) and onto (surjective).

---

## 5. Matrix Inverses & Gauss-Jordan Elimination

A square matrix $A \in \mathbb{R}^{n \times n}$ is invertible (non-singular) if and only if $\det(A) \neq 0$.
The inverse matrix $A^{-1}$ satisfies:
$$A A^{-1} = A^{-1} A = I_n$$

### Gauss-Jordan Inversion Algorithm for $n \times n$ Matrices
To invert larger matrices, augment with the identity matrix $[A \mid I]$ and row reduce until the left side is $I$:

$$[A \mid I] \xrightarrow{\text{Gauss-Jordan}} [I \mid A^{-1}]$$

---

## 6. The Four Fundamental Subspaces & Rank-Nullity

For any matrix $A \in \mathbb{R}^{m \times n}$ with rank $r$:

```
        Domain R^n                                   Codomain R^m
  +----------------------+                     +----------------------+
  |                      |                     |                      |
  |     Row Space        |                     |    Column Space      |
  |      C(A^T)          |---- A x ----------->|       C(A)           |
  |     dim = r          |                     |      dim = r         |
  |                      |                     |                      |
  |----------------------|                     |----------------------|
  |                      |                     |                      |
  |     Null Space       |                     |   Left Null Space    |
  |       N(A)           |---- A x = 0 ------->|       N(A^T)         |
  |    dim = n - r       |                     |     dim = m - r      |
  |                      |                     |                      |
  +----------------------+                     +----------------------+
     Row ⊥ Null Space                             Col ⊥ Left Null Space
```

1. **Column Space $\mathcal{C}(A)$:** All possible outputs $A\mathbf{x}$. Dimension $= r$.
2. **Null Space $\mathcal{N}(A)$:** All inputs mapped to zero ($A\mathbf{x} = \mathbf{0}$). Dimension $= n - r$.
3. **Row Space $\mathcal{C}(A^T)$:** Spanned by rows of $A$. Dimension $= r$.
4. **Left Null Space $\mathcal{N}(A^T)$:** All vectors $\mathbf{y}$ where $A^T \mathbf{y} = \mathbf{0}$. Dimension $= m - r$.

### The Rank-Nullity Theorem
$$\text{rank}(A) + \text{nullity}(A) = n$$

- **Full Rank ($\text{nullity} = 0$):** Injective transformation. Zero information is lost.
- **Rank Deficient ($\text{nullity} > 0$):** An entire subspace of non-zero directions collapses to zero!

---

## 7. Frontier Deep Learning Applications

1. **Normalizing Flows:** Generative models like RealNVP, Glow, and Flow Matching model probability distributions $p(\mathbf{x})$ via invertible neural networks $\mathbf{y} = f(\mathbf{x})$. By the change of variables formula:
   $$p(\mathbf{x}) = p(\mathbf{y}) \left| \det \left(\frac{\partial f}{\partial \mathbf{x}}\right) \right|$$
   They design triangular layers so that $\det(J) = \prod J_{ii}$ can be computed in $O(n)$ time!
2. **Condition Number & Vanishing Gradients:** The condition number $\kappa(A) = \frac{\sigma_{\max}(A)}{\sigma_{\min}(A)}$ measures sensitivity to perturbations. When deep networks have ill-conditioned weight matrices ($\kappa \gg 10^4$), gradient updates explode in some directions and vanish in others.
3. **Residual Connections Preserve Rank:** In plain deep networks, repeating $W_l x$ causes the effective rank of activations to collapse toward $1$ (rank collapse). ResNets ($x + F(x)$) ensure the identity path preserves full dimensionality!

> [!TIP]
> **Explore the Interactive Lab:**
> Switch to the **Interactive 2D Lab** tab above to test the Row Picture vs Column Picture with interactive line intersections, adjust matrix entries to see parallelogram areas change live, and watch what happens when $\det(A) = 0$!
