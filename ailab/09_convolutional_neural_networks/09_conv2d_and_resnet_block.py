"""
Module 09: 2D Convolution & Residual Bottleneck Block from Scratch
===================================================================
Concepts:
1. Pure NumPy 2D spatial convolution with padding and stride.
2. Max Pooling layer for spatial downsampling.
3. Building a Residual Block (ResNet) with identity skip connection.
4. Feature map shape transformation and gradient highway preservation.
"""

import numpy as np


# =====================================================================
# 1. 2D Convolutional Layer (NumPy)
# =====================================================================

class Conv2D:
    """Multi-channel 2D Convolutional layer."""

    def __init__(self, in_channels, out_channels, kernel_size=3, stride=1, padding=1):
        self.in_channels = in_channels
        self.out_channels = out_channels
        self.k = kernel_size
        self.stride = stride
        self.padding = padding

        # He/Kaiming initialization
        std = np.sqrt(2.0 / (in_channels * kernel_size * kernel_size))
        self.weights = np.random.randn(out_channels, in_channels, kernel_size, kernel_size) * std
        self.bias = np.zeros(out_channels)

    def forward(self, X):
        """
        X: (Batch, in_channels, H, W)
        Output: (Batch, out_channels, H_out, W_out)
        """
        B, C, H, W = X.shape
        k, s, p = self.k, self.stride, self.padding

        # Pad spatial dimensions
        if p > 0:
            X_pad = np.pad(X, ((0, 0), (0, 0), (p, p), (p, p)), mode='constant')
        else:
            X_pad = X

        H_out = (H - k + 2 * p) // s + 1
        W_out = (W - k + 2 * p) // s + 1
        out = np.zeros((B, self.out_channels, H_out, W_out))

        for b in range(B):
            for oc in range(self.out_channels):
                kernel = self.weights[oc]  # (C, k, k)
                b_val = self.bias[oc]
                for i in range(H_out):
                    h_start = i * s
                    h_end = h_start + k
                    for j in range(W_out):
                        w_start = j * s
                        w_end = w_start + k
                        patch = X_pad[b, :, h_start:h_end, w_start:w_end]
                        out[b, oc, i, j] = np.sum(patch * kernel) + b_val

        return out


# =====================================================================
# 2. Max Pooling Layer
# =====================================================================

class MaxPool2D:
    """2D Spatial Max Pooling layer."""

    def __init__(self, pool_size=2, stride=2):
        self.pool_size = pool_size
        self.stride = stride

    def forward(self, X):
        B, C, H, W = X.shape
        p, s = self.pool_size, self.stride
        H_out = (H - p) // s + 1
        W_out = (W - p) // s + 1
        out = np.zeros((B, C, H_out, W_out))

        for i in range(H_out):
            h_start = i * s
            h_end = h_start + p
            for j in range(W_out):
                w_start = j * s
                w_end = w_start + p
                patch = X[:, :, h_start:h_end, w_start:w_end]
                out[:, :, i, j] = np.max(patch, axis=(-2, -1))

        return out


# =====================================================================
# 3. ResNet Residual Block
# =====================================================================

class ResidualBlock:
    """ResNet Block: Output = ReLU(Conv2(ReLU(Conv1(X))) + Shortcut(X))"""

    def __init__(self, channels):
        self.conv1 = Conv2D(channels, channels, kernel_size=3, padding=1)
        self.conv2 = Conv2D(channels, channels, kernel_size=3, padding=1)

    def forward(self, X):
        identity = X
        # F(x) path
        out = self.conv1.forward(X)
        out = np.maximum(0.0, out)  # ReLU
        out = self.conv2.forward(out)
        # Residual connection + final ReLU
        out = out + identity
        out = np.maximum(0.0, out)
        return out


# =====================================================================
# Execution & Verification
# =====================================================================

if __name__ == '__main__':
    print("=== 1. Conv2D & Edge Detection Filter ===")
    # Create simple 6x6 test image with vertical edge
    img = np.array([
        [10, 10, 10, 0, 0, 0],
        [10, 10, 10, 0, 0, 0],
        [10, 10, 10, 0, 0, 0],
        [10, 10, 10, 0, 0, 0],
        [10, 10, 10, 0, 0, 0],
        [10, 10, 10, 0, 0, 0],
    ], dtype=float).reshape(1, 1, 6, 6)

    conv_edge = Conv2D(in_channels=1, out_channels=1, kernel_size=3, padding=1)
    # Set weights to Sobel vertical edge detector
    conv_edge.weights[0, 0] = np.array([
        [-1, 0, 1],
        [-2, 0, 2],
        [-1, 0, 1]
    ])
    conv_edge.bias[0] = 0.0

    edge_map = conv_edge.forward(img)
    print("Original Image Shape:", img.shape)
    print("Detected Edge Map (center column peak):\n", np.round(edge_map[0, 0], 1))

    print("\n=== 2. ResNet Residual Block Forward Pass ===")
    np.random.seed(42)
    feature_batch = np.random.randn(2, 4, 8, 8)  # Batch=2, Channels=4, 8x8
    res_block = ResidualBlock(channels=4)

    output = res_block.forward(feature_batch)
    print(f"Input Feature Shape:  {feature_batch.shape}")
    print(f"Output Feature Shape: {output.shape} (Dimension perfectly preserved!)")
    print("✓ Residual connection maintains uninterrupted signal highway!")

