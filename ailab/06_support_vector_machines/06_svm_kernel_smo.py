"""
Module 06: Support Vector Machine (SVM) & RBF Kernel from Scratch
=================================================================
Concepts:
1. Primal vs Dual formulation and support vectors.
2. Radial Basis Function (RBF) Kernel: K(x, z) = exp(-gamma * ||x - z||^2).
3. Simplified Sequential Minimal Optimization (SMO) algorithm (Platt, 1998).
4. Classifying non-linearly separable concentric circles (which linear models fail on).
"""

import numpy as np


class KernelSVM:
    """Non-linear Support Vector Machine trained via simplified SMO."""

    def __init__(self, C=1.0, kernel='rbf', gamma=0.5, tol=1e-3, max_passes=5):
        self.C = C
        self.kernel_type = kernel
        self.gamma = gamma
        self.tol = tol
        self.max_passes = max_passes
        self.alphas = None
        self.b = 0.0
        self.X = None
        self.y = None

    def _kernel(self, x1, x2):
        if self.kernel_type == 'linear':
            return np.dot(x1, x2)
        elif self.kernel_type == 'rbf':
            diff = x1 - x2
            return np.exp(-self.gamma * np.dot(diff, diff))
        raise ValueError(f"Unknown kernel: {self.kernel_type}")

    def _decision_function(self, x):
        """Compute f(x) = sum_i alpha_i * y_i * K(x_i, x) + b"""
        val = self.b
        for i in range(len(self.alphas)):
            if self.alphas[i] > 1e-6:
                val += self.alphas[i] * self.y[i] * self._kernel(self.X[i], x)
        return val

    def fit(self, X, y):
        """
        Train using simplified Sequential Minimal Optimization (SMO).
        y must be in {-1, +1}.
        """
        n_samples = X.shape[0]
        self.X = X
        self.y = y.astype(float)
        self.alphas = np.zeros(n_samples)
        self.b = 0.0

        passes = 0
        while passes < self.max_passes:
            num_changed_alphas = 0
            for i in range(n_samples):
                Ei = self._decision_function(X[i]) - y[i]
                # Check KKT condition violation
                if (y[i] * Ei < -self.tol and self.alphas[i] < self.C) or \
                   (y[i] * Ei > self.tol and self.alphas[i] > 0):

                    # Select j != i randomly
                    j = i
                    while j == i:
                        j = np.random.randint(0, n_samples)
                    Ej = self._decision_function(X[j]) - y[j]

                    alpha_i_old = self.alphas[i]
                    alpha_j_old = self.alphas[j]

                    # Compute bounds L and H
                    if y[i] != y[j]:
                        L = max(0.0, self.alphas[j] - self.alphas[i])
                        H = min(self.C, self.C + self.alphas[j] - self.alphas[i])
                    else:
                        L = max(0.0, self.alphas[i] + self.alphas[j] - self.C)
                        H = min(self.C, self.alphas[i] + self.alphas[j])

                    if abs(L - H) < 1e-5:
                        continue

                    # Compute eta = 2*K(x_i, x_j) - K(x_i, x_i) - K(x_j, x_j)
                    eta = 2.0 * self._kernel(X[i], X[j]) - self._kernel(X[i], X[i]) - self._kernel(X[j], X[j])
                    if eta >= 0:
                        continue

                    # Update alpha_j
                    self.alphas[j] -= (y[j] * (Ei - Ej)) / eta
                    self.alphas[j] = np.clip(self.alphas[j], L, H)

                    if abs(self.alphas[j] - alpha_j_old) < 1e-5:
                        continue

                    # Update alpha_i
                    self.alphas[i] += y[i] * y[j] * (alpha_j_old - self.alphas[j])

                    # Update threshold b
                    b1 = self.b - Ei - y[i] * (self.alphas[i] - alpha_i_old) * self._kernel(X[i], X[i]) - \
                         y[j] * (self.alphas[j] - alpha_j_old) * self._kernel(X[i], X[j])
                    b2 = self.b - Ej - y[i] * (self.alphas[i] - alpha_i_old) * self._kernel(X[i], X[j]) - \
                         y[j] * (self.alphas[j] - alpha_j_old) * self._kernel(X[j], X[j])

                    if 0 < self.alphas[i] < self.C:
                        self.b = b1
                    elif 0 < self.alphas[j] < self.C:
                        self.b = b2
                    else:
                        self.b = (b1 + b2) / 2.0

                    num_changed_alphas += 1

            if num_changed_alphas == 0:
                passes += 1
            else:
                passes = 0

    def predict(self, X):
        preds = [1 if self._decision_function(x) >= 0.0 else -1 for x in X]
        return np.array(preds)


# =====================================================================
# Execution & Verification
# =====================================================================

if __name__ == '__main__':
    print("=== Training Non-Linear Kernel SVM on Concentric Rings ===")
    np.random.seed(42)
    # Inner circle (class +1)
    r_inner = np.random.uniform(0.0, 0.4, 60)
    theta_inner = np.random.uniform(0.0, 2 * np.pi, 60)
    X_inner = np.stack([r_inner * np.cos(theta_inner), r_inner * np.sin(theta_inner)], axis=1)
    y_inner = np.ones(60)

    # Outer ring (class -1)
    r_outer = np.random.uniform(0.7, 1.1, 60)
    theta_outer = np.random.uniform(0.0, 2 * np.pi, 60)
    X_outer = np.stack([r_outer * np.cos(theta_outer), r_outer * np.sin(theta_outer)], axis=1)
    y_outer = -np.ones(60)

    X_train = np.vstack([X_inner, X_outer])
    y_train = np.concatenate([y_inner, y_outer])

    svm = KernelSVM(C=5.0, kernel='rbf', gamma=2.0, max_passes=5)
    svm.fit(X_train, y_train)

    predictions = svm.predict(X_train)
    accuracy = np.mean(predictions == y_train) * 100
    n_sv = np.sum(svm.alphas > 1e-4)

    print(f"RBF Kernel SVM Classification Accuracy: {accuracy:.2f}%")
    print(f"Total Support Vectors Identified:       {n_sv} / {len(X_train)}")
    assert accuracy > 95.0, "Kernel SVM failed on non-linear rings"
    print("✓ Successfully separated concentric circular manifolds without computing infinite dimensions!")

