"""
Module 08: Regularization, Normalization & Schedulers from Scratch
==================================================================
Concepts:
1. Inverted Dropout layer (train vs eval mode).
2. Layer Normalization (mean centering + variance scaling).
3. Modern RMSNorm (Root Mean Square Normalization used in LLaMA).
4. Cosine Annealing Learning Rate Scheduler with Linear Warmup.
"""

import math
import numpy as np


# =====================================================================
# 1. Inverted Dropout
# =====================================================================

class InvertedDropout:
    """Randomly zeros activations during training with 1/(1-p) scaling."""

    def __init__(self, p=0.2):
        self.p = p
        self.mask = None
        self.training = True

    def forward(self, X):
        if not self.training or self.p == 0.0:
            return X
        # Generate Bernoulli mask with keep probability (1 - p)
        self.mask = (np.random.rand(*X.shape) >= self.p) / (1.0 - self.p)
        return X * self.mask

    def backward(self, grad_output):
        if not self.training or self.p == 0.0:
            return grad_output
        return grad_output * self.mask


# =====================================================================
# 2. Layer Normalization & RMSNorm
# =====================================================================

class LayerNorm:
    """Standard Layer Normalization (Ba et al., 2016) across feature dimension."""

    def __init__(self, d_model, eps=1e-5):
        self.eps = eps
        self.gamma = np.ones((1, d_model))
        self.beta = np.zeros((1, d_model))

    def forward(self, X):
        # X shape: (Batch, d_model) or (Batch, Seq_len, d_model)
        mean = np.mean(X, axis=-1, keepdims=True)
        var = np.var(X, axis=-1, keepdims=True)
        x_norm = (X - mean) / np.sqrt(var + self.eps)
        return x_norm * self.gamma + self.beta


class RMSNorm:
    """Root Mean Square Normalization (Zhang & Sennrich 2019, LLaMA standard)."""

    def __init__(self, d_model, eps=1e-5):
        self.eps = eps
        self.weight = np.ones((1, d_model))

    def forward(self, X):
        rms = np.sqrt(np.mean(X ** 2, axis=-1, keepdims=True) + self.eps)
        return (X / rms) * self.weight


# =====================================================================
# 3. Cosine Annealing with Warmup Scheduler
# =====================================================================

class CosineWarmupScheduler:
    """Computes learning rate with linear warmup and cosine decay."""

    def __init__(self, base_lr, max_lr, min_lr, warmup_steps, total_steps):
        self.base_lr = base_lr
        self.max_lr = max_lr
        self.min_lr = min_lr
        self.warmup_steps = warmup_steps
        self.total_steps = total_steps

    def get_lr(self, step):
        if step < self.warmup_steps:
            # Linear warmup
            return self.base_lr + (self.max_lr - self.base_lr) * (step / max(1, self.warmup_steps))
        elif step > self.total_steps:
            return self.min_lr
        else:
            # Cosine decay
            progress = (step - self.warmup_steps) / max(1, self.total_steps - self.warmup_steps)
            return self.min_lr + 0.5 * (self.max_lr - self.min_lr) * (1.0 + math.cos(math.pi * progress))


# =====================================================================
# Execution & Verification
# =====================================================================

if __name__ == '__main__':
    print("=== 1. Testing Inverted Dropout Conservation of Expectation ===")
    np.random.seed(42)
    X = np.ones((1000, 100)) * 5.0
    dropout = InvertedDropout(p=0.4)

    # Train mode
    X_train_drop = dropout.forward(X)
    print(f"Original Mean:             {np.mean(X):.4f}")
    print(f"Dropped Out Mean (Train):  {np.mean(X_train_drop):.4f} (Expectation preserved!)")
    print(f"Fraction of Zeroed Units:  {np.mean(X_train_drop == 0.0) * 100:.1f}% (Expected ~40%)")

    # Eval mode
    dropout.training = False
    X_eval = dropout.forward(X)
    print(f"Dropped Out Mean (Eval):   {np.mean(X_eval):.4f} (Passthrough)\n")

    print("=== 2. LayerNorm vs RMSNorm on High-Variance Inputs ===")
    d_model = 8
    X_unnorm = np.array([
        [10.0, 20.0, -5.0, 35.0, 0.0, 15.0, -12.0, 8.0],
        [-100.0, 50.0, 200.0, -50.0, 0.0, 10.0, -20.0, 30.0]
    ])

    ln = LayerNorm(d_model)
    rms = RMSNorm(d_model)

    X_ln = ln.forward(X_unnorm)
    X_rms = rms.forward(X_unnorm)

    print(f"LayerNorm Output Mean (Row 0): {np.mean(X_ln[0]):.4f}, Std: {np.std(X_ln[0]):.4f}")
    print(f"RMSNorm Output RMS (Row 0):    {np.sqrt(np.mean(X_rms[0]**2)):.4f}")

    print("\n=== 3. Cosine Annealing with Warmup Progression ===")
    scheduler = CosineWarmupScheduler(base_lr=1e-5, max_lr=1e-3, min_lr=1e-6, warmup_steps=100, total_steps=1000)
    steps_to_check = [0, 50, 100, 250, 500, 750, 1000]
    for step in steps_to_check:
        print(f"Step {step:04d} -> Learning Rate: {scheduler.get_lr(step):.6e}")
