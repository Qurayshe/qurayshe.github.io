# Module 00c: Differential Equations, Numerical Solvers & Dynamical Systems

Modern deep learning is increasingly understood not as static stacks of isolated discrete layers, but as continuous dynamical systems. In 2018, Ricky Chen and David Duvenaud introduced **Neural Ordinary Differential Equations (Neural ODEs)**, demonstrating that Residual Networks (ResNets) are literally Euler discretizations of continuous-time differential equations. 

Today, frontier generative AI (Stable Diffusion 3, Flux, Flow Matching) formulates high-resolution image and video synthesis as solving ordinary differential equations along continuous probability transport trajectories.

Let us explore the core mathematics of differential equations, numerical integrators, phase portraits, and continuous gradient flow from first principles.

---

## 1. What is an Ordinary Differential Equation? (The Velocity Compass)

An **Ordinary Differential Equation (ODE)** describes how a system evolves over time by relating an unknown state function $\mathbf{y}(t)$ to its instantaneous rate of change (derivative) with respect to an independent variable $t$:

$$\frac{d\mathbf{y}}{dt} = \mathbf{f}(t, \mathbf{y}(t)), \quad \mathbf{y}(t_0) = \mathbf{y}_0$$

```
   State Space (y)
         ^          Vector Field f(t, y) assigns an arrow at every coordinate
         |          /  /  /  /  /  /
         |         /  /  /  /  /  /
         |        ----------------> Trajectory y(t) smooth curve tangent to arrows
         |       /  /  /  /  /  /
         +----------------------------> Time (t)
```

- $t \in \mathbb{R}$: Independent variable (usually time, or layer depth in deep learning).
- $\mathbf{y}(t) \in \mathbb{R}^d$: State vector of the system (e.g., token activations, particle coordinates, or model weights).
- $\mathbf{f}(t, \mathbf{y}) \in \mathbb{R}^d$: **Vector field** acting as a directional compass, dictating which direction and how fast the state moves at any given instant.
- $\mathbf{y}_0$: Initial boundary condition at $t = t_0$.

### Analytical Solution via Separation of Variables
Consider a simple linear decay equation with rate parameter $k = 2$ and initial condition $y(0) = 1$:

$$\frac{dy}{dt} = -2y$$

1. **Separate Variables:** Move all $y$ terms to the left and $t$ terms to the right:
   $$\frac{1}{y} dy = -2 \, dt$$
2. **Integrate Both Sides:**
   $$\int \frac{1}{y} dy = \int -2 \, dt \implies \ln|y| = -2t + C$$
3. **Exponentiate:**
   $$y(t) = e^{-2t + C} = A e^{-2t}$$
4. **Apply Initial Condition $y(0) = 1$:**
   $$y(0) = A e^0 = A = 1 \implies y(t) = e^{-2t}$$

While this clean exponential decay admits a simple closed-form pencil-and-paper solution, real-world systems (and deep neural networks) possess non-linear vector fields $\mathbf{f}(t, \mathbf{y})$ that have no closed-form integral. We must use numerical solvers!

---

## 2. Numerical Solvers: Forward Euler vs Runge-Kutta 4 (RK4)

To solve an ODE on a digital computer, we discretize continuous time into small discrete steps of size $h = \Delta t$:

$$t_0, \quad t_1 = t_0 + h, \quad t_2 = t_0 + 2h, \quad \dots, \quad t_n = t_0 + n h$$

### 1. Forward Euler Method (First-Order)
The simplest numerical integrator approximates the continuous derivative with a forward finite difference:

$$\frac{\mathbf{y}_{n+1} - \mathbf{y}_n}{h} \approx \mathbf{f}(t_n, \mathbf{y}_n) \implies \mathbf{y}_{n+1} = \mathbf{y}_n + h \, \mathbf{f}(t_n, \mathbf{y}_n)$$

- **How it works:** Look at the slope at the current point, assume the slope remains perfectly constant for time $h$, and take a straight-line step.
- **Local Error:** $O(h^2)$ per step.
- **Global Error:** $O(h)$ over $N$ steps.
- **Flaw:** If the curve bends, Euler overshoots. Large step sizes cause explosive instability.

