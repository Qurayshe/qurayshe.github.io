# Module 01: Linear Algebra & Tensor Foundations for AI

Machine learning is geometry in hyper-dimensional spaces. Every dataset is a matrix of coordinates, every neural network layer is an affine geometric transformation, every word embedding is a directed arrow in semantic space, and every modern LLM weight update is a low-rank matrix decomposition.

Let us master the mathematical machinery of vectors, matrix perspectives, eigendecomposition, SVD, and multidimensional tensors from first principles.

---

## 1. Vectors & Distance Metrics in Machine Learning

A vector $\mathbf{x} \in \mathbb{R}^d$ represents a point or directed displacement in a $d$-dimensional continuous space:

$$\mathbf{x} = \begin{bmatrix} x_1 \\ x_2 \\ \vdots \\ x_d \end{bmatrix}$$

### Vector Norms (Measuring Distance and Magnitude)
A norm $\|\mathbf{x}\|$ assigns a non-negative length to a vector. In machine learning, the choice of norm defines how we penalize errors or regularize parameters:

```
        Unit Balls for L1, L2, and L_infinity Norms in 2D
        
         L1 Norm (Diamond)           L2 Norm (Circle)        L_infinity Norm (Square)
                 y                          y                           y
                 ^                          ^                           ^
                 |                          |                           |
                 *                          *                         *---*
                / \                       /   \                       |   |
            ---*---+---*---> x        ---*-----+---*---> x        ---*---+---*---> x
                \ /                       \   /                       |   |
                 *                          *                         *---*
                 |                          |                           |
```

1. **$L_1$ Norm (Manhattan / Taxi-Cab):**
   $$\|\mathbf{x}\|_1 = \sum_{i=1}^d |x_i|$$
   - **ML Property:** Drives weights strictly to zero ($0.0$), producing **sparse models** (Lasso regularization, compressed neural networks).
2. **$L_2$ Norm (Euclidean Distance):**
   $$\|\mathbf{x}\|_2 = \sqrt{\sum_{i=1}^d x_i^2} = \sqrt{\mathbf{x}^T \mathbf{x}}$$
   - **ML Property:** Penalizes large values quadratically, keeping weights small and evenly distributed (Weight Decay / Ridge Regularization).
3. **$L_\infty$ Norm (Chebyshev / Maximum):**
   $$\|\mathbf{x}\|_\infty = \max_{1 \le i \le d} |x_i|$$
   - **ML Property:** Used in adversarial robustness (e.g. FGSM attacks, where perturbations on any single pixel cannot exceed $\epsilon$).

### Dot Product & Cosine Similarity in Semantic Search
The dot product measures directional alignment:
$$\mathbf{u} \cdot \mathbf{v} = \mathbf{u}^T \mathbf{v} = \sum_{i=1}^d u_i v_i = \|\mathbf{u}\|_2 \|\mathbf{v}\|_2 \cos(\theta)$$

In vector databases (RAG, Chroma, Pinecone) and sentence transformers, embeddings of different documents often have different lengths. **Cosine Similarity** normalizes away length to compare pure semantic orientation:

$$\text{CosineSim}(\mathbf{u}, \mathbf{v}) = \frac{\mathbf{u} \cdot \mathbf{v}}{\|\mathbf{u}\|_2 \|\mathbf{v}\|_2} = \cos(\theta)$$

#### Step-by-Step Numerical Example
Consider three 2D token embeddings:
- $\mathbf{u} = \begin{bmatrix} 1 \\ 2 \end{bmatrix}$ (Query: "AI safety")
- $\mathbf{v} = \begin{bmatrix} 2 \\ 4 \end{bmatrix}$ (Doc 1: "Machine learning alignment guidelines")
- $\mathbf{w} = \begin{bmatrix} 4 \\ -1 \end{bmatrix}$ (Doc 2: "Baking sourdough bread")

1. **Compare Query $\mathbf{u}$ with Doc 1 $\mathbf{v}$:**
   $$\mathbf{u} \cdot \mathbf{v} = (1)(2) + (2)(4) = 2 + 8 = 10$$
   $$\|\mathbf{u}\|_2 = \sqrt{1^2 + 2^2} = \sqrt{5} \approx 2.236$$
   $$\|\mathbf{v}\|_2 = \sqrt{2^2 + 4^2} = \sqrt{20} = 2\sqrt{5} \approx 4.472$$
   $$\text{CosineSim}(\mathbf{u}, \mathbf{v}) = \frac{10}{\sqrt{5} \times 2\sqrt{5}} = \frac{10}{10} = \mathbf{1.000} \quad (\theta = 0^\circ, \text{Perfect Match!})$$

