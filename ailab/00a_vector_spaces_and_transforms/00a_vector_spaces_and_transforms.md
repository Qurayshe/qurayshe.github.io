# Module 00a: Vector Spaces, Linear Independence & Geometric Transformations

Before training multi-layer neural networks or optimizing high-dimensional loss landscapes, machine learning models treat data as points in continuous geometric spaces. Every token in a Large Language Model is an embedding vector in $\mathbb{R}^{4096}$, every image is a flattened tensor in $\mathbb{R}^{C \times H \times W}$, and every linear neural layer is a geometric transformation matrix. Let us establish the core algebraic axioms that govern these spaces.

---

## 1. What is a Vector?

In physics, a vector is an arrow with magnitude and direction. In computer science, a vector is an ordered array of floating-point numbers. In pure mathematics, a vector is an element of an abstract **Vector Space** $\mathcal{V}$ over a field $\mathbb{F}$ (typically the real numbers $\mathbb{R}$).

A set $\mathcal{V}$ is a real vector space if vector addition and scalar multiplication satisfy eight fundamental axioms:
1. **Associativity of Addition**: $\mathbf{u} + (\mathbf{v} + \mathbf{w}) = (\mathbf{u} + \mathbf{v}) + \mathbf{w}$
2. **Commutativity of Addition**: $\mathbf{u} + \mathbf{v} = \mathbf{v} + \mathbf{u}$
3. **Additive Identity**: There exists $\mathbf{0} \in \mathcal{V}$ such that $\mathbf{v} + \mathbf{0} = \mathbf{v}$
4. **Additive Inverse**: For every $\mathbf{v}$, there exists $-\mathbf{v}$ such that $\mathbf{v} + (-\mathbf{v}) = \mathbf{0}$
5. **Compatibility of Scalar Multiplication**: $a(b\mathbf{v}) = (ab)\mathbf{v}$
6. **Scalar Multiplicative Identity**: $1\mathbf{v} = \mathbf{v}$
7. **Distributivity of Scalars**: $a(\mathbf{u} + \mathbf{v}) = a\mathbf{u} + a\mathbf{v}$
8. **Distributivity of Field Elements**: $(a + b)\mathbf{v} = a\mathbf{v} + b\mathbf{v}$

In deep learning, we operate almost exclusively within the Euclidean coordinate space $\mathbb{R}^n$:

$$\mathbf{x} = \begin{bmatrix} x_1 \\ x_2 \\ \vdots \\ x_n \end{bmatrix} \in \mathbb{R}^n$$

---

## 2. Linear Combinations, Span & Linear Independence

### Linear Combinations & Span
Given a set of vectors $\{\mathbf{v}_1, \mathbf{v}_2, \dots, \mathbf{v}_k\} \subset \mathbb{R}^n$, a **linear combination** is any vector formed by scaling and summing them:

$$\mathbf{w} = c_1 \mathbf{v}_1 + c_2 \mathbf{v}_2 + \dots + c_k \mathbf{v}_k = \sum_{i=1}^k c_i \mathbf{v}_i, \quad c_i \in \mathbb{R}$$

The **span** of these vectors is the set of all possible linear combinations they can generate:

$$\text{span}(\mathbf{v}_1, \dots, \mathbf{v}_k) = \left\{ \sum_{i=1}^k c_i \mathbf{v}_i \;\middle|\; c_i \in \mathbb{R} \right\}$$

- The span of one non-zero vector in $\mathbb{R}^3$ is a line through the origin.
- The span of two non-collinear vectors is a 2D plane passing through the origin.
- The span of $n$ linearly independent vectors in $\mathbb{R}^n$ is the entire space $\mathbb{R}^n$.

### Linear Independence
A set of vectors $\{\mathbf{v}_1, \dots, \mathbf{v}_k\}$ is **linearly independent** if no vector in the set can be expressed as a linear combination of the others. Mathematically:

$$c_1 \mathbf{v}_1 + c_2 \mathbf{v}_2 + \dots + c_k \mathbf{v}_k = \mathbf{0} \implies c_1 = c_2 = \dots = c_k = 0$$

If any non-zero scalars $c_i$ can produce the zero vector, the vectors are **linearly dependent**—meaning at least one vector is redundant and provides zero new directions in space.

### Basis and Dimension
A set of vectors $\mathcal{B} = \{\mathbf{b}_1, \dots, \mathbf{b}_d\}$ is a **basis** for a subspace $\mathcal{S}$ if:
1. $\mathcal{B}$ is linearly independent.
2. $\text{span}(\mathcal{B}) = \mathcal{S}$.

The **dimension** of $\mathcal{S}$ is the number of vectors in any basis for $\mathcal{S}$. Any vector $\mathbf{v} \in \mathcal{S}$ can be uniquely written as coordinates with respect to basis $\mathcal{B}$.

---

## 3. Dot Products, Angles & Orthogonal Projections

The inner product (dot product) between two vectors $\mathbf{u}, \mathbf{v} \in \mathbb{R}^n$ is defined as:

$$\mathbf{u} \cdot \mathbf{v} = \mathbf{u}^T \mathbf{v} = \sum_{i=1}^n u_i v_i$$

### Geometric Interpretation
The dot product bridges algebra and Euclidean geometry via the cosine of the angle $\theta$ between them:

$$\mathbf{u} \cdot \mathbf{v} = \|\mathbf{u}\|_2 \|\mathbf{v}\|_2 \cos(\theta) \implies \cos(\theta) = \frac{\mathbf{u} \cdot \mathbf{v}}{\|\mathbf{u}\|_2 \|\mathbf{v}\|_2}$$

