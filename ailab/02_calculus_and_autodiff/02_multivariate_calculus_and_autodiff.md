# Module 02: Multivariate Calculus & Reverse-Mode Automatic Differentiation

Optimization is the lifeblood of modern deep learning. Every parameter update, loss minimization, and model convergence depends on gradients. But how does a framework like PyTorch calculate the exact partial derivatives of billions of parameters in a single backward pass? 

Let us master the mathematics of scalar fields, gradients, Jacobians, Hessians, and build an intuitive, step-by-step understanding of reverse-mode automatic differentiation from first principles!

---

## 1. Scalar Fields, Gradients & Steepest Descent

Let $f: \mathbb{R}^d \to \mathbb{R}$ be a scalar-valued function (such as a loss function $\mathcal{L}(\mathbf{w})$).

The partial derivative with respect to variable $w_i$ measures the instantaneous rate of change along coordinate axis $i$:

$$\frac{\partial f}{\partial w_i} = \lim_{h \to 0} \frac{f(w_1, \dots, w_i + h, \dots, w_d) - f(w_1, \dots, w_i, \dots, w_d)}{h}$$

### The Gradient Vector
The gradient $\nabla f(\mathbf{w})$ packages all $d$ partial derivatives into a single vector in $\mathbb{R}^d$:

$$\nabla f(\mathbf{w}) = \begin{bmatrix} \frac{\partial f}{\partial w_1} \\ \frac{\partial f}{\partial w_2} \\ \vdots \\ \frac{\partial f}{\partial w_d} \end{bmatrix}$$

```
                Geometric Meaning of the Gradient Vector
                
         w2 ^
            |          Contours of Loss L(w1, w2)
            |              /-------\
            |             /  /---\  \
            |            |  |  *  |  |  (Minimum at center)
            |             \  \---/  /
            |          -∇L \       / ∇L (Steepest Ascent)
            |       <-------*------>
            |       (Steepest Descent)
            +---------------------------------> w1
```

**Two Core Geometric Properties:**
1. **Direction of Steepest Ascent:** The gradient vector $\nabla f(\mathbf{w})$ points perpendicular to the level curves (contours) of $f$, in the exact direction where the function increases most rapidly.
2. **Rate of Ascent:** The Euclidean length $\|\nabla f(\mathbf{w})\|_2$ is the slope in that steepest direction.
3. **Steepest Descent:** To minimize the loss, we step in the **opposite direction**: $-\nabla f(\mathbf{w})$.

### Step-by-Step Numerical Example
Consider the loss function:
$$f(x, y) = x^2 y + 3y^2$$

At the point $(x_0 = 2, y_0 = 1)$:
1. **Compute Partial Derivatives:**
   $$\frac{\partial f}{\partial x} = 2xy \implies \frac{\partial f}{\partial x}(2, 1) = 2(2)(1) = 4$$
   $$\frac{\partial f}{\partial y} = x^2 + 6y \implies \frac{\partial f}{\partial y}(2, 1) = 2^2 + 6(1) = 4 + 6 = 10$$
2. **Gradient Vector:**
   $$\nabla f(2, 1) = \begin{bmatrix} 4 \\ 10 \end{bmatrix}$$
3. **Gradient Descent Update with Learning Rate $\eta = 0.1$:**
   $$\begin{bmatrix} x_{\text{new}} \\ y_{\text{new}} \end{bmatrix} = \begin{bmatrix} 2 \\ 1 \end{bmatrix} - 0.1 \begin{bmatrix} 4 \\ 10 \end{bmatrix} = \begin{bmatrix} 2 - 0.4 \\ 1 - 1.0 \end{bmatrix} = \begin{bmatrix} 1.6 \\ 0.0 \end{bmatrix}$$
4. **Evaluate Loss Reduction:**
   $$f(2, 1) = 2^2(1) + 3(1^2) = 4 + 3 = 7$$
   $$f(1.6, 0.0) = (1.6)^2(0) + 3(0^2) = 0$$
   The single step reduced the function value from $7.0$ all the way to $0.0$!

---

## 2. The Jacobian and Hessian Matrices

### The Jacobian Matrix (Vector-to-Vector Transformations)
When a function transforms an $n$-dimensional vector into an $m$-dimensional vector $\mathbf{f}: \mathbb{R}^n \to \mathbb{R}^m$ (such as an activation layer in a neural network):

$$J = \begin{bmatrix}
\frac{\partial f_1}{\partial x_1} & \frac{\partial f_1}{\partial x_2} & \cdots & \frac{\partial f_1}{\partial x_n} \\
\frac{\partial f_2}{\partial x_1} & \frac{\partial f_2}{\partial x_2} & \cdots & \frac{\partial f_2}{\partial x_n} \\
\vdots & \vdots & \ddots & \vdots \\
\frac{\partial f_m}{\partial x_1} & \frac{\partial f_m}{\partial x_2} & \cdots & \frac{\partial f_m}{\partial x_n}
\end{bmatrix} \in \mathbb{R}^{m \times n}$$

The Jacobian represents the best linear approximation of $\mathbf{f}$ near point $\mathbf{x}$:
$$\Delta \mathbf{f} \approx J \Delta \mathbf{x}$$

### The Hessian Matrix (Second-Order Curvature)
For a scalar loss function $f: \mathbb{R}^n \to \mathbb{R}$, the Hessian contains all second-order partial derivatives:

$$H_{ij} = \frac{\partial^2 f}{\partial x_i \partial x_j} \in \mathbb{R}^{n \times n}$$