2. **Compare Query $\mathbf{u}$ with Doc 2 $\mathbf{w}$:**
   $$\mathbf{u} \cdot \mathbf{w} = (1)(4) + (2)(-1) = 4 - 2 = 2$$
   $$\|\mathbf{w}\|_2 = \sqrt{4^2 + (-1)^2} = \sqrt{17} \approx 4.123$$
   $$\text{CosineSim}(\mathbf{u}, \mathbf{w}) = \frac{2}{\sqrt{5} \times \sqrt{17}} = \frac{2}{\sqrt{85}} \approx \frac{2}{9.220} = \mathbf{0.217} \quad (\theta \approx 77.5^\circ, \text{Low Relevance})$$

---

## 2. Matrix Multiplication: Four Computational Perspectives

When multiplying $C = AB$ where $A \in \mathbb{R}^{m \times k}$ and $B \in \mathbb{R}^{k \times n}$:

```
     1. Entry-wise                    2. Column Combinations
     C_ij = row_i(A) . col_j(B)       col_j(C) = A * col_j(B)
     
     3. Row Combinations              4. Outer-Product Sum (LoRA / Attention)
     row_i(C) = row_i(A) * B          C = Σ a_r * b_r^T  (Sum of rank-1 matrices)
```

Let us work out $C = \begin{bmatrix} 1 & 2 \\ 3 & 4 \end{bmatrix} \begin{bmatrix} 5 & 6 \\ 7 & 8 \end{bmatrix}$:

1. **Entry-wise Perspective:**
   $$C_{11} = (1)(5) + (2)(7) = 5 + 14 = 19$$
   $$C_{12} = (1)(6) + (2)(8) = 6 + 16 = 22$$
   $$C_{21} = (3)(5) + (4)(7) = 15 + 28 = 43$$
   $$C_{22} = (3)(6) + (4)(8) = 18 + 32 = 50$$

2. **Column Combination Perspective:**
   $$\text{Col}_1(C) = 5 \begin{bmatrix} 1 \\ 3 \end{bmatrix} + 7 \begin{bmatrix} 2 \\ 4 \end{bmatrix} = \begin{bmatrix} 5 \\ 15 \end{bmatrix} + \begin{bmatrix} 14 \\ 28 \end{bmatrix} = \begin{bmatrix} 19 \\ 43 \end{bmatrix}$$
   $$\text{Col}_2(C) = 6 \begin{bmatrix} 1 \\ 3 \end{bmatrix} + 8 \begin{bmatrix} 2 \\ 4 \end{bmatrix} = \begin{bmatrix} 6 \\ 18 \end{bmatrix} + \begin{bmatrix} 16 \\ 32 \end{bmatrix} = \begin{bmatrix} 22 \\ 50 \end{bmatrix}$$

3. **Outer-Product Perspective (Crucial for LoRA & Transformer Attention):**
   $$C = \text{Col}_1(A) \text{Row}_1(B) + \text{Col}_2(A) \text{Row}_2(B)$$
   $$C = \begin{bmatrix} 1 \\ 3 \end{bmatrix} \begin{bmatrix} 5 & 6 \end{bmatrix} + \begin{bmatrix} 2 \\ 4 \end{bmatrix} \begin{bmatrix} 7 & 8 \end{bmatrix}$$
   $$C = \begin{bmatrix} 5 & 6 \\ 15 & 18 \end{bmatrix} + \begin{bmatrix} 14 & 16 \\ 28 & 32 \end{bmatrix} = \begin{bmatrix} 19 & 22 \\ 43 & 50 \end{bmatrix}$$

> [!NOTE]
> In Transformer Multi-Head Attention, when computing $QK^T$, each attention map is a sum of rank-1 outer products between query and key vectors. In LoRA, the parameter update $\Delta W = BA$ is formed directly as outer products of rank $r$.

---

## 3. Eigenvalues and Eigenvectors (Step-by-Step 2x2 Calculation)

When a matrix $A$ transforms space, most vectors change both their length and their direction. However, special vectors change **only their length**, remaining pointed along their original span!

$$A \mathbf{v} = \lambda \mathbf{v} \iff (A - \lambda I) \mathbf{v} = \mathbf{0}$$

- $\mathbf{v} \neq \mathbf{0}$: **Eigenvector**
- $\lambda \in \mathbb{R}$: **Eigenvalue** (scaling factor along the eigenvector direction)

For a non-trivial solution to exist, the matrix $(A - \lambda I)$ must be singular:

$$\det(A - \lambda I) = 0 \quad (\text{The Characteristic Equation})$$

