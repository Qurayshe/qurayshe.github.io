# Module 02: Multivariate Calculus & Reverse-Mode Automatic Differentiation

Optimization is the lifeblood of modern deep learning. Every parameter update, loss minimization, and model convergence depends on gradients. But how does a framework like PyTorch calculate the exact partial derivatives of billions of parameters in a single backward pass? Let's build a reverse-mode automatic differentiation engine from first principles! (•̀ᴗ•́)و

---

## 1. Scalar Fields & Gradients

Let $f: \mathbb{R}^d \to \mathbb{R}$ be a scalar-valued function (e.g. the loss function $\mathcal{L}(\mathbf{w})$).
The partial derivative with respect to variable $w_i$ measures the instantaneous rate of change along coordinate axis $i$:

$$\frac{\partial f}{\partial w_i} = \lim_{h \to 0} \frac{f(w_1, \dots, w_i + h, \dots, w_d) - f(w_1, \dots, w_i, \dots, w_d)}{h}$$

### The Gradient Vector
The gradient $\nabla f(\mathbf{w})$ packages all partial derivatives into a vector in $\mathbb{R}^d$:

$$\nabla f(\mathbf{w}) = \begin{bmatrix} \frac{\partial f}{\partial w_1} \\ \frac{\partial f}{\partial w_2} \\ \vdots \\ \frac{\partial f}{\partial w_d} \end{bmatrix}$$

**Geometric Key Property:**
- The gradient $\nabla f(\mathbf{w})$ points in the direction of **steepest ascent** of $f$.
- Its magnitude $\|\nabla f(\mathbf{w})\|$ is the rate of increase in that direction.
- Therefore, **steepest descent** moves in the direction $-\nabla f(\mathbf{w})$!

---

## 2. The Jacobian and Hessian Matrices

### The Jacobian Matrix (Vector-to-Vector Mappings)
If a function transforms vectors to vectors $\mathbf{f}: \mathbb{R}^n \to \mathbb{R}^m$ (e.g. a neural network layer mapping $n$ inputs to $m$ activations):

$$J = \begin{bmatrix}
\frac{\partial f_1}{\partial x_1} & \cdots & \frac{\partial f_1}{\partial x_n} \\
\vdots & \ddots & \vdots \\
\frac{\partial f_m}{\partial x_1} & \cdots & \frac{\partial f_m}{\partial x_n}
\end{bmatrix} \in \mathbb{R}^{m \times n}$$

### The Hessian Matrix (Second-Order Curvature)
For twice-differentiable scalar functions $f: \mathbb{R}^n \to \mathbb{R}$:

$$H_{ij} = \frac{\partial^2 f}{\partial x_i \partial x_j} \in \mathbb{R}^{n \times n}$$

- If $H \succ 0$ (Positive Definite, all $\lambda_i > 0$): Local minimum (bowl shape).
- If $H \prec 0$ (Negative Definite, all $\lambda_i < 0$): Local maximum.
- If $H$ has both positive and negative eigenvalues: **Saddle point** (ubiquitous in high-dimensional deep learning loss landscapes).

---

## 3. The Multivariate Chain Rule

Let $z = f(y_1, y_2, \dots, y_k)$ where each $y_i = g_i(x_1, \dots, x_n)$.
The change in $x_j$ propagates to $z$ through all intermediate paths:

$$\frac{\partial z}{\partial x_j} = \sum_{i=1}^k \frac{\partial z}{\partial y_i} \frac{\partial y_i}{\partial x_j}$$

```
                z
              / | \
             /  |  \   (∂z / ∂y_i)
            v   v   v
           y1   y2  y3
            \   |   /  (∂y_i / ∂x)
             \  |  /
              v v v
                x
```

In matrix notation:
$$\frac{\partial z}{\partial \mathbf{x}} = J_{\mathbf{y}}(\mathbf{x})^T \nabla_{\mathbf{y}} z$$

---

## 4. How Reverse-Mode Autodiff Works

Why don't we use numerical differentiation (finite differences)?
- Numerical approximation: $\frac{f(x+h) - f(x)}{h}$ requires $d + 1$ forward evaluations for $d$ parameters. For a 70-billion parameter LLM, one gradient step would require 70 billion forward passes!
- Symbolic differentiation: Leads to combinatorial expression explosion.

### The Reverse-Mode Breakthrough (Backpropagation)
Reverse-mode autodiff evaluates gradients with only **two passes**:
1. **Forward Pass:** Compute values along the directed acyclic graph (DAG) from inputs to output loss $L$. Store local partial derivatives.
2. **Backward Pass:** Traverse the DAG in **reverse topological order**, initializing $\frac{\partial L}{\partial L} = 1.0$, and accumulating adjoints via the chain rule:

$$\bar{x}_j \equiv \frac{\partial L}{\partial x_j} = \sum_{c \in \text{children}(x_j)} \bar{c} \cdot \frac{\partial c}{\partial x_j}$$

Because the scalar output $L$ is fixed at the end, a single backward pass computes all $\frac{\partial L}{\partial w_i}$ simultaneously in $O(\text{Cost of Forward Pass})$ time!

> [!TIP]
> This exact mechanism is the engine powering `torch.autograd`, JAX, and TensorFlow. Every custom neural network layer is simply a node implementing `forward` and `backward`.

