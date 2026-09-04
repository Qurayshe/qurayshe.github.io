"""
Module 05: Logistic Regression & The Adam Optimizer from Scratch
================================================================
Concepts:
1. Vectorized Sigmoid activation and Binary Cross-Entropy (BCE) loss.
2. Exact gradient calculation for weights and bias.
3. Adam Optimizer with first/second moment tracking and bias correction.
4. Comparison of Vanilla SGD vs Adam convergence on a binary classification dataset.
"""

import numpy as np


def sigmoid(z):
    """Numerically stable sigmoid function."""
    z = np.clip(z, -500.0, 500.0)
    return 1.0 / (1.0 + np.exp(-z))


def binary_cross_entropy(y_true, y_pred, eps=1e-15):
    """BCE Loss: - (1/N) sum[ y*log(y_hat) + (1-y)*log(1-y_hat) ]"""
    y_pred = np.clip(y_pred, eps, 1.0 - eps)
    return -np.mean(y_true * np.log(y_pred) + (1.0 - y_true) * np.log(1.0 - y_pred))


class AdamOptimizer:
    """Adaptive Moment Estimation (Adam) optimizer implementation."""

    def __init__(self, lr=0.01, beta1=0.9, beta2=0.999, eps=1e-8):
        self.lr = lr
        self.beta1 = beta1
        self.beta2 = beta2
        self.eps = eps
        self.m = None  # First moment vector
        self.v = None  # Second moment vector
        self.t = 0     # Timestep

    def step(self, param, grad):
        if self.m is None:
            self.m = np.zeros_like(param)
            self.v = np.zeros_like(param)

        self.t += 1
        # Update biased first and second moments
        self.m = self.beta1 * self.m + (1.0 - self.beta1) * grad
        self.v = self.beta2 * self.v + (1.0 - self.beta2) * (grad ** 2)

        # Bias correction
        m_hat = self.m / (1.0 - (self.beta1 ** self.t))
        v_hat = self.v / (1.0 - (self.beta2 ** self.t))

        # Parameter update
        param_updated = param - (self.lr / (np.sqrt(v_hat) + self.eps)) * m_hat
        return param_updated


class LogisticRegression:
    """Binary Logistic Regression with customizable optimizer (SGD or Adam)."""

    def __init__(self, optimizer='adam', lr=0.05, n_epochs=100):
        self.optimizer_type = optimizer
        self.lr = lr
        self.n_epochs = n_epochs
        self.weights = None
        self.bias = 0.0
        self.loss_history = []

    def fit(self, X, y):
        n_samples, n_features = X.shape
        np.random.seed(42)
        self.weights = np.random.randn(n_features) * 0.01
        self.bias = 0.0
        self.loss_history = []

        opt_w = AdamOptimizer(lr=self.lr) if self.optimizer_type == 'adam' else None
        opt_b = AdamOptimizer(lr=self.lr) if self.optimizer_type == 'adam' else None

        for epoch in range(1, self.n_epochs + 1):
            # Forward pass: z = Xw + b, y_hat = sigmoid(z)
            z = np.dot(X, self.weights) + self.bias
            y_hat = sigmoid(z)

            # Compute loss
            loss = binary_cross_entropy(y, y_hat)
            self.loss_history.append(loss)

            # Analytical gradients
            error = y_hat - y
            grad_w = np.dot(X.T, error) / n_samples
            grad_b = np.mean(error)

            # Optimizer step
            if self.optimizer_type == 'adam':
                self.weights = opt_w.step(self.weights, grad_w)
                self.bias = opt_b.step(self.bias, grad_b)
            else:  # Vanilla SGD
                self.weights -= self.lr * grad_w
                self.bias -= self.lr * grad_b

    def predict_proba(self, X):
        return sigmoid(np.dot(X, self.weights) + self.bias)

    def predict(self, X, threshold=0.5):
        return (self.predict_proba(X) >= threshold).astype(int)


# =====================================================================
# Execution & Verification
# =====================================================================

if __name__ == '__main__':
    print("=== Training Logistic Regression: Vanilla SGD vs Adam ===")
    np.random.seed(1337)
    # Generate 500 samples with 4 features
    X_syn = np.random.randn(500, 4)
    true_weights = np.array([2.5, -1.8, 0.5, -3.2])
    prob = sigmoid(np.dot(X_syn, true_weights) + 0.3)
    y_syn = (prob >= 0.5).astype(int)

    # Train SGD
    model_sgd = LogisticRegression(optimizer='sgd', lr=0.05, n_epochs=100)
    model_sgd.fit(X_syn, y_syn)

    # Train Adam
    model_adam = LogisticRegression(optimizer='adam', lr=0.05, n_epochs=100)
    model_adam.fit(X_syn, y_syn)

    acc_sgd = np.mean(model_sgd.predict(X_syn) == y_syn) * 100
    acc_adam = np.mean(model_adam.predict(X_syn) == y_syn) * 100

    print(f"Vanilla SGD Final Loss: {model_sgd.loss_history[-1]:.4f} | Accuracy: {acc_sgd:.2f}%")
    print(f"Adam Optimizer Final Loss: {model_adam.loss_history[-1]:.4f} | Accuracy: {acc_adam:.2f}%")
    print(f"True Weights: {true_weights}")
    print(f"Adam Recovered Weights: {np.round(model_adam.weights, 2)}")

