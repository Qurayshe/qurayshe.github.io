# Module 00a: Vector Spaces, Linear Independence & Geometric Transformations

Before training multi-layer neural networks or optimizing high-dimensional loss landscapes, machine learning models treat data as points in continuous geometric spaces. Every token in a Large Language Model is an embedding vector in $\mathbb{R}^{4096}$, every image is a flattened tensor in $\mathbb{R}^{C \times H \times W}$, and every linear layer ($y = Wx + b$) is an affine geometric transformation. 

Let us build an unshakable, intuitive foundation for vector spaces, linear combinations, dot products, and geometric matrix transformations from the ground up.

---

## 1. What is a Vector? (Three Mental Models)

To truly master machine learning mathematics, it helps to understand the three distinct ways vectors are viewed across disciplines:

```
    Physics View                  Computer Science View                Mathematics View
  (Arrow in Space)                  (Array of Floats)               (Abstract Vector Space)
        y                                                              
        ^                             [  3.14 ]                     Element v ∈ V obeying
        |    / (x, y)                 [ -0.05 ]                     8 structural axioms:
        |   /                         [  2.71 ]                     - Closure under add/scale
        |  / magnitude & dir          [  0.00 ]                     - Commutative, associative
        +--------> x                  shape: (d, 1)                 - Distributive laws
```

1. **The Physicist's Arrow:** A vector is an arrow characterized by a length (**magnitude**) and a pointing direction in coordinate space, invariant to coordinate system shifts.
2. **The Computer Scientist's Array:** A vector is an ordered 1D array or list of floating-point numbers. For example, a user's feature profile might be `[age, income, credit_score, click_rate]`.
3. **The Mathematician's Vector Space:** A set $\mathcal{V}$ endowed with two operations:
   - **Vector Addition:** $\mathbf{u} + \mathbf{v} \in \mathcal{V}$
   - **Scalar Multiplication:** $c \mathbf{v} \in \mathcal{V}$ for any scalar $c \in \mathbb{R}$

A set $\mathcal{V}$ qualifies as a real vector space if and only if it satisfies eight fundamental axioms:
- **Commutativity of Addition:** $\mathbf{u} + \mathbf{v} = \mathbf{v} + \mathbf{u}$
- **Associativity of Addition:** $\mathbf{u} + (\mathbf{v} + \mathbf{w}) = (\mathbf{u} + \mathbf{v}) + \mathbf{w}$
- **Additive Identity:** A zero vector $\mathbf{0}$ exists such that $\mathbf{v} + \mathbf{0} = \mathbf{v}$
- **Additive Inverse:** For every $\mathbf{v}$, there exists $-\mathbf{v}$ such that $\mathbf{v} + (-\mathbf{v}) = \mathbf{0}$
- **Compatibility of Scalar Multiplication:** $a(b\mathbf{v}) = (ab)\mathbf{v}$
- **Scalar Identity:** $1\mathbf{v} = \mathbf{v}$
- **Distributivity over Vectors:** $c(\mathbf{u} + \mathbf{v}) = c\mathbf{u} + c\mathbf{v}$
- **Distributivity over Scalars:** $(a + b)\mathbf{v} = a\mathbf{v} + b\mathbf{v}$

In deep learning, our default sandbox is the Euclidean space $\mathbb{R}^n$:

$$\mathbf{x} = \begin{bmatrix} x_1 \\ x_2 \\ \vdots \\ x_n \end{bmatrix} \in \mathbb{R}^n$$

---

## 2. Vector Arithmetic & The Parallelogram Law (With 2D Examples)

### Vector Addition
Given two vectors $\mathbf{u} = \begin{bmatrix} u_1 \\ u_2 \end{bmatrix}$ and $\mathbf{v} = \begin{bmatrix} v_1 \\ v_2 \end{bmatrix}$, their sum is calculated component-wise:

$$\mathbf{u} + \mathbf{v} = \begin{bmatrix} u_1 + v_1 \\ u_2 + v_2 \end{bmatrix}$$