### Complete Step-by-Step Numerical Example
Let $A = \begin{bmatrix} 4 & 1 \\ 2 & 3 \end{bmatrix}$.

#### Step 1: Solve Characteristic Polynomial for Eigenvalues
$$\det(A - \lambda I) = \det\begin{bmatrix} 4 - \lambda & 1 \\ 2 & 3 - \lambda \end{bmatrix} = 0$$
$$(4 - \lambda)(3 - \lambda) - (1)(2) = 0$$
$$\lambda^2 - 7\lambda + 12 - 2 = 0 \implies \lambda^2 - 7\lambda + 10 = 0$$
$$(\lambda - 5)(\lambda - 2) = 0 \implies \lambda_1 = 5, \quad \lambda_2 = 2$$

#### Step 2: Find Eigenvector for $\lambda_1 = 5$
Substitute $\lambda_1 = 5$ into $(A - 5I)\mathbf{v} = \mathbf{0}$:
$$\begin{bmatrix} 4 - 5 & 1 \\ 2 & 3 - 5 \end{bmatrix} \begin{bmatrix} v_1 \\ v_2 \end{bmatrix} = \begin{bmatrix} -1 & 1 \\ 2 & -2 \end{bmatrix} \begin{bmatrix} v_1 \\ v_2 \end{bmatrix} = \begin{bmatrix} 0 \\ 0 \end{bmatrix}$$
$$-v_1 + v_2 = 0 \implies v_1 = v_2$$
Choosing $v_1 = 1$, we get eigenvector:
$$\mathbf{v}_1 = \begin{bmatrix} 1 \\ 1 \end{bmatrix}$$

#### Step 3: Find Eigenvector for $\lambda_2 = 2$
Substitute $\lambda_2 = 2$ into $(A - 2I)\mathbf{v} = \mathbf{0}$:
$$\begin{bmatrix} 4 - 2 & 1 \\ 2 & 3 - 2 \end{bmatrix} \begin{bmatrix} v_1 \\ v_2 \end{bmatrix} = \begin{bmatrix} 2 & 1 \\ 2 & 1 \end{bmatrix} \begin{bmatrix} v_1 \\ v_2 \end{bmatrix} = \begin{bmatrix} 0 \\ 0 \end{bmatrix}$$
$$2v_1 + v_2 = 0 \implies v_2 = -2v_1$$
Choosing $v_1 = 1$, we get eigenvector:
$$\mathbf{v}_2 = \begin{bmatrix} 1 \\ -2 \end{bmatrix}$$

#### Step 4: Verify Eigenvector Action
$$A \mathbf{v}_1 = \begin{bmatrix} 4 & 1 \\ 2 & 3 \end{bmatrix} \begin{bmatrix} 1 \\ 1 \end{bmatrix} = \begin{bmatrix} 5 \\ 5 \end{bmatrix} = 5 \begin{bmatrix} 1 \\ 1 \end{bmatrix} = \lambda_1 \mathbf{v}_1 \quad \checkmark$$
$$A \mathbf{v}_2 = \begin{bmatrix} 4 & 1 \\ 2 & 3 \end{bmatrix} \begin{bmatrix} 1 \\ -2 \end{bmatrix} = \begin{bmatrix} 2 \\ -4 \end{bmatrix} = 2 \begin{bmatrix} 1 \\ -2 \end{bmatrix} = \lambda_2 \mathbf{v}_2 \quad \checkmark$$

### Eigendecomposition & The Spectral Theorem
If $A$ has $n$ linearly independent eigenvectors, it can be factored as:
$$A = V \Lambda V^{-1}$$
Where $V = [\mathbf{v}_1 \dots \mathbf{v}_n]$ and $\Lambda = \text{diag}(\lambda_1, \dots, \lambda_n)$.

**The Spectral Theorem for Symmetric Matrices ($A = A^T$):**
In machine learning (such as the covariance matrix in Principal Component Analysis PCA), matrices are frequently symmetric. The spectral theorem guarantees:
1. All eigenvalues $\lambda_i$ are **real numbers**.
2. Eigenvectors can be chosen to be mutually **orthonormal** ($V^{-1} = V^T$).
$$A = V \Lambda V^T = \sum_{i=1}^n \lambda_i \mathbf{v}_i \mathbf{v}_i^T$$

---

## 4. Singular Value Decomposition (SVD) & Low-Rank Compression

Not all matrices are square or diagonalizable. However, **every** real matrix $A \in \mathbb{R}^{m \times n}$ has a Singular Value Decomposition:

$$A = U \Sigma V^T$$

