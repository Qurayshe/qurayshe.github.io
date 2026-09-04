"""
Module 03: Probability, Maximum Likelihood Estimation & Information Theory
==========================================================================
Concepts:
1. Shannon Entropy calculation for discrete distributions.
2. Cross-Entropy and Kullback-Leibler (KL) Divergence.
3. Maximum Likelihood Estimation (MLE) fitting a Gaussian distribution from scratch.
4. Comparing MLE with MAP (L2 regularization equivalence).
"""

import math
import numpy as np


# =====================================================================
# 1. Information Theory Metrics
# =====================================================================

def shannon_entropy(probabilities, base=2):
    """Compute H(P) = - sum(p * log(p))"""
    H = 0.0
    for p in probabilities:
        if p > 0.0:
            log_p = math.log(p) / math.log(base)
            H -= p * log_p
    return H


def cross_entropy(p_true, q_pred, eps=1e-12):
    """Compute H(P, Q) = - sum(p * log(q))"""
    p_true = np.asarray(p_true, dtype=np.float64)
    q_pred = np.asarray(q_pred, dtype=np.float64)
    q_pred = np.clip(q_pred, eps, 1.0 - eps)
    return -np.sum(p_true * np.log(q_pred))


def kl_divergence(p, q, eps=1e-12):
    """Compute D_KL(P || Q) = sum(p * log(p / q))"""
    p = np.asarray(p, dtype=np.float64)
    q = np.asarray(q, dtype=np.float64)
    p = np.clip(p, eps, 1.0)
    q = np.clip(q, eps, 1.0)
    return np.sum(p * np.log(p / q))


# =====================================================================
# 2. Maximum Likelihood Estimation for Gaussian Distribution
# =====================================================================

def gaussian_nll(params, data):
    """
    Negative Log-Likelihood for 1D Gaussian distribution:
    -log p(x | mu, sigma^2) = 0.5 * log(2*pi*sigma^2) + (x - mu)^2 / (2*sigma^2)
    """
    mu, sigma = params
    if sigma <= 0:
        return float('inf')
    n = len(data)
    log_likelihood = -0.5 * n * np.log(2.0 * np.pi * (sigma ** 2)) - np.sum((data - mu) ** 2) / (2.0 * (sigma ** 2))
    return -log_likelihood


def fit_gaussian_mle_analytical(data):
    """Analytical closed-form MLE solution: mu = mean(x), sigma = std(x)"""
    n = len(data)
    mu_hat = np.sum(data) / n
    sigma_hat = np.sqrt(np.sum((data - mu_hat) ** 2) / n)
    return mu_hat, sigma_hat


# =====================================================================
# Execution & Verification
# =====================================================================

if __name__ == '__main__':
    print("=== 1. Information Theory Metrics ===")
    # Uniform vs Biased Coin
    fair_coin = [0.5, 0.5]
    biased_coin = [0.9, 0.1]
    certain_event = [1.0, 0.0]

    print(f"Entropy (Fair Coin, max uncertainty):   {shannon_entropy(fair_coin):.4f} bits")
    print(f"Entropy (Biased 90/10 Coin):             {shannon_entropy(biased_coin):.4f} bits")
    print(f"Entropy (Deterministic Event):           {shannon_entropy(certain_event):.4f} bits")

    # Multi-class predictions vs Ground Truth
    p_true = np.array([0.0, 1.0, 0.0, 0.0])
    q_confident = np.array([0.05, 0.85, 0.05, 0.05])
    q_uncertain = np.array([0.25, 0.25, 0.25, 0.25])

    print(f"\nCross-Entropy (Confident Model):         {cross_entropy(p_true, q_confident):.4f} nats")
    print(f"Cross-Entropy (Uniform Model):           {cross_entropy(p_true, q_uncertain):.4f} nats")
    print(f"KL Divergence D_KL(P || Q_confident):    {kl_divergence(q_confident, p_true + 1e-10):.4f}")

    print("\n=== 2. Gaussian Maximum Likelihood Estimation (MLE) ===")
    np.random.seed(42)
    true_mu = 5.25
    true_sigma = 1.75
    sample_data = np.random.normal(loc=true_mu, scale=true_sigma, size=1000)

    mle_mu, mle_sigma = fit_gaussian_mle_analytical(sample_data)
    print(f"True Parameters:       mu={true_mu:.2f}, sigma={true_sigma:.2f}")
    print(f"MLE Fitted Parameters: mu={mle_mu:.4f}, sigma={mle_sigma:.4f}")
    print(f"Negative Log-Likelihood at optimal MLE: {gaussian_nll((mle_mu, mle_sigma), sample_data):.2f}")

