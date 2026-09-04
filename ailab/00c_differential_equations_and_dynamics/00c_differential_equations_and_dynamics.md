# Module 00c: Differential Equations, Numerical Solvers & Dynamical Systems

Modern deep learning is increasingly understood not as static discrete layers, but as continuous dynamical systems. In 2018, Ricky Chen and David Duvenaud introduced **Neural Ordinary Differential Equations (Neural ODEs)**, proving that residual networks (ResNets) are simply Euler discretizations of continuous-time differential equations. Today, modern generative AI (Stable Diffusion 3, Flux, Flow Matching) formulates image synthesis as solving an ordinary differential equation along optimal probability transport trajectories.

---

## 1. What is an Ordinary Differential Equation?

An **Ordinary Differential Equation (ODE)** relates an unknown function $y(t)$ of a single independent variable $t$ (often time) to its derivatives with respect to $t$.

### First-Order Initial Value Problem (IVP)
The canonical first-order ODE takes the form:

$$\frac{d\mathbf{y}}{dt} = \mathbf{f}(t, \mathbf{y}(t)), \quad \mathbf{y}(t_0) = \mathbf{y}_0$$

where:
- $t \in \mathbb{R}$ is the independent parameter.
- $\mathbf{y}(t) \in \mathbb{R}^d$ is the state vector of the system.
- $\mathbf{f}: \mathbb{R} \times \mathbb{R}^d \to \mathbb{R}^d$ is the velocity vector field determining the instantaneous direction and speed of evolution.
- $\mathbf{y}_0$ is the initial boundary condition at $t = t_0$.

### Analytical Solutions via Separation of Variables
Consider the classical exponential decay ODE with rate $k > 0$:

$$\frac{dy}{dt} = -k y \implies \frac{1}{y} dy = -k \, dt$$

Integrating both sides from $t_0 = 0$ to $t$:

$$\int_{y_0}^{y(t)} \frac{1}{u} du = \int_0^t -k \, ds \implies \ln\left(\frac{y(t)}{y_0}\right) = -k t \implies y(t) = y_0 e^{-k t}$$

While simple linear ODEs admit closed-form analytical solutions, real-world systems (and deep neural networks) possess highly non-linear vector fields $\mathbf{f}(t, \mathbf{y})$ that cannot be solved with pencil and paper. We must turn to numerical integrators.

---

## 2. Numerical Integration: Forward Euler vs Runge-Kutta 4 (RK4)

To solve an ODE numerically on a digital computer, we discretize continuous time into small discrete time steps $\Delta t = h$:

$$t_0, \; t_1 = t_0 + h, \; t_2 = t_0 + 2h, \; \dots, \; t_N = t_0 + N h$$

### Forward Euler Method
The simplest numerical integrator approximates the derivative with a first-order forward finite difference:

$$\frac{\mathbf{y}_{n+1} - \mathbf{y}_n}{h} \approx \mathbf{f}(t_n, \mathbf{y}_n) \implies \mathbf{y}_{n+1} = \mathbf{y}_n + h \, \mathbf{f}(t_n, \mathbf{y}_n)$$

- **Local Truncation Error**: $O(h^2)$ per step (via Taylor series remainder).
- **Global Accumulation Error**: $O(h)$ over $N = T/h$ steps.
- **Limitation**: Highly sensitive to step size $h$; easily becomes numerically unstable or drifts away from true orbits unless $h$ is infinitesimal.

### Classical 4th-Order Runge-Kutta (RK4)
RK4 achieves fourth-order global accuracy ($O(h^4)$) by evaluating the slope four times per step (at the beginning, two trial midpoints, and the end) and taking a Simpson's-rule weighted average:

$$\mathbf{k}_1 = \mathbf{f}(t_n, \mathbf{y}_n)$$

$$\mathbf{k}_2 = \mathbf{f}\left(t_n + \frac{h}{2}, \; \mathbf{y}_n + \frac{h}{2} \mathbf{k}_1\right)$$

$$\mathbf{k}_3 = \mathbf{f}\left(t_n + \frac{h}{2}, \; \mathbf{y}_n + \frac{h}{2} \mathbf{k}_2\right)$$

$$\mathbf{k}_4 = \mathbf{f}(t_n + h, \; \mathbf{y}_n + h \mathbf{k}_3)$$

$$\mathbf{y}_{n+1} = \mathbf{y}_n + \frac{h}{6} \left( \mathbf{k}_1 + 2\mathbf{k}_2 + 2\mathbf{k}_3 + \mathbf{k}_4 \right)$$

Cutting the step size $h$ in half reduces the global error by a factor of $2^4 = 16\times$, making RK4 the workhorse integrator for scientific modeling and physics engines.