**Geometric Intuition (Head-to-Tail & Parallelogram):**
Place the tail of $\mathbf{v}$ at the head of $\mathbf{u}$. The arrow pointing from the origin to the tip of $\mathbf{v}$ is $\mathbf{u} + \mathbf{v}$. Alternatively, $\mathbf{u}$ and $\mathbf{v}$ form adjacent edges of a parallelogram, and the diagonal is their sum!

```
               (u1+v1, u2+v2)
                     *
                    / \
              u    /   \   v
                  /     \
                 *-------*
                (0,0)  v
```

### Scalar Multiplication
Multiplying vector $\mathbf{v}$ by scalar $c \in \mathbb{R}$ scales its magnitude by $|c|$:
- If $c > 1$: the vector stretches in the same direction.
- If $0 < c < 1$: the vector shrinks in the same direction.
- If $c < 0$: the vector reverses direction ($180^\circ$ flip) and scales by $|c|$.

### Step-by-Step Numerical Example
Let:
$$\mathbf{u} = \begin{bmatrix} 3 \\ 1 \end{bmatrix}, \quad \mathbf{v} = \begin{bmatrix} 1 \\ 2 \end{bmatrix}$$

1. **Sum:**
   $$\mathbf{u} + \mathbf{v} = \begin{bmatrix} 3 + 1 \\ 1 + 2 \end{bmatrix} = \begin{bmatrix} 4 \\ 3 \end{bmatrix}$$
2. **Scaling:**
   $$2\mathbf{u} = \begin{bmatrix} 2 \times 3 \\ 2 \times 1 \end{bmatrix} = \begin{bmatrix} 6 \\ 2 \end{bmatrix}, \quad -1\mathbf{v} = \begin{bmatrix} -1 \\ -2 \end{bmatrix}$$
3. **Linear Combination:**
   $$2\mathbf{u} - 3\mathbf{v} = \begin{bmatrix} 6 \\ 2 \end{bmatrix} - \begin{bmatrix} 3 \\ 6 \end{bmatrix} = \begin{bmatrix} 3 \\ -4 \end{bmatrix}$$

---

## 3. Dot Products, Angles & Orthogonal Projections

The inner product (dot product) between two vectors $\mathbf{u}, \mathbf{v} \in \mathbb{R}^n$ is the single scalar obtained by multiplying matching components and summing them:

$$\mathbf{u} \cdot \mathbf{v} = \mathbf{u}^T \mathbf{v} = \sum_{i=1}^n u_i v_i$$

### Geometric Meaning & The Angle Formula
The algebraic dot product is mathematically equivalent to the geometric product of magnitudes times the cosine of the angle $\theta$ between them:

$$\mathbf{u} \cdot \mathbf{v} = \|\mathbf{u}\|_2 \|\mathbf{v}\|_2 \cos(\theta)$$

Where the Euclidean norm (length) of a vector is:
$$\|\mathbf{u}\|_2 = \sqrt{u_1^2 + u_2^2 + \dots + u_n^2} = \sqrt{\mathbf{u} \cdot \mathbf{u}}$$

This gives us the exact formula for the angle between any two vectors:

$$\cos(\theta) = \frac{\mathbf{u} \cdot \mathbf{v}}{\|\mathbf{u}\|_2 \|\mathbf{v}\|_2} \implies \theta = \arccos\left(\frac{\mathbf{u} \cdot \mathbf{v}}{\|\mathbf{u}\|_2 \|\mathbf{v}\|_2}\right)$$

### The Three Critical Regimes
- **$\mathbf{u} \cdot \mathbf{v} > 0$ ($\theta < 90^\circ$):** Acute angle. The vectors point in roughly the same direction and share positive informational alignment.
- **$\mathbf{u} \cdot \mathbf{v} = 0$ ($\theta = 90^\circ$):** **Orthogonal** (perpendicular). The vectors share zero directional overlap. In machine learning, orthogonal features are completely uncorrelated.
- **$\mathbf{u} \cdot \mathbf{v} < 0$ ($\theta > 90^\circ$):** Obtuse angle. The vectors oppose each other.

```
       u . v > 0                 u . v = 0                 u . v < 0
       (Aligned)               (Orthogonal)                (Opposing)
          u                         u                          u
         /                         |                            \
        / θ < 90°                  | θ = 90°                     \ θ > 90°
       +---------> v               +---------> v          v <----+
```