By Schwarz's theorem (symmetry of second derivatives), $H$ is a symmetric matrix ($H = H^T$).
Its eigenvalues reveal the local geometry of the loss landscape:

```
               Hessian Eigenvalue Classification
               
      Local Minimum (Bowl)       Local Maximum (Peak)          Saddle Point
         (All λ_i > 0)              (All λ_i < 0)           (Mixed: λ1 > 0 > λ2)
               \   /                      / \                      \   /
                \_/                      /   \                      \_/ (curves up)
                                                                    / \ (curves down)
```

1. **Positive Definite ($H \succ 0$, all $\lambda_i > 0$):** Local Minimum (bowl shape, gradient descent converges).
2. **Negative Definite ($H \prec 0$, all $\lambda_i < 0$):** Local Maximum (peak).
3. **Indefinite (Mixed positive & negative eigenvalues):** **Saddle Point.**
   - In 70-billion-parameter LLMs, local minima are rare; almost all stationary points ($\nabla f = \mathbf{0}$) are high-dimensional saddle points!

---

## 3. The Multivariate Chain Rule

Let $z = f(y_1, y_2)$ where each $y_i = g_i(x)$.
The total change in $x$ propagates to $z$ through all intermediate paths:

$$\frac{d z}{d x} = \frac{\partial z}{\partial y_1} \frac{d y_1}{d x} + \frac{\partial z}{\partial y_2} \frac{d y_2}{d x} = \sum_{i} \frac{\partial z}{\partial y_i} \frac{d y_i}{d x}$$

```
                Forward Pass                      Backward Pass (Adjoints)
                     x                                       x
                   /   \                                   ^   ^
                  /     \                                 /     \  ∂y_i/∂x
                 v       v                               /       \
                y1       y2                             y1       y2
                 \       /                               ^       ^
                  \     /                                 \     /  ∂z/∂y_i
                   v   v                                   \   /
                     z                                       z  (seed = 1.0)
```

In matrix form:
$$\nabla_{\mathbf{x}} z = J_{\mathbf{y}}(\mathbf{x})^T \nabla_{\mathbf{y}} z$$

Notice the **transpose** $J^T$! That transpose is why reverse-mode autodiff works from right to left.

---

## 4. How Reverse-Mode Autodiff (Backprop) Works

Why don't deep learning frameworks use numerical differentiation $\frac{f(x+h) - f(x)}{h}$?
- For a model with $N = 70,000,000,000$ parameters, numerical differentiation requires **$70$ billion forward passes** just to take ONE single optimization step!
- Symbolic differentiation causes algebraic expression explosion.

### The Reverse-Mode Breakthrough (Two Passes Only!)
Reverse-mode automatic differentiation computes the exact gradients for **all $N$ parameters simultaneously** in just **one forward pass and one backward pass**!

1. **Forward Pass:** Evaluate each operation from input variables to the scalar loss $L$, storing intermediate activations.
2. **Backward Pass:** Traverse the Directed Acyclic Graph (DAG) in **reverse topological order**, initializing the seed adjoint $\bar{L} \equiv \frac{\partial L}{\partial L} = 1.0$, and accumulating incoming derivatives:

$$\bar{x} \equiv \frac{\partial L}{\partial x} = \sum_{c \in \text{children}(x)} \bar{c} \cdot \frac{\partial c}{\partial x}$$

### Complete Numeric DAG Walkthrough
Let us trace the computation graph for:
$$z = (x + y) \times (y - 2)$$
With inputs $x = 3, y = 4$.

#### 1. Forward Pass:
- Node 1: $u = x + y = 3 + 4 = \mathbf{7}$
- Node 2: $v = y - 2 = 4 - 2 = \mathbf{2}$
- Node 3 (Output): $z = u \times v = 7 \times 2 = \mathbf{14}$

#### 2. Backward Pass:
- Seed: $\bar{z} = \frac{\partial z}{\partial z} = \mathbf{1.0}$
- Adjoint of $u$: $\bar{u} = \bar{z} \cdot \frac{\partial z}{\partial u} = 1.0 \times v = 1.0 \times 2 = \mathbf{2.0}$
- Adjoint of $v$: $\bar{v} = \bar{z} \cdot \frac{\partial z}{\partial v} = 1.0 \times u = 1.0 \times 7 = \mathbf{7.0}$
- Adjoint of $x$: $\bar{x} = \bar{u} \cdot \frac{\partial u}{\partial x} = 2.0 \times 1 = \mathbf{2.0}$
- Adjoint of $y$ (Accumulates from both $u$ and $v$!):
  $$\bar{y} = \bar{u} \cdot \frac{\partial u}{\partial y} + \bar{v} \cdot \frac{\partial v}{\partial y} = (2.0 \times 1) + (7.0 \times 1) = 2.0 + 7.0 = \mathbf{9.0}$$

**Final exact gradients computed in one backward sweep:**
$$\frac{\partial z}{\partial x} = 2.0, \quad \frac{\partial z}{\partial y} = 9.0$$

Verification by hand:
$$z(x, y) = xy - 2x + y^2 - 2y$$
$$\frac{\partial z}{\partial x} = y - 2 = 4 - 2 = 2.0 \quad \checkmark$$
$$\frac{\partial z}{\partial y} = x + 2y - 2 = 3 + 2(4) - 2 = 3 + 8 - 2 = 9.0 \quad \checkmark$$

This elegant graph traversal powers `torch.autograd`, JAX, and every modern AI framework on Earth.