### 2. Classical Runge-Kutta 4th-Order (RK4)
RK4 achieves fourth-order accuracy ($O(h^4)$) by sampling the slope four times across the interval (at the start, twice at the midpoint, and at the end) and taking a Simpson's-rule weighted average:

$$\begin{aligned}
\mathbf{k}_1 &= \mathbf{f}(t_n, \mathbf{y}_n) && \text{(Slope at start)} \\
\mathbf{k}_2 &= \mathbf{f}\left(t_n + \frac{h}{2}, \; \mathbf{y}_n + \frac{h}{2}\mathbf{k}_1\right) && \text{(Midpoint slope via } k_1\text{)} \\
\mathbf{k}_3 &= \mathbf{f}\left(t_n + \frac{h}{2}, \; \mathbf{y}_n + \frac{h}{2}\mathbf{k}_2\right) && \text{(Refined midpoint slope via } k_2\text{)} \\
\mathbf{k}_4 &= \mathbf{f}(t_n + h, \; \mathbf{y}_n + h \mathbf{k}_3) && \text{(Slope at end via } k_3\text{)}
\end{aligned}$$

$$\mathbf{y}_{n+1} = \mathbf{y}_n + \frac{h}{6} \left(\mathbf{k}_1 + 2\mathbf{k}_2 + 2\mathbf{k}_3 + \mathbf{k}_4\right)$$

```
        RK4 Slope Sampling Strategy Across Interval h
        
       y ^
         |                       k4 (trial end)
         |               k2, k3        *
         |              (midpoints)   /
         |                 *         /
         |     k1         / \       /
         |   (start)     /   \     /
         |      *-------+-----+---+
         +------+-------+-----+---+------> t
               tn     tn+h/2    tn+h
```

---

### Step-by-Step Numeric Comparison: Euler vs RK4

Let us test both algorithms on $\frac{dy}{dt} = -2y$ with $y_0 = 1$ over a large step $h = 0.5$ from $t = 0$ to $t = 0.5$.

- **True Analytical Value:**
  $$y(0.5) = e^{-2(0.5)} = e^{-1} \approx 0.367879$$

#### Forward Euler Step ($h = 0.5$):
$$f(0, 1) = -2(1) = -2$$
$$y_1^{\text{Euler}} = 1 + 0.5(-2) = 1 - 1 = \mathbf{0.000000}$$
- **Absolute Error:** $|0.000000 - 0.367879| = \mathbf{0.367879}$ (Massive $100\%$ relative error!).

#### RK4 Step ($h = 0.5$):
1. $k_1 = f(0, 1) = -2(1) = -2$
2. Midpoint 1 state: $y = 1 + \frac{0.5}{2}(-2) = 1 - 0.5 = 0.5$
   $$k_2 = f(0.25, 0.5) = -2(0.5) = -1$$
3. Midpoint 2 state: $y = 1 + \frac{0.5}{2}(-1) = 1 - 0.25 = 0.75$
   $$k_3 = f(0.25, 0.75) = -2(0.75) = -1.5$$
4. Endpoint state: $y = 1 + 0.5(-1.5) = 1 - 0.75 = 0.25$
   $$k_4 = f(0.5, 0.25) = -2(0.25) = -0.5$$
5. Weighted average slope:
   $$k_{\text{avg}} = \frac{1}{6} \left[ -2 + 2(-1) + 2(-1.5) + (-0.5) \right] = \frac{-2 - 2 - 3 - 0.5}{6} = \frac{-7.5}{6} = -1.25$$
6. New state:
   $$y_1^{\text{RK4}} = 1 + 0.5(-1.25) = 1 - 0.625 = \mathbf{0.375000}$$
- **Absolute Error:** $|0.375000 - 0.367879| = \mathbf{0.007121}$!

RK4 is over **$51\times$ more accurate** than Euler on the exact same step size!

---

## 3. 2D Dynamical Systems, Phase Portraits & Stability

