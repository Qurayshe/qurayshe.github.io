# Module 06: Support Vector Machines & The Kernel Trick

Before deep learning dominated the 2010s, **Support Vector Machines (SVMs)** represented the pinnacle of mathematical elegance in machine learning. By framing classification as convex quadratic programming with maximum geometric margin, Vladimir Vapnik solved generalization bounds and introduced the celebrated **Kernel Trick** to project non-linear data into infinite dimensions! ️

---

## 1. Maximum Margin Classification

Given linearly separable points $(\mathbf{x}_i, y_i)$ with $y_i \in \{-1, +1\}$, infinitely many hyperplanes $\mathbf{w}^T \mathbf{x} + b = 0$ can separate the classes. Which one generalizes best to unseen test data?

The one that **maximizes the margin $\gamma$** (the distance from the decision boundary to the closest training points—the **Support Vectors**).

```
                 x2 ^
                    |      (+)      (+)
                    |         \   /
      Margin γ  <---|---> [ w^T x + b = +1 ] (Support Vector)
                    |       \   /
                    |    [ w^T x + b = 0 ]   (Decision Boundary)
                    |       /   \
      Margin γ  <---|---> [ w^T x + b = -1 ] (Support Vector)
                    |     (o)     \
                    +---------------------> x1
```

The geometric distance of any point $\mathbf{x}_i$ to the hyperplane is:
$$\text{dist}(\mathbf{x}_i) = \frac{y_i (\mathbf{w}^T \mathbf{x}_i + b)}{\|\mathbf{w}\|_2}$$

Setting the functional margin on support vectors to $1$, the total margin width is:
$$\text{Margin Width} = \frac{2}{\|\mathbf{w}\|_2}$$

Maximizing $\frac{2}{\|\mathbf{w}\|}$ is mathematically equivalent to minimizing $\frac{1}{2} \|\mathbf{w}\|^2$!

---

## 2. Primal & Dual Lagrangian Formulations

### The Primal Optimization Problem
$$\min_{\mathbf{w}, b} \frac{1}{2} \|\mathbf{w}\|_2^2 \quad \text{subject to } y_i (\mathbf{w}^T \mathbf{x}_i + b) \ge 1, \quad \forall i$$

### The Wolfe Dual Problem
Introducing Lagrange multipliers $\alpha_i \ge 0$, the Karush-Kuhn-Tucker (KKT) stationarity conditions reveal:

$$\mathbf{w} = \sum_{i=1}^N \alpha_i y_i \mathbf{x}_i$$

Notice that $\mathbf{w}$ is entirely determined by a linear combination of samples where $\alpha_i > 0$ (the support vectors)!

Substituting into the Lagrangian gives the **Dual Problem**:

$$\max_{\boldsymbol{\alpha}} \sum_{i=1}^N \alpha_i - \frac{1}{2} \sum_{i=1}^N \sum_{j=1}^N \alpha_i \alpha_j y_i y_j (\mathbf{x}_i \cdot \mathbf{x}_j)$$
$$\text{subject to } \alpha_i \ge 0 \quad \text{and} \quad \sum_{i=1}^N \alpha_i y_i = 0$$

> [!IMPORTANT]
> Notice that the inputs $\mathbf{x}_i$ and $\mathbf{x}_j$ appear **only as inner products $\langle \mathbf{x}_i, \mathbf{x}_j \rangle$**! This exact realization unlocks the Kernel Trick!

---

## 3. The Kernel Trick (Mercer's Theorem)

What if the data is not linearly separable (like concentric circles or XOR)?
Map the data into a higher-dimensional feature space $\phi(\mathbf{x}) \in \mathbb{R}^D$ where it becomes linearly separable:

$$\mathbf{x} \in \mathbb{R}^2 \xrightarrow{\phi} \phi(\mathbf{x}) \in \mathbb{R}^D$$

Explicitly computing $\phi(\mathbf{x})$ in high (or infinite) dimensions is computationally intractable.
The **Kernel Trick** replaces the inner product $\phi(\mathbf{x}_i) \cdot \phi(\mathbf{x}_j)$ with an efficient kernel function $K(\mathbf{x}_i, \mathbf{x}_j)$:

$$K(\mathbf{x}_i, \mathbf{x}_j) = \langle \phi(\mathbf{x}_i), \phi(\mathbf{x}_j) \rangle$$

### Common Kernels:
1. **Linear:** $K(\mathbf{x}, \mathbf{z}) = \mathbf{x}^T \mathbf{z}$
2. **Polynomial:** $K(\mathbf{x}, \mathbf{z}) = (\mathbf{x}^T \mathbf{z} + c)^d$
3. **Radial Basis Function (RBF / Gaussian):**
   $$K(\mathbf{x}, \mathbf{z}) = \exp\left(-\gamma \|\mathbf{x} - \mathbf{z}\|^2\right)$$

The RBF kernel corresponds to an inner product in an **infinite-dimensional Hilbert space**! A finite dataset in $\mathbb{R}^2$ can be separated seamlessly without ever calculating infinite coordinates!

