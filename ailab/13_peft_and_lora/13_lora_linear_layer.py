"""
Module 13: LoRA (Low-Rank Adaptation) Linear Layer from Scratch
==============================================================
Concepts:
1. Freezing base weight matrix W0.
2. Low-rank parameter matrices A and B with rank r << d.
3. Asymmetric initialization: A ~ Normal, B = 0 (ensuring Delta W = 0 initially).
4. Analytical weight merging for zero inference overhead.
"""

import numpy as np


class LoRALinear:
    """
    Linear layer wrapped with Low-Rank Adaptation:
    h = W0 @ x + (alpha / r) * (B @ A) @ x
    """

    def __init__(self, in_features, out_features, rank=4, alpha=8.0):
        self.in_features = in_features
        self.out_features = out_features
        self.rank = rank
        self.scaling = alpha / rank

        # 1. Base pre-trained weights (FROZEN during fine-tuning)
        std_base = np.sqrt(2.0 / in_features)
        self.W0 = np.random.randn(out_features, in_features) * std_base
        self.W0_frozen = True

        # 2. LoRA Adapter Matrices
        # Matrix A initialized from Gaussian
        self.lora_A = np.random.randn(rank, in_features) * (1.0 / np.sqrt(rank))
        # Matrix B initialized to exact zero
        self.lora_B = np.zeros((out_features, rank))

        # Gradient accumulators for LoRA only
        self.grad_A = None
        self.grad_B = None
        self.last_x = None

    def forward(self, x):
        """
        x shape: (Batch, in_features)
        Returns: (Batch, out_features)
        """
        self.last_x = x
        # Frozen base path: x @ W0^T
        base_out = np.dot(x, self.W0.T)

        # LoRA adapter path: (x @ A^T) @ B^T * scaling
        lora_out = np.dot(np.dot(x, self.lora_A.T), self.lora_B.T) * self.scaling
        return base_out + lora_out

    def backward(self, grad_output):
        """
        Computes gradients ONLY for trainable LoRA matrices A and B.
        grad_output shape: (Batch, out_features)
        """
        x = self.last_x
        scaled_grad = grad_output * self.scaling

        # Gradient with respect to B: (out_features, rank)
        # dL/dB = scaled_grad^T @ (x @ A^T)
        h_A = np.dot(x, self.lora_A.T)  # (Batch, rank)
        self.grad_B = np.dot(scaled_grad.T, h_A)

        # Gradient with respect to A: (rank, in_features)
        # dL/dA = (scaled_grad @ B)^T @ x
        self.grad_A = np.dot(np.dot(scaled_grad, self.lora_B).T, x)

        # Backpropagate gradient to input x
        grad_x = np.dot(grad_output, self.W0) + np.dot(np.dot(scaled_grad, self.lora_B), self.lora_A)
        return grad_x

    def merge_weights(self):
        """Merges LoRA adapter into base weights for zero-latency deployment."""
        delta_W = (self.lora_B @ self.lora_A) * self.scaling
        self.W0 += delta_W
        print("-> Folded LoRA adapter weights directly into W0. Deployable as a single standard linear layer!")


# =====================================================================
# Execution & Verification
# =====================================================================

if __name__ == '__main__':
    print("=== 1. LoRA Parameter Efficiency Analysis ===")
    d_in = 4096
    d_out = 4096
    r = 8
    alpha = 16.0

    total_base_params = d_in * d_out
    lora_trainable_params = (d_in * r) + (r * d_out)
    reduction = (1.0 - (lora_trainable_params / total_base_params)) * 100

    print(f"Standard Linear Weight Parameters: {total_base_params:,}")
    print(f"LoRA Trainable Parameters (r={r}):     {lora_trainable_params:,}")
    print(f"Parameter Reduction:                {reduction:.2f}% fewer trainable weights!")

    print("\n=== 2. Numerical Forward Verification ===")
    np.random.seed(42)
    lora_layer = LoRALinear(in_features=64, out_features=64, rank=4, alpha=8.0)
    test_x = np.random.randn(2, 64)

    # Initial forward pass (Before training, LoRA B is zero)
    initial_out = lora_layer.forward(test_x)
    base_only_out = np.dot(test_x, lora_layer.W0.T)
    diff = np.max(np.abs(initial_out - base_only_out))
    print(f"Initial LoRA contribution difference from base: {diff:.8f}")
    assert diff == 0.0, "Initial LoRA output must match base model exactly!"
    print("✓ Initialized LoRA model produces exact base-model predictions at step 0!")

