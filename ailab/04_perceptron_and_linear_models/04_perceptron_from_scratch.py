"""
Module 04: The Rosenblatt Perceptron from Scratch
=================================================
Concepts:
1. Perceptron forward prediction with step function.
2. The Novikoff learning update rule: w <- w + eta * y * x.
3. Training on linearly separable Boolean gates (AND, OR).
4. Demonstrating the historic 1969 XOR failure (linear separability bound).
"""

import numpy as np


class RosenblattPerceptron:
    """Classic 1958 Frank Rosenblatt Perceptron Classifier."""

    def __init__(self, learning_rate=0.1, max_epochs=100):
        self.lr = learning_rate
        self.max_epochs = max_epochs
        self.weights = None
        self.bias = 0.0
        self.mistake_history = []

    def predict_raw(self, X):
        """Compute pre-activation dot product: z = w^T x + b"""
        return np.dot(X, self.weights) + self.bias

    def predict(self, X):
        """Pass through step function: +1 if z >= 0 else -1"""
        raw = self.predict_raw(X)
        return np.where(raw >= 0.0, 1, -1)

    def fit(self, X, y):
        """
        Train using Perceptron learning rule.
        Target labels y must be in {-1, +1}.
        """
        n_samples, n_features = X.shape
        self.weights = np.zeros(n_features)
        self.bias = 0.0
        self.mistake_history = []

        for epoch in range(1, self.max_epochs + 1):
            mistakes = 0
            for xi, target in zip(X, y):
                pred = 1 if (np.dot(xi, self.weights) + self.bias) >= 0.0 else -1
                # If misclassified, update weights
                if pred != target:
                    update = self.lr * target
                    self.weights += update * xi
                    self.bias += update
                    mistakes += 1

            self.mistake_history.append(mistakes)
            if mistakes == 0:
                print(f"-> Converged in {epoch} epochs with 0 mistakes!")
                return True

        print(f"-> Did NOT converge within {self.max_epochs} epochs.")
        return False


# =====================================================================
# Execution & Verification
# =====================================================================

if __name__ == '__main__':
    # 1. Linearly Separable: Boolean AND Gate
    print("=== 1. Training Perceptron on Boolean AND Gate ===")
    X_and = np.array([
        [0.0, 0.0],
        [0.0, 1.0],
        [1.0, 0.0],
        [1.0, 1.0]
    ])
    # Labels: -1 for False, +1 for True
    y_and = np.array([-1, -1, -1, 1])

    clf_and = RosenblattPerceptron(learning_rate=0.1, max_epochs=20)
    converged = clf_and.fit(X_and, y_and)
    print("AND Weights:", clf_and.weights, "Bias:", clf_and.bias)
    print("Predictions:", clf_and.predict(X_and), "Expected:", y_and)

    # 2. Linearly Separable: Boolean OR Gate
    print("\n=== 2. Training Perceptron on Boolean OR Gate ===")
    y_or = np.array([-1, 1, 1, 1])
    clf_or = RosenblattPerceptron(learning_rate=0.1, max_epochs=20)
    clf_or.fit(X_or := X_and, y_or)
    print("OR Weights:", clf_or.weights, "Bias:", clf_or.bias)
    print("Predictions:", clf_or.predict(X_or), "Expected:", y_or)

    # 3. Non-Linearly Separable: The XOR Catastrophe (Minsky & Papert 1969)
    print("\n=== 3. Testing XOR Gate (Minsky & Papert Proof) ===")
    y_xor = np.array([-1, 1, 1, -1])  # (0,0)->-1, (0,1)->+1, (1,0)->+1, (1,1)->-1
    clf_xor = RosenblattPerceptron(learning_rate=0.1, max_epochs=25)
    converged = clf_xor.fit(X_and, y_xor)
    print("XOR Predictions:", clf_xor.predict(X_and), "Expected:", y_xor)
    accuracy = np.mean(clf_xor.predict(X_and) == y_xor) * 100
    print(f"Accuracy on XOR: {accuracy:.1f}% (Single-layer perceptron cannot exceed 75% on XOR)")

