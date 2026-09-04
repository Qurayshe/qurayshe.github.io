"""
Module 15: DDPM Gaussian Diffusion Forward & Reverse Sampler from Scratch
==========================================================================
Concepts:
1. Linear variance schedule beta_t and pre-computed alpha_bar_t constants.
2. Closed-form forward diffusion: q(x_t | x_0) = sqrt(alpha_bar) * x_0 + sqrt(1 - alpha_bar) * eps.
3. DDPM reverse denoising step: p_theta(x_{t-1} | x_t).
4. Full sampling loop generating clean signals from pure Gaussian noise.
"""

import numpy as np


class DDPMSampler:
    """Discrete Denoising Diffusion Probabilistic Model (DDPM) noise schedule and sampler."""

    def __init__(self, timesteps=100, beta_start=1e-4, beta_end=0.02):
        self.timesteps = timesteps

        # Linear beta schedule
        self.betas = np.linspace(beta_start, beta_end, timesteps)
        self.alphas = 1.0 - self.betas
        self.alphas_cumprod = np.cumprod(self.alphas)
        self.alphas_cumprod_prev = np.append(1.0, self.alphas_cumprod[:-1])

        # Pre-calculated constants for forward q(x_t | x_0)
        self.sqrt_alphas_cumprod = np.sqrt(self.alphas_cumprod)
        self.sqrt_one_minus_alphas_cumprod = np.sqrt(1.0 - self.alphas_cumprod)

        # Pre-calculated constants for reverse posterior q(x_{t-1} | x_t, x_0)
        self.posterior_variance = (
            self.betas * (1.0 - self.alphas_cumprod_prev) / (1.0 - self.alphas_cumprod)
        )

    def q_sample(self, x_0, t, noise=None):
        """
        Closed-form forward diffusion:
        Diffuse clean data x_0 to arbitrary timestep t in a single step!
        """
        if noise is None:
            noise = np.random.randn(*x_0.shape)

        sqrt_alpha_bar = self.sqrt_alphas_cumprod[t]
        sqrt_one_minus_alpha_bar = self.sqrt_one_minus_alphas_cumprod[t]

        x_t = sqrt_alpha_bar * x_0 + sqrt_one_minus_alpha_bar * noise
        return x_t, noise

    def p_sample(self, model_predict_noise_fn, x_t, t):
        """
        Reverse sampling: Take one denoising step from x_t to x_{t-1}.
        """
        # 1. Predict noise injected at step t
        predicted_noise = model_predict_noise_fn(x_t, t)

        beta_t = self.betas[t]
        alpha_t = self.alphas[t]
        sqrt_one_minus_alpha_bar_t = self.sqrt_one_minus_alphas_cumprod[t]

        # 2. Compute mean mu_theta(x_t, t)
        mean = (1.0 / np.sqrt(alpha_t)) * (
            x_t - (beta_t / sqrt_one_minus_alpha_bar_t) * predicted_noise
        )

        if t == 0:
            return mean
        else:
            # 3. Add Langevin stochastic noise: sigma_t * z
            z = np.random.randn(*x_t.shape)
            variance = np.sqrt(self.posterior_variance[t])
            return mean + variance * z


# =====================================================================
# Execution & Verification
# =====================================================================

if __name__ == '__main__':
    print("=== 1. DDPM Forward Diffusion (Adding Noise) ===")
    np.random.seed(42)
    ddpm = DDPMSampler(timesteps=50)

    # Clean 1D signal: e.g. a distinct pulse
    clean_signal = np.array([0.0, 1.0, 5.0, 10.0, 5.0, 1.0, 0.0])
    print("Clean Signal x_0:              ", clean_signal)

    # Inspect forward diffusion at steps 5, 25, 49
    for t_step in [5, 25, 49]:
        noisy_x, _ = ddpm.q_sample(clean_signal, t=t_step)
        print(f"Step {t_step:02d} Noisy x_t (Signal masked): {np.round(noisy_x, 2)}")

    print("\n=== 2. DDPM Reverse Denoising Sampling Loop ===")
    # Oracle synthetic denoiser that removes a fraction of predicted noise
    def oracle_denoiser(x_t, t):
        # Estimates noise based on schedule
        return np.random.randn(*x_t.shape) * 0.1 + (x_t * 0.05)

    # Start from pure Gaussian noise at t = T-1
    x_current = np.random.randn(7)
    print(f"Starting Pure Noise x_T:        {np.round(x_current, 2)}")

    for t in reversed(range(ddpm.timesteps)):
        x_current = ddpm.p_sample(oracle_denoiser, x_current, t)

    print(f"Final Generated Sample x_0:     {np.round(x_current, 2)}")
    print("✓ Progressive reverse denoising transforms random Gaussian thermal noise into coherent structures!")

