# Module 01: Linear Algebra & Tensor Foundations for AI

Machine learning is geometry in hyper-dimensional spaces. Every dataset is a matrix of coordinates, every neural network layer is an affine geometric transformation, and every embedding is a vector pointed in semantic space. Let's master the mathematical machinery from the ground up! (⌐■_■)

---

## 1. Vectors, Vector Spaces & Inner Products

A vector $\mathbf{x} \in \mathbb{R}^d$ represents a point or directed displacement in a $d$-dimensional Euclidean space:

$$\mathbf{x} = \begin{bmatrix} x_1 \\ x_2 \\ \vdots \\ x_d \end{bmatrix}$$

### The Dot Product (Inner Product)
The dot product between two vectors $\mathbf{u}, \mathbf{v} \in \mathbb{R}^d$ measures directional alignment:

$$\langle \mathbf{u}, \mathbf{v} \rangle = \mathbf{u}^T \mathbf{v} = \sum_{i=1}^d u_i v_i = \|\mathbf{u}\|_2 \|\mathbf{v}\|_2 \cos(\theta)$$

```
        u
        ^
        |     . (Projection of u onto v)
        |    /|
        |   / |
        |  /  |
        | /   |
        +-----+------> v
           ||u|| cos(θ)
```

- If $\mathbf{u} \cdot \mathbf{v} = 0$, the vectors are **orthogonal** ($\theta = 90^\circ$).
- If $\mathbf{u} \cdot \mathbf{v} > 0$, they point in roughly the same direction.
- If $\mathbf{u} \cdot \mathbf{v} < 0$, they point in opposing directions.

### Vector Norms
Norms measure the length or magnitude of vectors:
1. **$L_1$ Norm (Manhattan):** $\|\mathbf{x}\|_1 = \sum_{i=1}^d |x_i|$ (encourages sparsity in ML models like Lasso).
2. **$L_2$ Norm (Euclidean):** $\|\mathbf{x}\|_2 = \sqrt{\sum_{i=1}^d x_i^2} = \sqrt{\mathbf{x}^T \mathbf{x}}$ (standard distance metric and Ridge regularizer).
3. **$L_\infty$ Norm (Max):** $\|\mathbf{x}\|_\infty = \max_i |x_i|$ (adversarial perturbation bounds).

### Cosine Similarity
$$\text{CosineSim}(\mathbf{u}, \mathbf{v}) = \frac{\mathbf{u} \cdot \mathbf{v}}{\|\mathbf{u}\|_2 \|\mathbf{v}\|_2}$$
Critical in embedding models (e.g. vector search, retrieval-augmented generation RAG, sentence transformers) because it compares semantic direction independent of document or embedding length.

---

## 2. Matrices as Linear Transformations

A matrix $A \in \mathbb{R}^{m \times n}$ maps vectors from $\mathbb{R}^n$ into $\mathbb{R}^m$:

$$f(\mathbf{x}) = A\mathbf{x}$$

Linear transformations preserve vector addition and scalar multiplication:
$$A(\alpha \mathbf{u} + \beta \mathbf{v}) = \alpha A\mathbf{u} + \beta A\mathbf{v}$$

### Matrix Multiplication: Four Perspectives
When computing $C = AB$ where $A \in \mathbb{R}^{m \times k}$ and $B \in \mathbb{R}^{k \times n}$:
1. **Entry-wise:** $C_{ij} = \sum_r A_{ir} B_{rj}$ (dot product of row $i$ and column $j$).
2. **Column-wise:** Each column of $C$ is a linear combination of the columns of $A$.
3. **Row-wise:** Each row of $C$ is a linear combination of the rows of $B$.
4. **Outer-product sum:** $C = \sum_{r=1}^k \mathbf{a}_r \mathbf{b}_r^T$ (sum of rank-1 matrices).

> [!NOTE]
> In Transformer Multi-Head Attention and LoRA (Low-Rank Adaptation), the **outer-product perspective** is central: low-rank approximations represent weight updates as the sum of a few rank-1 outer products!