### Orthogonal Projection & Residual
When you project vector $\mathbf{u}$ onto vector $\mathbf{v}$, you drop a perpendicular line from the tip of $\mathbf{u}$ onto the line spanned by $\mathbf{v}$:

$$\text{proj}_{\mathbf{v}}(\mathbf{u}) = \left(\frac{\mathbf{u} \cdot \mathbf{v}}{\|\mathbf{v}\|_2^2}\right) \mathbf{v}$$

The scalar $\frac{\mathbf{u} \cdot \mathbf{v}}{\|\mathbf{v}\|_2}$ is the length of the shadow $\mathbf{u}$ casts onto $\mathbf{v}$. Multiplying by unit vector $\frac{\mathbf{v}}{\|\mathbf{v}\|_2}$ gives the projection vector.

The **residual vector** $\mathbf{e} = \mathbf{u} - \text{proj}_{\mathbf{v}}(\mathbf{u})$ is guaranteed to be strictly perpendicular to $\mathbf{v}$:

$$\mathbf{e} \cdot \mathbf{v} = \left(\mathbf{u} - \frac{\mathbf{u} \cdot \mathbf{v}}{\mathbf{v} \cdot \mathbf{v}} \mathbf{v}\right) \cdot \mathbf{v} = \mathbf{u} \cdot \mathbf{v} - \frac{\mathbf{u} \cdot \mathbf{v}}{\|\mathbf{v}\|^2} (\mathbf{v} \cdot \mathbf{v}) = 0$$

### Full Step-by-Step Numeric Calculation
Let $\mathbf{u} = \begin{bmatrix} 3 \\ 1 \end{bmatrix}$ and $\mathbf{v} = \begin{bmatrix} 1 \\ 2 \end{bmatrix}$.

1. **Calculate Dot Product:**
   $$\mathbf{u} \cdot \mathbf{v} = (3)(1) + (1)(2) = 3 + 2 = 5$$
2. **Calculate Magnitudes:**
   $$\|\mathbf{u}\|_2 = \sqrt{3^2 + 1^2} = \sqrt{10} \approx 3.162$$
   $$\|\mathbf{v}\|_2 = \sqrt{1^2 + 2^2} = \sqrt{5} \approx 2.236$$
3. **Calculate Angle:**
   $$\cos(\theta) = \frac{5}{\sqrt{10} \times \sqrt{5}} = \frac{5}{\sqrt{50}} = \frac{5}{5\sqrt{2}} = \frac{1}{\sqrt{2}} \approx 0.7071$$
   $$\theta = \arccos\left(\frac{1}{\sqrt{2}}\right) = 45^\circ \quad \left(\frac{\pi}{4} \text{ radians}\right)$$
4. **Calculate Orthogonal Projection of $\mathbf{u}$ onto $\mathbf{v}$:**
   $$\|\mathbf{v}\|_2^2 = 1^2 + 2^2 = 5$$
   $$\text{proj}_{\mathbf{v}}(\mathbf{u}) = \frac{5}{5} \begin{bmatrix} 1 \\ 2 \end{bmatrix} = \begin{bmatrix} 1 \\ 2 \end{bmatrix}$$
5. **Calculate Residual Vector:**
   $$\mathbf{e} = \mathbf{u} - \text{proj}_{\mathbf{v}}(\mathbf{u}) = \begin{bmatrix} 3 \\ 1 \end{bmatrix} - \begin{bmatrix} 1 \\ 2 \end{bmatrix} = \begin{bmatrix} 2 \\ -1 \end{bmatrix}$$
6. **Verify Orthogonality:**
   $$\mathbf{e} \cdot \mathbf{v} = (2)(1) + (-1)(2) = 2 - 2 = 0 \quad \checkmark$$

---

## 4. Linear Combinations, Span & Linear Independence

### Linear Combinations & Span
Given a set of vectors $\{\mathbf{v}_1, \mathbf{v}_2, \dots, \mathbf{v}_k\} \subset \mathbb{R}^n$, a **linear combination** is any vector formed by multiplying each vector by a scalar and summing:

$$\mathbf{w} = c_1 \mathbf{v}_1 + c_2 \mathbf{v}_2 + \dots + c_k \mathbf{v}_k = \sum_{i=1}^k c_i \mathbf{v}_i, \quad c_i \in \mathbb{R}$$

The **Span** is the infinite set of all possible linear combinations that can be generated:

$$\text{span}(\mathbf{v}_1, \dots, \mathbf{v}_k) = \left\{ \sum_{i=1}^k c_i \mathbf{v}_i \;\middle|\; c_i \in \mathbb{R} \right\}$$

- **1 Vector** $\mathbf{v} \neq \mathbf{0}$: Span is an infinite 1D straight line through the origin.
- **2 Non-collinear Vectors** in $\mathbb{R}^3$: Span is an infinite flat 2D plane passing through the origin.
- **$n$ Linearly Independent Vectors** in $\mathbb{R}^n$: Span is the entire $n$-dimensional space $\mathbb{R}^n$.

### Linear Independence: Detecting Redundancy
A set of vectors $\{\mathbf{v}_1, \dots, \mathbf{v}_k\}$ is **linearly independent** if no vector in the set can be created by a linear combination of the others. 

Formally:
$$c_1 \mathbf{v}_1 + c_2 \mathbf{v}_2 + \dots + c_k \mathbf{v}_k = \mathbf{0} \implies c_1 = c_2 = \dots = c_k = 0$$

If any non-zero coefficients exist that yield $\mathbf{0}$, the vectors are **linearly dependent**.
- That means at least one vector is redundant.
- Adding a redundant vector to a set does **not** expand its span.

#### Concrete 2D Independence Test
Consider $\mathbf{v}_1 = \begin{bmatrix} 1 \\ 2 \end{bmatrix}$ and $\mathbf{v}_2 = \begin{bmatrix} 2 \\ 4 \end{bmatrix}$.
Notice that $\mathbf{v}_2 = 2 \mathbf{v}_1$.
Setting $c_1 \mathbf{v}_1 + c_2 \mathbf{v}_2 = \mathbf{0}$:
$$(-2)\mathbf{v}_1 + (1)\mathbf{v}_2 = \begin{bmatrix} -2 \\ -4 \end{bmatrix} + \begin{bmatrix} 2 \\ 4 \end{bmatrix} = \begin{bmatrix} 0 \\ 0 \end{bmatrix}$$
Because non-zero scalars $c_1 = -2, c_2 = 1$ produce zero, they are **linearly dependent**. Their span is just a 1D line ($y = 2x$), not the full 2D plane!

Conversely, for $\mathbf{u} = \begin{bmatrix} 1 \\ 0 \end{bmatrix}$ and $\mathbf{w} = \begin{bmatrix} 0 \\ 1 \end{bmatrix}$:
$$c_1 \begin{bmatrix} 1 \\ 0 \end{bmatrix} + c_2 \begin{bmatrix} 0 \\ 1 \end{bmatrix} = \begin{bmatrix} c_1 \\ c_2 \end{bmatrix} = \begin{bmatrix} 0 \\ 0 \end{bmatrix} \implies c_1 = 0, c_2 = 0$$
They are strictly **linearly independent** and span all of $\mathbb{R}^2$.

### Basis and Dimension
A set $\mathcal{B} = \{\mathbf{b}_1, \dots, \mathbf{b}_d\}$ is a **basis** for subspace $\mathcal{S}$ if:
1. $\mathcal{B}$ is linearly independent (no redundancy).
2. $\text{span}(\mathcal{B}) = \mathcal{S}$ (covers the entire space).

The **dimension** of $\mathcal{S}$ is simply the number of vectors in its basis. Every vector in $\mathcal{S}$ can be expressed as a unique coordinate tuple with respect to $\mathcal{B}$.

---

## 5. Matrices as Geometric Linear Transformations

In introductory math, matrices are often introduced as boring rectangular grids of numbers. In modern AI, **a matrix is a dynamic geometric machine that bends, stretches, and rotates space!**

A mapping $T: \mathbb{R}^n \to \mathbb{R}^m$ is a **linear transformation** if:
1. **Additivity:** $T(\mathbf{u} + \mathbf{v}) = T(\mathbf{u}) + T(\mathbf{v})$
2. **Homogeneity:** $T(c\mathbf{u}) = c T(\mathbf{u})$

