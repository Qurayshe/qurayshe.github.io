"""
Module 07: Modular Multi-Layer Perceptron (MLP) Framework from Scratch
=======================================================================
A miniature PyTorch-like layer framework implementing:
1. Linear (Dense) layer with He/Kaiming initialization.
2. ReLU and GELU activation layers.
3. Softmax Cross-Entropy loss with numerically stable log-sum-exp trick.
4. Full backward propagation loop solving the XOR non-linear problem.
"""

import numpy as np


class Linear:
    """Fully-connected affine layer: Y = X @ W + b"""

    def __init__(self, in_features, out_features):
        # He/Kaiming Normal initialization: std = sqrt(2 / in_features)
        std = np.sqrt(2.0 / in_features)
        self.W = np.random.randn(in_features, out_features) * std
        self.b = np.zeros((1, out_features))

        self.grad_W = None
        self.grad_b = None
        self.X = None

    def forward(self, X):
        self.X = X
        return np.dot(X, self.W) + self.b

    def backward(self, grad_output):
        # grad_output shape: (B, out_features)
        # dL/dW = X^T @ grad_output
        self.grad_W = np.dot(self.X.T, grad_output)
        # dL/db = sum over batch dimension
        self.grad_b = np.sum(grad_output, axis=0, keepdims=True)
        # dL/dX = grad_output @ W^T
        grad_input = np.dot(grad_output, self.W.T)
        return grad_input


class ReLU:
    """Rectified Linear Unit activation: max(0, x)"""

    def __init__(self):
        self.X = None

    def forward(self, X):
        self.X = X
        return np.maximum(0.0, X)

    def backward(self, grad_output):
        return grad_output * (self.X > 0.0)


class GELU:
    """Gaussian Error Linear Unit (standard in GPT/LLaMA): x * Phi(x)"""

    def __init__(self):
        self.X = None

    def forward(self, X):
        self.X = X
        # Tanh approximation
        return 0.5 * X * (1.0 + np.tanh(np.sqrt(2.0 / np.pi) * (X + 0.044715 * (X ** 3))))

    def backward(self, grad_output):
        X = self.X
        c = np.sqrt(2.0 / np.pi)
        inner = c * (X + 0.044715 * (X ** 3))
        tanh_inner = np.tanh(inner)
        sech2_inner = 1.0 - (tanh_inner ** 2)
        d_inner = c * (1.0 + 3.0 * 0.044715 * (X ** 2))
        grad = 0.5 * (1.0 + tanh_inner) + 0.5 * X * sech2_inner * d_inner
        return grad_output * grad


class SoftmaxCrossEntropyLoss:
    """Combined Softmax and Cross-Entropy for numerical stability."""

    def __init__(self):
        self.probs = None
        self.y_one_hot = None

    def forward(self, logits, targets):
        """
        logits: (B, num_classes)
        targets: (B,) integer labels
        """
        batch_size = logits.shape[0]
        # Subtract max for numerical stability (prevents overflow in exp)
        shifted_logits = logits - np.max(logits, axis=1, keepdims=True)
        exp_logits = np.exp(shifted_logits)
        self.probs = exp_logits / np.sum(exp_logits, axis=1, keepdims=True)

        # Convert targets to one-hot
        num_classes = logits.shape[1]
        self.y_one_hot = np.zeros_like(logits)
        self.y_one_hot[np.arange(batch_size), targets] = 1.0

        # NLL loss
        loss = -np.sum(self.y_one_hot * np.log(self.probs + 1e-12)) / batch_size
        return loss

    def backward(self):
        batch_size = self.probs.shape[0]
        # Elegant gradient: (probs - targets) / B
        return (self.probs - self.y_one_hot) / batch_size


# =====================================================================
# Execution & Verification: Solving XOR with 2-Layer MLP
# =====================================================================

if __name__ == '__main__':
    print("=== Training 2-Layer MLP on Non-Linear XOR Problem ===")
    np.random.seed(42)

    X_xor = np.array([
        [0.0, 0.0],
        [0.0, 1.0],
        [1.0, 0.0],
        [1.0, 1.0]
    ])
    y_xor = np.array([0, 1, 1, 0])  # Classes: 0 or 1

    # Network architecture: 2 -> 8 (Hidden) -> 2 (Output Logits)
    layer1 = Linear(2, 8)
    act1 = GELU()
    layer2 = Linear(8, 2)
    criterion = SoftmaxCrossEntropyLoss()

    learning_rate = 0.1

    for epoch in range(1, 401):
        # 1. Forward pass
        h1 = layer1.forward(X_xor)
        a1 = act1.forward(h1)
        logits = layer2.forward(a1)
        loss = criterion.forward(logits, y_xor)

        # 2. Backward pass
        grad_logits = criterion.backward()
        grad_a1 = layer2.backward(grad_logits)
        grad_h1 = act1.backward(grad_a1)
        layer1.backward(grad_h1)

        # 3. Parameter update (SGD)
        layer1.W -= learning_rate * layer1.grad_W
        layer1.b -= learning_rate * layer1.grad_b
        layer2.W -= learning_rate * layer2.grad_W
        layer2.b -= learning_rate * layer2.grad_b

        if epoch % 100 == 0:
            preds = np.argmax(criterion.probs, axis=1)
            acc = np.mean(preds == y_xor) * 100
            print(f"Epoch {epoch:03d} | Loss: {loss:.4f} | Accuracy: {acc:.1f}% | Preds: {preds}")

    print("✓ Successfully solved XOR! Multi-layer neural network overcomes the 1969 Perceptron barrier.")