---

## 3. Eigenvalues and Eigenvectors

For a square matrix $A \in \mathbb{R}^{n \times n}$, a non-zero vector $\mathbf{v}$ is an **eigenvector** if multiplying by $A$ only scales $\mathbf{v}$ by a factor $\lambda$ (the **eigenvalue**):

$$A \mathbf{v} = \lambda \mathbf{v} \iff (A - \lambda I) \mathbf{v} = \mathbf{0}$$

Eigenvalues are the roots of the characteristic equation $\det(A - \lambda I) = 0$.

### Eigendecomposition
If $A$ has $n$ linearly independent eigenvectors $\mathbf{v}_1, \dots, \mathbf{v}_n$, then:

$$A = V \Lambda V^{-1}$$

Where $V = [\mathbf{v}_1 \dots \mathbf{v}_n]$ and $\Lambda = \text{diag}(\lambda_1, \dots, \lambda_n)$.
For symmetric matrices ($A = A^T$, such as covariance matrices in PCA), the spectral theorem guarantees real eigenvalues and orthonormal eigenvectors ($V^{-1} = V^T$):

$$A = V \Lambda V^T = \sum_{i=1}^n \lambda_i \mathbf{v}_i \mathbf{v}_i^T$$

---

## 4. Singular Value Decomposition (SVD)

Not all matrices are square or diagonalizable, but **any** real matrix $A \in \mathbb{R}^{m \times n}$ has a Singular Value Decomposition:

$$A = U \Sigma V^T$$

Where:
- $U \in \mathbb{R}^{m \times m}$ is an orthogonal matrix of left-singular vectors (eigenvectors of $A A^T$).
- $\Sigma \in \mathbb{R}^{m \times n}$ is a diagonal matrix containing singular values $\sigma_1 \ge \sigma_2 \ge \dots \ge \sigma_r > 0$.
- $V \in \mathbb{R}^{n \times n}$ is an orthogonal matrix of right-singular vectors (eigenvectors of $A^T A$).

```
       A          =       U        *       Σ        *       V^T
   [ m x n ]           [ m x m ]        [ m x n ]        [ n x n ]
   
   +-------+           +---+---+        +-------+        +-------+
   |       |           |   |   |        |\      |        |-------|
   |       |    =      |   |   |   *    | \σ_i  |   *    |-------|
   |       |           |   |   |        |  \    |        |-------|
   +-------+           +---+---+        +-------+        +-------+
```

### Eckart-Young-Mirsky Theorem & Low-Rank Approximation
The best rank-$k$ approximation of $A$ (under both Frobenius and spectral norms) is truncated SVD:

$$A_k = \sum_{i=1}^k \sigma_i \mathbf{u}_i \mathbf{v}_i^T$$

This fundamental result underpins:
1. **Principal Component Analysis (PCA)** for dimensionality reduction.
2. **Latent Semantic Analysis (LSA)** in natural language processing.
3. **Low-Rank Adaptation (LoRA)** parameter updates in modern Large Language Models.

---

## 5. Tensors in Deep Learning

A tensor is an $N$-dimensional multidimensional array:
- **0D Tensor:** Scalar ($s \in \mathbb{R}$) — Loss, learning rate.
- **1D Tensor:** Vector ($\mathbf{v} \in \mathbb{R}^d$) — Bias vector, single token embedding.
- **2D Tensor:** Matrix ($M \in \mathbb{R}^{B \times d}$) — Batch of embeddings, linear weights.
- **3D Tensor:** Sequence batch ($T \in \mathbb{R}^{B \times L \times d}$) — Batch size $B$, sequence length $L$, hidden dimension $d$.
- **4D Tensor:** Image batch ($X \in \mathbb{R}^{B \times C \times H \times W}$) — Vision feature maps.

Understanding tensor shapes, strides, and contiguous memory layouts is the bridge between pure math and high-performance PyTorch/CUDA kernels.