Geometric consequence: **Under a linear transformation, the origin $(0,0)$ remains fixed, and all grid lines remain straight and parallel.**

### The Secret of Matrix Columns
Every $2 \times 2$ matrix $A = \begin{bmatrix} a & b \\ c & d \end{bmatrix}$ is completely defined by where it sends the standard unit basis vectors $\mathbf{e}_1 = \begin{bmatrix} 1 \\ 0 \end{bmatrix}$ and $\mathbf{e}_2 = \begin{bmatrix} 0 \\ 1 \end{bmatrix}$:

$$A \mathbf{e}_1 = \begin{bmatrix} a & b \\ c & d \end{bmatrix} \begin{bmatrix} 1 \\ 0 \end{bmatrix} = \begin{bmatrix} a \\ c \end{bmatrix} = \text{Column 1}$$

$$A \mathbf{e}_2 = \begin{bmatrix} a & b \\ c & d \end{bmatrix} \begin{bmatrix} 0 \\ 1 \end{bmatrix} = \begin{bmatrix} b \\ d \end{bmatrix} = \text{Column 2}$$

> [!NOTE]
> To understand what any matrix does to space, just look at its columns! Column 1 tells you where $(1,0)$ lands. Column 2 tells you where $(0,1)$ lands. The rest of the grid follows by linearity.

```
      Original Standard Basis                    Transformed Basis (Matrix Columns)
               y                                             y
               ^                                             ^          A e2 = [b, d]^T
               |                                             |         /
        e2 [0,1]*                                            |        *
               |                                             |       /   Parallelogram
               +----*----> x                                 +------*----------> x
                  e1 [1,0]                                       A e1 = [a, c]^T
```

### Catalogue of Fundamental 2D Transformations

| Transformation | Matrix Formula | Action & Numeric Example |
| :--- | :--- | :--- |
| **Rotation by $\theta$** | $\begin{bmatrix} \cos\theta & -\sin\theta \\ \sin\theta & \cos\theta \end{bmatrix}$ | Rotates plane counter-clockwise. For $\theta = 90^\circ$: $\begin{bmatrix} 0 & -1 \\ 1 & 0 \end{bmatrix}$. $(1,0) \to (0,1)$, $(0,1) \to (-1,0)$. |
| **Non-uniform Scaling** | $\begin{bmatrix} s_x & 0 \\ 0 & s_y \end{bmatrix}$ | Stretches $x$ by $s_x$ and $y$ by $s_y$. For $s_x=2, s_y=0.5$: $\begin{bmatrix} 2 & 0 \\ 0 & 0.5 \end{bmatrix}$. |
| **Horizontal Shear** | $\begin{bmatrix} 1 & k \\ 0 & 1 \end{bmatrix}$ | Slides horizontal layers proportional to height $y$. For $k=1.5$: $\begin{bmatrix} 1 & 1.5 \\ 0 & 1 \end{bmatrix}$. |
| **Reflection (X-Axis)** | $\begin{bmatrix} 1 & 0 \\ 0 & -1 \end{bmatrix}$ | Flips vertical sign while preserving horizontal coordinate. |
| **Dimension Collapse** | $\begin{bmatrix} 1 & 1 \\ 1 & 1 \end{bmatrix}$ | Squashes the entire 2D plane onto the 1D diagonal line $y = x$. Irreversible! |

### Composition & Non-Commutativity
Applying transformation $B$ followed by transformation $A$ is represented by the matrix product $M = AB$:

$$T(\mathbf{x}) = A(B\mathbf{x}) = (AB)\mathbf{x}$$

**Crucial Fact:** Matrix multiplication is **not commutative** ($AB \neq BA$). The order of geometric actions matters!
- Example: Rotating by $90^\circ$ then shearing horizontally produces a completely different result than shearing first and then rotating.

---

## 6. Special Matrices & Fundamental Matrix Algebra

Before moving to orthonormal decompositions, let us establish the taxonomy of matrix types that appear constantly in machine learning:

### 1. Matrix Transpose & Reversal Rule
The transpose $A^T$ swaps rows with columns: $[A^T]_{ij} = A_{ji}$.
- $(A + B)^T = A^T + B^T$
- $(cA)^T = c A^T$
- $(AB)^T = B^T A^T$ *(Order reverses! Think of putting on socks then shoes: when you invert/transpose, you remove shoes then socks!)*

### 2. Symmetric Matrices ($A = A^T$)
A matrix is symmetric if it equals its own transpose ($a_{ij} = a_{ji}$).
- **Deep Learning Examples:** Covariance matrices $\Sigma = \frac{1}{N} X^T X$, Hessian curvature matrices $H$, and Attention gram matrices $S = Q K^T$.
- **Spectral Theorem Guarantee:** Every real symmetric matrix has strictly real eigenvalues and can be orthogonally diagonalized: $A = Q \Lambda Q^T$.

### 3. Skew-Symmetric Matrices ($A^T = -A$)
Main diagonal entries are all zero ($a_{ii} = 0$), and $a_{ij} = -a_{ji}$.
Every square matrix can be decomposed uniquely into a sum of symmetric and skew-symmetric parts:
$$A = \underbrace{\frac{1}{2}(A + A^T)}_{\text{Symmetric (Energy/Loss)}} + \underbrace{\frac{1}{2}(A - A^T)}_{\text{Skew-Symmetric (Rotation/Curl)}}$$

### 4. Orthogonal Matrices ($Q^T Q = Q Q^T = I_n$)
A square matrix $Q$ is orthogonal if its transpose equals its inverse: $Q^{-1} = Q^T$.
- **Isometry (Preserves Lengths):**
  $$\|Q\mathbf{x}\|_2^2 = (Q\mathbf{x})^T (Q\mathbf{x}) = \mathbf{x}^T Q^T Q \mathbf{x} = \mathbf{x}^T I \mathbf{x} = \|\mathbf{x}\|_2^2$$
- **Preserves Angles:** $(Q\mathbf{u}) \cdot (Q\mathbf{v}) = \mathbf{u} \cdot \mathbf{v}$.
- **Determinant:** $\det(Q^T Q) = \det(Q)^2 = 1 \implies \det(Q) = \pm 1$.
  - If $\det(Q) = +1$: Pure spatial rotation (Special Orthogonal group $\text{SO}(n)$).
  - If $\det(Q) = -1$: Reflection (orientation-reversing).

### 5. Projection Matrices ($P^2 = P$, Idempotent)
Applying a projection once drops a point onto a subspace. Applying it a second time leaves the point unchanged ($P(P\mathbf{x}) = P\mathbf{x}$).
- **Orthogonal Projection Matrix onto Column Space of $A$:**
  $$P = A(A^T A)^{-1} A^T$$
- In Ordinary Least Squares (linear regression), the predicted target values $\hat{\mathbf{y}} = X\hat{\mathbf{w}} = P \mathbf{y}$ are the orthogonal projection of ground truth $\mathbf{y}$ onto the feature subspace!

---

## 7. Gram-Schmidt Orthogonalization (Step-by-Step)

In deep learning, working with arbitrary basis vectors leads to numerical instability and ill-conditioned gradients. An **orthonormal basis** $\{\mathbf{q}_1, \dots, \mathbf{q}_k\}$ satisfies:

$$\mathbf{q}_i \cdot \mathbf{q}_j = \begin{cases} 1 & \text{if } i = j \\ 0 & \text{if } i \neq j \end{cases}$$

The Gram-Schmidt algorithm takes any linearly independent set $\{\mathbf{v}_1, \mathbf{v}_2, \dots, \mathbf{v}_k\}$ and systematically peels away non-orthogonal components:

1. **First Vector:** Keep direction of $\mathbf{v}_1$, normalize to unit length:
   $$\mathbf{u}_1 = \mathbf{v}_1, \quad \mathbf{q}_1 = \frac{\mathbf{u}_1}{\|\mathbf{u}_1\|_2}$$

2. **Second Vector:** Subtract the projection of $\mathbf{v}_2$ onto $\mathbf{q}_1$, then normalize:
   $$\mathbf{u}_2 = \mathbf{v}_2 - (\mathbf{v}_2 \cdot \mathbf{q}_1) \mathbf{q}_1, \quad \mathbf{q}_2 = \frac{\mathbf{u}_2}{\|\mathbf{u}_2\|_2}$$