A 2D continuous dynamical system is defined by a pair of coupled equations:

$$\frac{d\mathbf{x}}{dt} = \mathbf{f}(\mathbf{x}) \iff \begin{cases} \frac{dx_1}{dt} = f_1(x_1, x_2) \\ \frac{dx_2}{dt} = f_2(x_1, x_2) \end{cases}$$

The state space $(x_1, x_2)$ is known as **Phase Space**. Every point has an instantaneous velocity arrow $\mathbf{f}(\mathbf{x})$, forming a **Vector Field**.

### Fixed Points (Equilibrium States)
A point $\mathbf{x}^*$ is a **fixed point** if the velocity is zero:

$$\mathbf{f}(\mathbf{x}^*) = \mathbf{0}$$

At a fixed point, the system is at rest. To determine whether nearby trajectories converge toward or blow up away from $\mathbf{x}^*$, we linearize using the **Jacobian Matrix**:

$$J = \begin{bmatrix} \frac{\partial f_1}{\partial x_1} & \frac{\partial f_1}{\partial x_2} \\ \frac{\partial f_2}{\partial x_1} & \frac{\partial f_2}{\partial x_2} \end{bmatrix}_{\mathbf{x}^*}$$

Near the fixed point, the perturbation $\Delta \mathbf{x} = \mathbf{x} - \mathbf{x}^*$ evolves according to $\frac{d(\Delta \mathbf{x})}{dt} \approx J \Delta \mathbf{x}$.

```
                 Phase Portrait Classification of Fixed Points
                 
      Stable Sink / Attractor            Unstable Source                Saddle Point
          (Re(λ) < 0)                      (Re(λ) > 0)                  (λ1 > 0 > λ2)
               \   |   /                        \   |   /                  \         /
                \  v  /                          ^  |  ^                    \   ^   /
              ---> * <---                      <-- * -->                     v  |  v
                /  ^  \                          /  |  \                   <-- * -->
               /   |   \                        /   |   \                    ^  |  ^
                                                                           /    v    \
```

| Fixed Point Type | Eigenvalues of Jacobian $J$ | Geometric Behavior |
| :--- | :--- | :--- |
| **Stable Sink (Attractor)** | All $\text{Re}(\lambda_i) < 0$ | Trajectories spiral or converge directly into $\mathbf{x}^*$ (like a local minimum in loss landscapes). |
| **Unstable Source (Repeller)**| All $\text{Re}(\lambda_i) > 0$ | Trajectories accelerate outward away from $\mathbf{x}^*$. |
| **Saddle Point** | Real eigenvalues with mixed signs ($\lambda_1 > 0 > \lambda_2$) | Attracts along stable direction, repels along unstable direction. (Ubiquitous in deep learning loss surfaces). |
| **Stable Spiral** | Complex with $\text{Re}(\lambda) < 0$ | Trajectories swirl inward like water down a drain. |
| **Center (Oscillator)** | Purely imaginary ($\text{Re}(\lambda) = 0$) | Closed concentric periodic circular orbits (undamped harmonic motion). |

---

## 4. Continuous Gradient Flow & The Learning Rate Limit

Consider training a model by minimizing a smooth loss function $\mathcal{L}(\mathbf{w})$ over parameters $\mathbf{w} \in \mathbb{R}^d$.

In continuous time, **Gradient Flow** is the ordinary differential equation:

$$\frac{d\mathbf{w}(t)}{dt} = -\nabla \mathcal{L}(\mathbf{w}(t))$$

Now apply the Forward Euler numerical integrator with time step $h = \eta$:

$$\mathbf{w}_{t+1} = \mathbf{w}_t + \eta \left(-\nabla \mathcal{L}(\mathbf{w}_t)\right) \implies \mathbf{w}_{t+1} = \mathbf{w}_t - \eta \nabla \mathcal{L}(\mathbf{w}_t)$$

> [!IMPORTANT]
> **Gradient Descent is simply Forward Euler integration of continuous gradient flow!**
> The learning rate $\eta$ is literally the numerical integration step size $h$.

