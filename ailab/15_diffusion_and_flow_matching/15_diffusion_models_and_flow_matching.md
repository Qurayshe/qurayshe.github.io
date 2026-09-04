# Module 15: Diffusion Models & Flow Matching (SOTA Generative AI)

In 2020, Sohl-Dickstein and Ho et al. introduced **Denoising Diffusion Probabilistic Models (DDPM)**, dethroning Generative Adversarial Networks (GANs). By modeling image generation as a thermodynamic reverse-time Langevin diffusion process, diffusion models eliminated mode collapse and achieved photorealistic synthesis (Midjourney, Stable Diffusion, DALL-E 3). Today, modern frontier models (Stable Diffusion 3, Flux, OpenAI Sora) have unified diffusion under **Flow Matching**!

---

## 1. Generative Taxonomy: From GANs to Diffusion

```
 GANs:        Generator vs Discriminator minimax game -> Unstable, Mode Collapse
 VAEs:        Latent variable maximization of ELBO   -> Blurry reconstructions
 Diffusion:   Gradual iterative noise removal       -> High diversity, Photorealistic, Stable!
```

---

## 2. Denoising Diffusion Probabilistic Models (DDPM)

Diffusion models define two processes:
1. **Forward Process $q(\mathbf{x}_t \mid \mathbf{x}_{t-1})$:** Slowly destroys image data by injecting Gaussian noise over $T$ steps until $\mathbf{x}_T \sim \mathcal{N}(\mathbf{0}, \mathbf{I})$.
2. **Reverse Process $p_\theta(\mathbf{x}_{t-1} \mid \mathbf{x}_t)$:** Neural network learns to remove noise step-by-step.

```
       x0 (Clean Image)                  xt                        xT (Pure Gaussian Noise)
        +-------------------+           +-------------------+           +-------------------+
        |       Cat         |  =====>   |  Cat + 50% Noise  |  =====>   |   Static Noise    |
        +-------------------+           +-------------------+           +-------------------+
                 <============================== <==============================
                             Reverse Denoising Process p_theta(x_{t-1} | x_t)
```

### The Forward Noise Closed-Form Shortcut
Instead of stepping sequentially through all $t-1$ noise additions, Gaussian convolution allows sampling $\mathbf{x}_t$ at **any arbitrary timestep $t$ in a single step**:

$$\mathbf{x}_t = \sqrt{\bar{\alpha}_t} \mathbf{x}_0 + \sqrt{1 - \bar{\alpha}_t} \boldsymbol{\epsilon}, \quad \boldsymbol{\epsilon} \sim \mathcal{N}(\mathbf{0}, \mathbf{I})$$

Where $\beta_t \in (0, 1)$ is the variance schedule, $\alpha_t = 1 - \beta_t$, and $\bar{\alpha}_t = \prod_{s=1}^t \alpha_s$.

### The Simplified Training Objective (Ho et al., 2020)
Train a neural network $\boldsymbol{\epsilon}_\theta(\mathbf{x}_t, t)$ to predict the exact Gaussian noise vector $\boldsymbol{\epsilon}$ injected into $\mathbf{x}_t$:

$$\mathcal{L}_{\text{simple}}(\theta) = \mathbb{E}_{t, \mathbf{x}_0, \boldsymbol{\epsilon}} \left[ \big\| \boldsymbol{\epsilon} - \boldsymbol{\epsilon}_\theta(\mathbf{x}_t, t) \big\|^2 \right]$$

---

## 3. Classifier-Free Guidance (CFG - Ho & Salimans, 2021)

How do we force a diffusion model to strictly follow text prompts $c$?
Train the model with conditional input $c$ and occasionally drop the condition ($c = \emptyset$) with 10-20% probability.
During sampling, compute two noise predictions and extrapolate in the direction of the prompt:

$$\tilde{\boldsymbol{\epsilon}}_\theta(\mathbf{x}_t, c) = \boldsymbol{\epsilon}_\theta(\mathbf{x}_t, \emptyset) + w \cdot \left( \boldsymbol{\epsilon}_\theta(\mathbf{x}_t, c) - \boldsymbol{\epsilon}_\theta(\mathbf{x}_t, \emptyset) \right)$$

Where $w > 1.0$ is the **guidance scale**:
- $w = 1.0$: Standard conditional generation.
- $w = 7.5$: High adherence to text prompt and vivid contrast.

---

## 4. Modern SOTA: Flow Matching (Lipman et al., 2023)

Traditional DDPM curved noise trajectories require 50-100 solver steps.
**Flow Matching** formulates generative modeling as continuous-time Ordinary Differential Equations (ODEs) that follow **straight line vector fields**:

$$\mathbf{x}_t = (1 - t) \mathbf{x}_0 + t \mathbf{x}_1, \quad t \in [0, 1]$$
$$\frac{d\mathbf{x}_t}{dt} = \mathbf{v}_t = \mathbf{x}_1 - \mathbf{x}_0$$

Because trajectories are straight lines rather than curved stochastic paths, numerical ODE solvers can generate photorealistic images in as few as **4 to 8 steps**!
Flow Matching is the core generative engine inside **Stable Diffusion 3, Flux.1, and Sora**.