3. **General $k$-th Vector:** Subtract projections onto all previously computed orthonormal vectors:
   $$\mathbf{u}_k = \mathbf{v}_k - \sum_{j=1}^{k-1} (\mathbf{v}_k \cdot \mathbf{q}_j) \mathbf{q}_j, \quad \mathbf{q}_k = \frac{\mathbf{u}_k}{\|\mathbf{u}_k\|_2}$$

### Numerical Walkthrough with 2D Vectors
Let $\mathbf{v}_1 = \begin{bmatrix} 3 \\ 0 \end{bmatrix}$ and $\mathbf{v}_2 = \begin{bmatrix} 2 \\ 2 \end{bmatrix}$.

1. **Compute $\mathbf{q}_1$:**
   $$\mathbf{u}_1 = \mathbf{v}_1 = \begin{bmatrix} 3 \\ 0 \end{bmatrix}, \quad \|\mathbf{u}_1\|_2 = 3$$
   $$\mathbf{q}_1 = \frac{1}{3} \begin{bmatrix} 3 \\ 0 \end{bmatrix} = \begin{bmatrix} 1 \\ 0 \end{bmatrix}$$

2. **Compute $\mathbf{q}_2$:**
   $$\mathbf{v}_2 \cdot \mathbf{q}_1 = (2)(1) + (2)(0) = 2$$
   $$\mathbf{u}_2 = \mathbf{v}_2 - (\mathbf{v}_2 \cdot \mathbf{q}_1) \mathbf{q}_1 = \begin{bmatrix} 2 \\ 2 \end{bmatrix} - 2 \begin{bmatrix} 1 \\ 0 \end{bmatrix} = \begin{bmatrix} 0 \\ 2 \end{bmatrix}$$
   $$\|\mathbf{u}_2\|_2 = \sqrt{0^2 + 2^2} = 2$$
   $$\mathbf{q}_2 = \frac{1}{2} \begin{bmatrix} 0 \\ 2 \end{bmatrix} = \begin{bmatrix} 0 \\ 1 \end{bmatrix}$$

3. **Verify Orthonormality:**
   $$\|\mathbf{q}_1\|_2 = 1, \quad \|\mathbf{q}_2\|_2 = 1, \quad \mathbf{q}_1 \cdot \mathbf{q}_2 = (1)(0) + (0)(1) = 0 \quad \checkmark$$

Gram-Schmidt forms the basis of **QR Decomposition** ($A = QR$), where $Q$ is orthogonal and $R$ is upper triangular. This decomposition powers numerically stable least squares regression, eigenvalue algorithms, and Householder reflections throughout scientific computing.

---

## 7. Deep Learning Applications

1. **Word & Token Embeddings:** In NLP, words are mapped into $\mathbb{R}^{d}$ (e.g. $d = 4096$). Vector arithmetic reveals latent semantic directions:
   $$\vec{v}_{\text{king}} - \vec{v}_{\text{man}} + \vec{v}_{\text{woman}} \approx \vec{v}_{\text{queen}}$$
2. **Self-Attention Projections:** When a Transformer processes a token embedding $\mathbf{x}$, it multiplies it by projection matrices:
   $$\mathbf{q} = W_Q \mathbf{x}, \quad \mathbf{k} = W_K \mathbf{x}, \quad \mathbf{v} = W_V \mathbf{x}$$
   Each weight matrix is literally a linear transformation rotating and compressing token features into dedicated Query, Key, and Value subspaces.
3. **Weight Orthogonality in Deep Networks:** When weight matrices $W$ remain approximately orthogonal ($W^T W \approx I$), they preserve vector lengths ($\|Wx\|_2 = \|x\|_2$), completely eliminating vanishing and exploding activations across hundreds of layers.

> [!TIP]
> **Try the Interactive 2D Lab:**
> Switch to the **Interactive 2D Lab** tab above to visually drag 2D vectors, test dot products, inspect angle changes, and experiment with matrix rotations, shears, and scaling in real time!
