# Module 02: Multivariate Calculus & Reverse-Mode Automatic Differentiation

Optimization is the lifeblood of modern deep learning. Every parameter update, loss minimization, and model convergence depends on calculus. But how does a framework like PyTorch calculate the exact partial derivatives of billions of parameters in a single backward pass? And why do transcendental functions like exponentials, logarithms, and sigmoids appear in nearly every neural activation and loss formula?

Let us master the mathematics of transcendental functions, core differentiation rules, Taylor series, gradients, Jacobians, Hessians, and build an intuitive, step-by-step understanding of reverse-mode automatic differentiation from first principles!

---

## 1. Transcendentals in Deep Learning ($e^x, \ln x, \sigma, \tanh$, Softplus)

In mathematics, a **transcendental function** is an analytic function that "transcends" finite polynomial algebra—it cannot be written as a finite sequence of additions, subtractions, multiplications, divisions, and root extractions of polynomials.

In deep learning, transcendentals are the workhorses of probability, activation gating, and loss normalization.

```
                      The Big Four Transcendentals in AI
                      
        Exponential e^x                      Natural Logarithm ln(x)
              y ^                                  y ^
                |     *                              |         /
                |    /                               |       /
                |   /                                |     /
                |  /                                 |   /
                | * (0, 1)                      -----+--*------> x
           -----+----------> x                       | (1,0)
                |                                    |
          (Softmax, Probs)                     (Losses, Surprise)
          
        Sigmoid σ(x)                         Hyperbolic Tangent tanh(x)
              y ^                                  y ^
            1.0 +-------*----                        |        *--- (+1)
                |      /                             |       /
            0.5 |  *  /                          ----+------*-----> x
                | /  *                               |     /
            0.0 +-*-----------> x                    | ---* (-1)
          (Binary Classification)              (Zero-Centered Hidden)
```

### 1. The Natural Exponential Function $e^x$ & $\exp(\mathbf{z})$
Euler's number $e = \lim_{n \to \infty} \left(1 + \frac{1}{n}\right)^n \approx 2.7182818$ is the only base whose derivative is **identical to itself**:

$$\frac{d}{dx} e^x = e^x$$

#### Why Deep Learning Uses $e^x$: The Softmax Function
To convert raw unconstrained neural network logits $\mathbf{z} \in \mathbb{R}^K$ into a valid probability distribution where $P_i \ge 0$ and $\sum P_i = 1$, we exponentiate and normalize:

$$\text{Softmax}(\mathbf{z})_i = \frac{e^{z_i}}{\sum_{j=1}^K e^{z_j}}$$

Because $e^x > 0$ for all real $x \in \mathbb{R}$, exponentiation guarantees all outputs are strictly positive probabilities.

#### Numerical Disaster & The Log-Sum-Exp Trick
In 32-bit floating-point arithmetic (IEEE 754), any number $x > 88.7$ overflows to $+\infty$ (`NaN`). If an LLM outputs logit $z_1 = 1000$, computing $e^{1000}$ crashes immediately.

To fix this, we use the identity for any constant $c$:
$$\sum_{j=1}^K e^{z_j} = \sum_{j=1}^K e^{z_j - c + c} = e^c \sum_{j=1}^K e^{z_j - c}$$
Taking the logarithm:
$$\ln\left(\sum_{j=1}^K e^{z_j}\right) = c + \ln\left(\sum_{j=1}^K e^{z_j - c}\right)$$

By setting $c = \max_j z_j$, every exponent $z_j - c \le 0$, which bounds $e^{z_j - c} \in (0, 1]$. **Catastrophic floating-point overflow is completely eliminated!**

---

### 2. The Natural Logarithm $\ln(x)$
The natural logarithm $\ln(x)$ is the inverse of the exponential: $\ln(e^x) = x$. Its derivative is:

$$\frac{d}{dx} \ln(x) = \frac{1}{x} \quad (x > 0)$$

#### Why Deep Learning Uses $\ln(x)$: Turning Products into Sums
In statistics, the likelihood of $N$ independent observations is a product of probabilities:
$$\mathcal{L}(\theta) = \prod_{i=1}^N P(x_i \mid \theta)$$
Multiplying thousands of probabilities $0.001 \times 0.002 \times \dots$ causes immediate **floating-point underflow** to $0.0$. Taking the natural logarithm converts the product into a stable sum:

$$\ln \mathcal{L}(\theta) = \sum_{i=1}^N \ln P(x_i \mid \theta)$$