---

## 3. Dynamical Systems, Vector Fields & Phase Space

A **Dynamical System** describes the time-dependent evolution of a point within a geometric state space (phase space).

### Vector Fields & Trajectories
At every point $\mathbf{x}$ in phase space, the ODE assigns an arrow $\mathbf{f}(\mathbf{x})$ denoting instantaneous velocity. A solution trajectory is a smooth curve that is tangent to the vector field everywhere along its path.

### Fixed Points (Equilibria) & Stability
A point $\mathbf{x}^*$ is a **fixed point** (or stationary point) if:

$$\mathbf{f}(\mathbf{x}^*) = \mathbf{0}$$

At a fixed point, velocity is zero and the system remains at rest indefinitely. By linearizing around the fixed point using the Jacobian matrix $J = \frac{\partial \mathbf{f}}{\partial \mathbf{x}}\Big|_{\mathbf{x}^*}$:

$$\frac{d(\Delta \mathbf{x})}{dt} \approx J \Delta \mathbf{x}$$

1. **Attractor (Stable Sink)**: All eigenvalues of $J$ have negative real parts ($\text{Re}(\lambda_i) < 0$). Trajectories converge toward $\mathbf{x}^*$.
2. **Repeller (Unstable Source)**: All eigenvalues of $J$ have positive real parts ($\text{Re}(\lambda_i) > 0$). Trajectories diverge away.
3. **Saddle Point**: Mixed eigenvalues (some positive, some negative). Trajectories approach along stable manifolds and depart along unstable manifolds.

---

## 4. Continuous Gradient Flow: Optimization as an ODE

Consider minimizing a differentiable loss function $\mathcal{L}(\mathbf{w})$ with respect to model parameters $\mathbf{w} \in \mathbb{R}^d$.

In continuous time, **Gradient Flow** is defined as the ODE:

$$\frac{d\mathbf{w}(t)}{dt} = -\nabla \mathcal{L}(\mathbf{w}(t))$$

Notice what happens when we apply Forward Euler discretization with step size $\eta$:

$$\mathbf{w}_{t+1} = \mathbf{w}_t - \eta \, \nabla \mathcal{L}(\mathbf{w}_t)$$

**Standard Gradient Descent is simply the Forward Euler numerical integration of continuous-time gradient flow!** The learning rate $\eta$ is the integration step size $h$.

If the step size $\eta$ is too large, the Euler integrator becomes numerically unstable and oscillates to infinity. If $\eta$ is within the stability region $\eta < \frac{2}{\lambda_{\max}(H)}$ (where $\lambda_{\max}(H)$ is the maximum eigenvalue of the Hessian curvature matrix), the trajectory converges monotonically to a local minimum attractor.

---

## 5. Frontier AI Connection: ResNets, Neural ODEs & Flow Matching

### 1. ResNets as Discretized ODEs
A standard Residual Network (ResNet) layer computes:

$$\mathbf{x}_{l+1} = \mathbf{x}_l + f(\mathbf{x}_l, W_l)$$

Rewriting this equation:

$$\frac{\mathbf{x}_{l+1} - \mathbf{x}_l}{1} = f(\mathbf{x}_l, W_l) \iff \frac{d\mathbf{x}(t)}{dt} = f(\mathbf{x}(t), t, \theta)$$

A 100-layer ResNet is an Euler integration trajectory of a continuous differential equation evaluated from $t = 0$ to $t = 1$.

### 2. Neural Ordinary Differential Equations (Neural ODEs)
Instead of specifying fixed discrete layers, Neural ODEs parameterize the derivative function with a neural network and evaluate the output using an adaptive black-box ODE solver (like Dormand-Prince or RK4):

$$\mathbf{x}(T) = \mathbf{x}(0) + \int_0^T f_\theta(\mathbf{x}(t), t) \, dt$$

The adjoint sensitivity method allows backpropagating gradients through the continuous ODE solver in $O(1)$ memory without storing intermediate activations!

### 3. Diffusion & Flow Matching
Modern generative models (Flux, Stable Diffusion 3) define image generation as probability density transport along an ODE vector field:

$$\frac{d\mathbf{x}_t}{dt} = \mathbf{v}_\theta(\mathbf{x}_t, t)$$

By learning velocity field $\mathbf{v}_\theta$ that pushes Gaussian noise $\mathbf{x}_0 \sim \mathcal{N}(\mathbf{0}, I)$ along straight paths toward data samples $\mathbf{x}_1 \sim p_{\text{data}}$, the model generates photorealistic images by integrating the ODE forward in just 4 to 8 numerical solver steps.