```
       A          =        U       *       Σ        *       V^T
   [ m x n ]            [ m x m ]       [ m x n ]        [ n x n ]
   
   +-------+            +---+---+       +-------+        +-------+
   |       |            |   |   |       |\      |        |-------|
   |       |     =      |   |   |   *   | \σ_i  |   *    |-------|
   |       |            |   |   |       |  \    |        |-------|
   +-------+            +---+---+       +-------+        +-------+
   Any Matrix           Left Singular    Singular Values  Right Singular
                        Vectors (AA^T)   (sorted σ1≥σ2)   Vectors (A^T A)
```

- $U \in \mathbb{R}^{m \times m}$: Orthogonal matrix of left singular vectors (eigenvectors of $A A^T$).
- $\Sigma \in \mathbb{R}^{m \times n}$: Diagonal matrix of singular values $\sigma_1 \ge \sigma_2 \ge \dots \ge \sigma_r > 0$.
- $V \in \mathbb{R}^{n \times n}$: Orthogonal matrix of right singular vectors (eigenvectors of $A^T A$).

### Eckart-Young-Mirsky Theorem (The Math of LoRA & Compression)
The best rank-$k$ approximation of matrix $A$ (under both Frobenius and spectral norms) is obtained by keeping only the top $k$ singular values:

$$A_k = \sum_{i=1}^k \sigma_i \mathbf{u}_i \mathbf{v}_i^T$$

The approximation error is simply the sum of discarded singular values:
$$\|A - A_k\|_F^2 = \sum_{i=k+1}^r \sigma_i^2$$

#### Modern AI Application: Low-Rank Adaptation (LoRA)
In a 70-billion parameter model like LLaMA-3, fine-tuning full weight matrices $W \in \mathbb{R}^{4096 \times 4096}$ requires updating $16.7$ million parameters per layer. 

LoRA approximates the weight update $\Delta W$ with rank $r = 8$:
$$\Delta W = B \cdot A, \quad B \in \mathbb{R}^{4096 \times 8}, \quad A \in \mathbb{R}^{8 \times 4096}$$
Number of parameters: $4096 \times 8 \times 2 = 65,536$ parameters ($99.6\%$ parameter reduction with virtually zero loss in quality!).

---

## 5. Tensors in Deep Learning: Shapes, Strides & Broadcasting

A **tensor** is an $N$-dimensional generalized array of numbers:
- **0D Tensor (Scalar):** $s \in \mathbb{R}$ — Loss value, learning rate.
- **1D Tensor (Vector):** $\mathbf{v} \in \mathbb{R}^d$ — Bias vector, single token embedding.
- **2D Tensor (Matrix):** $M \in \mathbb{R}^{B \times d}$ — Batch of feature vectors, linear projection weights.
- **3D Tensor (Sequence Batch):** $X \in \mathbb{R}^{B \times L \times d}$ — Batch size $B$, sequence length $L$, embedding dimension $d$ (LLM activations).
- **4D Tensor (Vision Feature Maps):** $X \in \mathbb{R}^{B \times C \times H \times W}$ — Batch, channels, height, width (CNNs, Diffusion U-Net).

### Memory Strides (Row-Major / C-Contiguous)
In computer RAM and GPU VRAM, physical memory is strictly flat 1D addresses. A multi-dimensional tensor is laid out in flat memory using **strides**:

$$\text{stride}_i = \prod_{j=i+1}^{D-1} \text{shape}_j$$

For a 2D tensor of shape $(3, 4)$ in row-major order:
- Moving down one row ($+1$ in dimension 0) jumps ahead by $4$ floats.
- Moving right one column ($+1$ in dimension 1) jumps ahead by $1$ float.
- Strides: `(4, 1)`.

### Broadcasting Rules in PyTorch and NumPy
Broadcasting allows operations between tensors of different shapes without copying data in memory:
1. Align shapes from right to left (trailing dimensions).
2. Two dimensions are compatible if they are **equal** or one of them is **1**.
3. Dimensions of size 1 are virtually stretched by setting their stride to 0!

**Example:**
- Tensor A: `(3, 1)`
- Tensor B: `(1, 4)`
- Result of $A + B$: `(3, 4)`. Stride for dimension 1 in $A$ is set to 0, allowing GPU SIMD lanes to compute element-wise sums with zero memory duplication.

> [!TIP]
> **Test SVD & Eigenvectors in the Interactive Lab:**
> Switch to the **Interactive 2D Lab** tab above to explore 2D point clouds, visualize principal singular axes, and watch rank-1 low-rank SVD compression project 2D data onto a 1D line in real time!
