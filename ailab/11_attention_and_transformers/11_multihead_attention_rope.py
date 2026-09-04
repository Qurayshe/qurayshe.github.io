"""
Module 11: Scaled Dot-Product Attention & Rotary Position Embeddings (RoPE)
============================================================================
Concepts:
1. Scaled Dot-Product Attention with sqrt(d_k) scaling and causal masking.
2. Multi-Head Attention splitting into parallel subspace heads.
3. Rotary Position Embeddings (RoPE) implementation for relative positional rotation.
4. Numerical verification of attention weights summing to 1.0 along the sequence.
"""

import numpy as np


# =====================================================================
# 1. Rotary Position Embedding (RoPE)
# =====================================================================

def apply_rotary_pos_emb(x, seq_len):
    """
    Applies 2D pair-wise rotation:
    x shape: (Batch, Seq_len, d_k) where d_k is even.
    """
    B, L, d = x.shape
    assert d % 2 == 0, "Feature dimension must be even for RoPE"

    # Base frequencies: theta_i = 10000 ^ (-2*(i-1) / d)
    dim_indices = np.arange(0, d, 2, dtype=float)
    inv_freq = 1.0 / (10000.0 ** (dim_indices / d))

    positions = np.arange(seq_len, dtype=float)
    # Outer product -> (seq_len, d // 2)
    angles = np.outer(positions, inv_freq)

    cos_angles = np.cos(angles)  # (L, d//2)
    sin_angles = np.sin(angles)  # (L, d//2)

    # Reshape x into pairs: (B, L, d//2, 2)
    x_pairs = x.reshape(B, L, d // 2, 2)
    x0 = x_pairs[:, :, :, 0]
    x1 = x_pairs[:, :, :, 1]

    # Rotate 2D vectors: [x0*cos - x1*sin, x0*sin + x1*cos]
    x0_rot = x0 * cos_angles - x1 * sin_angles
    x1_rot = x0 * sin_angles + x1 * cos_angles

    rotated = np.stack([x0_rot, x1_rot], axis=-1).reshape(B, L, d)
    return rotated


# =====================================================================
# 2. Scaled Dot-Product Attention with Causal Mask
# =====================================================================

def scaled_dot_product_attention(Q, K, V, causal_mask=True):
    """
    Q, K, V shapes: (Batch, Heads, Seq_len, d_k)
    """
    d_k = Q.shape[-1]
    # Compute dot products: Q @ K^T -> (B, H, L, L)
    scores = np.matmul(Q, np.swapaxes(K, -2, -1)) / np.sqrt(d_k)

    if causal_mask:
        seq_len = Q.shape[-2]
        # Upper triangular mask filled with -infinity
        mask = np.triu(np.ones((seq_len, seq_len), dtype=bool), k=1)
        scores = np.where(mask, -1e9, scores)

    # Softmax over last dimension
    exp_scores = np.exp(scores - np.max(scores, axis=-1, keepdims=True))
    attention_weights = exp_scores / np.sum(exp_scores, axis=-1, keepdims=True)

    # Contextual projection: A @ V
    output = np.matmul(attention_weights, V)
    return output, attention_weights


# =====================================================================
# 3. Multi-Head Attention Module
# =====================================================================

class MultiHeadAttention:
    """Multi-Head Self-Attention with RoPE."""

    def __init__(self, d_model=64, num_heads=4):
        assert d_model % num_heads == 0
        self.d_model = d_model
        self.num_heads = num_heads
        self.d_k = d_model // num_heads

        # Projections for Q, K, V and output O
        self.W_q = np.random.randn(d_model, d_model) * (1.0 / np.sqrt(d_model))
        self.W_k = np.random.randn(d_model, d_model) * (1.0 / np.sqrt(d_model))
        self.W_v = np.random.randn(d_model, d_model) * (1.0 / np.sqrt(d_model))
        self.W_o = np.random.randn(d_model, d_model) * (1.0 / np.sqrt(d_model))

    def forward(self, X, apply_rope=True):
        """X shape: (Batch, Seq_len, d_model)"""
        B, L, _ = X.shape

        # Linear projections
        Q = np.dot(X, self.W_q)
        K = np.dot(X, self.W_k)
        V = np.dot(X, self.W_v)

        # Apply Rotary Position Embeddings to Q and K
        if apply_rope:
            Q = apply_rotary_pos_emb(Q, L)
            K = apply_rotary_pos_emb(K, L)

        # Reshape for multi-head: (B, H, L, d_k)
        Q = Q.reshape(B, L, self.num_heads, self.d_k).swapaxes(1, 2)
        K = K.reshape(B, L, self.num_heads, self.d_k).swapaxes(1, 2)
        V = V.reshape(B, L, self.num_heads, self.d_k).swapaxes(1, 2)

        # Attention
        attn_out, weights = scaled_dot_product_attention(Q, K, V, causal_mask=True)

        # Re-assemble heads: (B, L, d_model)
        attn_out = attn_out.swapaxes(1, 2).reshape(B, L, self.d_model)
        output = np.dot(attn_out, self.W_o)
        return output, weights


# =====================================================================
# Execution & Verification
# =====================================================================

if __name__ == '__main__':
    print("=== Multi-Head Attention & RoPE Verification ===")
    np.random.seed(42)
    batch_size = 2
    seq_length = 6
    hidden_dim = 32
    num_heads = 4

    tokens_batch = np.random.randn(batch_size, seq_length, hidden_dim)

    mha = MultiHeadAttention(d_model=hidden_dim, num_heads=num_heads)
    out, attn_weights = mha.forward(tokens_batch, apply_rope=True)

    print(f"Input Shape:             {tokens_batch.shape}")
    print(f"Output Embedding Shape:  {out.shape}")
    print(f"Attention Weights Shape: {attn_weights.shape} (Batch, Heads, L, L)")

    # Inspect causal mask for Head 0 of Batch 0
    head_0_weights = attn_weights[0, 0]
    print("\nAttention Matrix (Head 0, Batch 0) - Notice Causal Lower Triangle:")
    print(np.round(head_0_weights, 3))
    print("Row sums verify exact probability normalization:", np.sum(head_0_weights, axis=-1))
    assert np.allclose(np.sum(head_0_weights, axis=-1), 1.0), "Attention weights must sum to 1.0"
    print("✓ Causal masking enforces strict autoregressive next-token dependency!")