- If $\mathbf{u} \cdot \mathbf{v} > 0$: The vectors point in roughly the same direction ($\theta < 90^\circ$).
- If $\mathbf{u} \cdot \mathbf{v} = 0$: The vectors are strictly **orthogonal** (perpendicular, $\theta = 90^\circ$).
- If $\mathbf{u} \cdot \mathbf{v} < 0$: The vectors point in opposing directions ($\theta > 90^\circ$).

### Vector Projections
The orthogonal projection of a vector $\mathbf{u}$ onto another vector $\mathbf{v}$ drops a perpendicular line from the tip of $\mathbf{u}$ onto the span of $\mathbf{v}$:

$$\text{proj}_{\mathbf{v}}(\mathbf{u}) = \frac{\mathbf{u} \cdot \mathbf{v}}{\|\mathbf{v}\|_2^2} \mathbf{v}$$

The residual vector $\mathbf{e} = \mathbf{u} - \text{proj}_{\mathbf{v}}(\mathbf{u})$ is guaranteed to be perpendicular to $\mathbf{v}$:

$$\mathbf{e} \cdot \mathbf{v} = \left(\mathbf{u} - \frac{\mathbf{u} \cdot \mathbf{v}}{\mathbf{v} \cdot \mathbf{v}} \mathbf{v}\right) \cdot \mathbf{v} = \mathbf{u} \cdot \mathbf{v} - \frac{\mathbf{u} \cdot \mathbf{v}}{\mathbf{v} \cdot \mathbf{v}} (\mathbf{v} \cdot \mathbf{v}) = 0$$

This is the exact mathematical foundation of linear regression (ordinary least squares) and Gram-Schmidt orthogonalization.

---

## 4. Matrices as Linear Transformations

A function $T: \mathbb{R}^n \to \mathbb{R}^m$ is a **linear transformation** if it satisfies two preservation properties for all vectors $\mathbf{u}, \mathbf{v}$ and scalar $c$:

$$T(\mathbf{u} + \mathbf{v}) = T(\mathbf{u}) + T(\mathbf{v})$$

$$T(c\mathbf{u}) = c T(\mathbf{u})$$

Every linear transformation $T: \mathbb{R}^n \to \mathbb{R}^m$ can be represented as multiplication by an $m \times n$ matrix $A$:

$$T(\mathbf{x}) = A \mathbf{x} = \begin{bmatrix} a_{11} & a_{12} & \cdots & a_{1n} \\ a_{21} & a_{22} & \cdots & a_{2n} \\ \vdots & \vdots & \ddots & \vdots \\ a_{m1} & a_{m2} & \cdots & a_{mn} \end{bmatrix} \begin{bmatrix} x_1 \\ x_2 \\ \vdots \\ x_n \end{bmatrix}$$

### What do the columns of a matrix mean?
If $\mathbf{e}_1, \mathbf{e}_2, \dots, \mathbf{e}_n$ are standard unit basis vectors, the $j$-th column of matrix $A$ is simply the landing destination of the $j$-th basis vector after the transformation:

$$A \mathbf{e}_j = \text{Column}_j(A)$$

| Transformation | 2D Matrix Form | Geometric Action |
| :--- | :--- | :--- |
| **Rotation** | $\begin{bmatrix} \cos\theta & -\sin\theta \\ \sin\theta & \cos\theta \end{bmatrix}$ | Rotates plane counter-clockwise by $\theta$ radians |
| **Scaling** | $\begin{bmatrix} s_x & 0 \\ 0 & s_y \end{bmatrix}$ | Stretches or compresses axes by factors $s_x, s_y$ |
| **Shear (Horizontal)** | $\begin{bmatrix} 1 & k \\ 0 & 1 \end{bmatrix}$ | Slants vertical lines by factor $k$ |
| **Reflection (X-Axis)**| $\begin{bmatrix} 1 & 0 \\ 0 & -1 \end{bmatrix}$ | Inverts the vertical sign |

---

## 5. Gram-Schmidt Orthogonalization

In numerical linear algebra and machine learning, working with arbitrary bases often causes numerical instability. An **orthonormal basis** $\{\mathbf{q}_1, \dots, \mathbf{q}_k\}$ satisfies:

$$\mathbf{q}_i \cdot \mathbf{q}_j = \begin{cases} 1 & \text{if } i = j \\ 0 & \text{if } i \neq j \end{cases}$$

The **Gram-Schmidt process** systematically converts any linearly independent set $\{\mathbf{v}_1, \dots, \mathbf{v}_k\}$ into an orthonormal set:

$$\mathbf{u}_1 = \mathbf{v}_1, \quad \mathbf{q}_1 = \frac{\mathbf{u}_1}{\|\mathbf{u}_1\|_2}$$

$$\mathbf{u}_2 = \mathbf{v}_2 - \text{proj}_{\mathbf{q}_1}(\mathbf{v}_2), \quad \mathbf{q}_2 = \frac{\mathbf{u}_2}{\|\mathbf{u}_2\|_2}$$

$$\mathbf{u}_i = \mathbf{v}_i - \sum_{j=1}^{i-1} (\mathbf{v}_i \cdot \mathbf{q}_j) \mathbf{q}_j, \quad \mathbf{q}_i = \frac{\mathbf{u}_i}{\|\mathbf{u}_i\|_2}$$

Gram-Schmidt produces the celebrated **QR Decomposition** ($A = QR$), which powers stable linear least squares and eigenvalue solvers throughout machine learning.