### Why Training Explodes: The Exact Learning Rate Boundary
Consider a 1D quadratic loss bowl with curvature $k > 0$:
$$\mathcal{L}(w) = \frac{1}{2} k w^2 \implies \nabla \mathcal{L}(w) = k w$$

The continuous gradient flow is:
$$\frac{dw}{dt} = -k w \implies w(t) = w_0 e^{-k t} \quad (\text{Smoothly decays to } w^* = 0)$$

Now apply the discrete Euler update (gradient descent):
$$w_{t+1} = w_t - \eta (k w_t) = (1 - \eta k) w_t$$

After $T$ steps:
$$w_T = (1 - \eta k)^T w_0$$

For the sequence $w_T$ to converge to zero, the amplification factor must satisfy:
$$|1 - \eta k| < 1 \iff -1 < 1 - \eta k < 1 \iff 0 < \eta < \frac{2}{k}$$

- **If $\eta < \frac{1}{k}$:** Smooth monotonic convergence.
- **If $\frac{1}{k} < \eta < \frac{2}{k}$:** Stable damped oscillations across the valley.
- **If $\eta = \frac{2}{k}$:** Endless bouncing back and forth between $\pm w_0$ (undamped oscillation).
- **If $\eta > \frac{2}{k}$:** **Catastrophic Divergence!** The parameter oscillates with exponentially growing magnitude to $\pm \infty$ (loss blows up to `NaN`!).

In multi-variable optimization, $k$ is replaced by the maximum eigenvalue of the Hessian matrix $\lambda_{\max}(H)$:
$$\eta_{\text{max}} = \frac{2}{\lambda_{\max}(H)}$$

---

## 5. Frontier AI Connection: ResNets, Neural ODEs & Flow Matching

### 1. ResNets as Discretized ODEs
A standard Residual Network block with skip connection computes:
$$\mathbf{x}_{l+1} = \mathbf{x}_l + F(\mathbf{x}_l, W_l)$$

Notice that if we divide by layer step $\Delta t = 1$:
$$\frac{\mathbf{x}_{l+1} - \mathbf{x}_l}{\Delta t} = F(\mathbf{x}_l, W_l) \iff \frac{d\mathbf{x}(t)}{dt} = F(\mathbf{x}(t), t, \theta)$$

A 152-layer ResNet is an Euler integration trajectory solving a continuous differential equation from $t = 0$ to $t = 152$!

### 2. Neural Ordinary Differential Equations (Chen et al. 2018)
Instead of hardcoding discrete layers, Neural ODEs define depth as continuous time:
$$\mathbf{x}(T) = \mathbf{x}(0) + \int_0^T f_\theta(\mathbf{x}(t), t) \, dt$$

- Evaluated using adaptive step-size black-box solvers (like Dormand-Prince / RK45).
- **Adjoint Sensitivity Method:** Computes gradients by solving a continuous backward ODE backwards in time, using **$O(1)$ constant memory** regardless of model depth!

### 3. Flow Matching: The Foundation of Flux & Stable Diffusion 3
Classical diffusion models (DDPM) corrupt images with Gaussian noise and reverse the process along curved Brownian paths, requiring 50 to 100 solver steps.

**Flow Matching** replaces curved stochastic paths with straight-line vector fields:
$$\frac{d\mathbf{x}_t}{dt} = \mathbf{v}_\theta(\mathbf{x}_t, t)$$

By training the neural network to output straight velocity vectors:
$$\mathbf{v}_t = \mathbf{x}_1 - \mathbf{x}_0$$
(pointing directly from pure noise $\mathbf{x}_0$ to clean image $\mathbf{x}_1$), modern models like Flux and SD3 can integrate the ODE forward in just **4 to 8 numerical solver steps**, generating photorealistic images in milliseconds!

> [!TIP]
> **Explore the Interactive Lab:**
> Switch to the **Interactive 2D Lab** tab above to test 2D phase portraits, click anywhere to launch Euler vs RK4 trajectories, and watch how changing step size $h$ alters numerical convergence!