This logarithmic formulation is the exact mathematical foundation of **Negative Log-Likelihood (NLL)** and **Cross-Entropy Loss**:

$$\mathcal{L}_{\text{CE}} = -\sum_{i=1}^K y_i \ln(\hat{y}_i)$$

---

### 3. The Logistic Sigmoid Function $\sigma(x)$
The sigmoid squashes any real number from $(-\infty, +\infty)$ into a clean probability range $(0, 1)$:

$$\sigma(x) = \frac{1}{1 + e^{-x}} = \frac{e^x}{e^x + 1}$$

#### Mathematical Derivation of $\sigma'(x)$
Using the power and chain rules:
$$\begin{aligned}
\frac{d}{dx} \sigma(x) &= \frac{d}{dx} (1 + e^{-x})^{-1} \\
&= -(1 + e^{-x})^{-2} \cdot (-e^{-x}) \\
&= \frac{e^{-x}}{(1 + e^{-x})^2} \\
&= \left(\frac{1}{1 + e^{-x}}\right) \left(\frac{e^{-x}}{1 + e^{-x}}\right) \\
&= \left(\frac{1}{1 + e^{-x}}\right) \left(\frac{1 + e^{-x} - 1}{1 + e^{-x}}\right) \\
&= \sigma(x) (1 - \sigma(x))
\end{aligned}$$

$$\sigma'(x) = \sigma(x)(1 - \sigma(x))$$

> [!WARNING]
> **The Vanishing Gradient Crisis:**
> Notice that $\sigma'(x)$ achieves its maximum value at $x = 0$, where $\sigma'(0) = 0.5(1 - 0.5) = 0.25$.
> When backpropagating through $L$ stacked sigmoid layers, gradients are multiplied by at least $0.25^L$. For a 10-layer network:
> $$0.25^{10} \approx 9.5 \times 10^{-7} \approx 0$$
> The gradients completely vanish before reaching the early layers, halting training!

---

### 4. Hyperbolic Tangent $\tanh(x)$
The hyperbolic tangent scales and shifts the sigmoid to produce zero-centered outputs in $(-1, 1)$:

$$\tanh(x) = \frac{e^x - e^{-x}}{e^x + e^{-x}} = 2\sigma(2x) - 1$$

Its derivative is:
$$\frac{d}{dx} \tanh(x) = 1 - \tanh^2(x)$$

Because its output is symmetric around zero ($\mathbb{E}[\tanh(x)] \approx 0$), it prevents systematic positive bias drift during gradient descent, which is why RNNs and LSTMs universally employ $\tanh$ for cell states.

---

### 5. Modern Transcendental Activations (GELU, SiLU & Softplus)
To prevent the vanishing gradient problem while preserving smooth non-linearities:

1. **Softplus:** A smooth approximation of $\text{ReLU}(x) = \max(0, x)$:
   $$\zeta(x) = \ln(1 + e^x)$$
   Its derivative is **exactly the sigmoid function**:
   $$\zeta'(x) = \frac{e^x}{1 + e^x} = \sigma(x)$$
2. **SiLU (Swish):** Used in LLaMA-3, Mistral, and Stable Diffusion:
   $$\text{SiLU}(x) = x \cdot \sigma(x)$$
3. **GELU (Gaussian Error Linear Unit):** Used in GPT-3, GPT-4, BERT, and Vision Transformers:
   $$\text{GELU}(x) = x \cdot P(X \le x) = x \cdot \frac{1}{2} \left[ 1 + \text{erf}\left(\frac{x}{\sqrt{2}}\right) \right] \approx x \cdot \sigma(1.702 x)$$
   Where $\text{erf}(z) = \frac{2}{\sqrt{\pi}}\int_0^z e^{-t^2} dt$ is the Gaussian error function.

---

## 2. Core Calculus Rules Cheat Sheet

Before differentiating computational graphs, let us review the five essential rules of single- and multi-variable calculus:

| Rule | Formula | Example |
| :--- | :--- | :--- |
| **Power Rule** | $\frac{d}{dx} x^n = n x^{n-1}$ | $\frac{d}{dx} x^3 = 3x^2$ |
| **Exponential Rule** | $\frac{d}{dx} e^{kx} = k e^{kx}$ | $\frac{d}{dx} e^{-2x} = -2e^{-2x}$ |
| **Logarithmic Rule** | $\frac{d}{dx} \ln(x) = \frac{1}{x}$ | $\frac{d}{dx} \ln(3x) = \frac{1}{x}$ |
| **Product Rule** | $\frac{d}{dx}[u(x) v(x)] = u' v + u v'$ | $\frac{d}{dx}[x e^x] = 1 \cdot e^x + x \cdot e^x = (1 + x)e^x$ |
| **Quotient Rule** | $\frac{d}{dx}\left[\frac{u}{v}\right] = \frac{u' v - u v'}{v^2}$ | $\frac{d}{dx}\left[\frac{\ln x}{x}\right] = \frac{(1/x)x - (\ln x)(1)}{x^2} = \frac{1 - \ln x}{x^2}$ |
| **Chain Rule** | $\frac{d}{dx}[f(g(x))] = f'(g(x)) \cdot g'(x)$ | $\frac{d}{dx}[\ln(x^2 + 1)] = \frac{1}{x^2 + 1} \cdot 2x = \frac{2x}{x^2 + 1}$ |

---

## 3. Taylor Series: The True Foundation of Optimization

Why does stepping in the direction $-\nabla \mathcal{L}$ decrease the loss? The mathematical justification comes from **Taylor's Theorem**.

Any sufficiently smooth function can be approximated near a point $x_0$ by an infinite polynomial of its derivatives:

$$f(x) = f(x_0) + f'(x_0)(x - x_0) + \frac{1}{2!} f''(x_0)(x - x_0)^2 + \frac{1}{3!} f'''(x_0)(x - x_0)^3 + \dots$$

### Multivariable Taylor Expansion
For a loss function $\mathcal{L}(\mathbf{w})$ with parameter vector $\mathbf{w} \in \mathbb{R}^d$:

$$\mathcal{L}(\mathbf{w}_0 + \Delta \mathbf{w}) \approx \underbrace{\mathcal{L}(\mathbf{w}_0)}_{\text{Zero-Order}} + \underbrace{\nabla \mathcal{L}(\mathbf{w}_0)^T \Delta \mathbf{w}}_{\text{First-Order (Linear Slope)}} + \underbrace{\frac{1}{2} \Delta \mathbf{w}^T H(\mathbf{w}_0) \Delta \mathbf{w}}_{\text{Second-Order (Curvature / Hessian)}} + \mathcal{O}(\|\Delta \mathbf{w}\|^3)$$

### First-Order Optimization: Gradient Descent
If we only consider the first-order approximation:
$$\Delta \mathcal{L} \approx \nabla \mathcal{L}(\mathbf{w}_0)^T \Delta \mathbf{w} = \|\nabla \mathcal{L}(\mathbf{w}_0)\|_2 \|\Delta \mathbf{w}\|_2 \cos(\theta)$$
To make the change in loss $\Delta \mathcal{L}$ as negative as possible, we choose $\theta = 180^\circ$ ($\cos\theta = -1$).
Therefore, the optimal update step is pointing strictly opposite to the gradient:

$$\Delta \mathbf{w} = -\eta \nabla \mathcal{L}(\mathbf{w}_0) \implies \mathbf{w}_{t+1} = \mathbf{w}_t - \eta \nabla \mathcal{L}(\mathbf{w}_t)$$

### Second-Order Optimization: Newton's Method
If we keep the second-order quadratic term:
$$\mathcal{L}(\mathbf{w}_0 + \Delta \mathbf{w}) \approx \mathcal{L}(\mathbf{w}_0) + \nabla \mathcal{L}(\mathbf{w}_0)^T \Delta \mathbf{w} + \frac{1}{2} \Delta \mathbf{w}^T H \Delta \mathbf{w}$$
Differentiating with respect to $\Delta \mathbf{w}$ and setting the derivative to zero:
$$\nabla_{\Delta \mathbf{w}} = \nabla \mathcal{L}(\mathbf{w}_0) + H \Delta \mathbf{w} = \mathbf{0} \implies \Delta \mathbf{w} = -H^{-1} \nabla \mathcal{L}(\mathbf{w}_0)$$

Newton's method automatically adjusts step sizes along steep directions and flat directions using the inverse Hessian curvature matrix $H^{-1}$.

---

## 4. Scalar Fields, Gradients & Steepest Descent

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

## 5. The Jacobian and Hessian Matrices

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

## 6. The Multivariate Chain Rule

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

## 7. How Reverse-Mode Autodiff (Backprop) Works

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
