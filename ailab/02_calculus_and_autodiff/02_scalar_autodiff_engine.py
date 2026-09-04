"""
Module 02: Scalar Reverse-Mode Automatic Differentiation Engine
===============================================================
A complete computational graph autograd engine built from scratch.
Implements:
1. Dynamic Computational Graph (DAG) construction with operator overloading.
2. Topological sorting to order gradient evaluations.
3. Reverse-mode backpropagation for computing exact analytical gradients.
4. Optimization of a 2D Rosenbrock function using gradient descent.
"""

import math


class Value:
    """Stores a single scalar value and its accumulated gradient."""

    def __init__(self, data, _children=(), _op='', label=''):
        self.data = float(data)
        self.grad = 0.0
        self._backward = lambda: None
        self._prev = set(_children)
        self._op = _op
        self.label = label

    def __repr__(self):
        return f"Value(data={self.data:.4f}, grad={self.grad:.4f})"

    def __add__(self, other):
        other = other if isinstance(other, Value) else Value(other)
        out = Value(self.data + other.data, (self, other), '+')

        def _backward():
            # d(x + y)/dx = 1, d(x + y)/dy = 1
            self.grad += 1.0 * out.grad
            other.grad += 1.0 * out.grad

        out._backward = _backward
        return out

    def __radd__(self, other):
        return self + other

    def __mul__(self, other):
        other = other if isinstance(other, Value) else Value(other)
        out = Value(self.data * other.data, (self, other), '*')

        def _backward():
            # d(x * y)/dx = y, d(x * y)/dy = x
            self.grad += other.data * out.grad
            other.grad += self.data * out.grad

        out._backward = _backward
        return out

    def __rmul__(self, other):
        return self * other

    def __pow__(self, power):
        assert isinstance(power, (int, float)), "Supporting int/float powers for now"
        out = Value(self.data ** power, (self,), f'**{power}')

        def _backward():
            # d(x^p)/dx = p * x^(p - 1)
            self.grad += (power * (self.data ** (power - 1))) * out.grad

        out._backward = _backward
        return out

    def __neg__(self):
        return self * -1

    def __sub__(self, other):
        return self + (-other)

    def __rsub__(self, other):
        return other + (-self)

    def __truediv__(self, other):
        return self * (other ** -1)

    def exp(self):
        x = self.data
        out = Value(math.exp(x), (self,), 'exp')

        def _backward():
            # d(e^x)/dx = e^x
            self.grad += out.data * out.grad

        out._backward = _backward
        return out

    def relu(self):
        out = Value(max(0.0, self.data), (self,), 'ReLU')

        def _backward():
            # d(ReLU(x))/dx = 1 if x > 0 else 0
            self.grad += (1.0 if self.data > 0 else 0.0) * out.grad

        out._backward = _backward
        return out

    def backward(self):
        """Topological sort of the DAG followed by reverse-mode chain rule propagation"""
        topo = []
        visited = set()

        def build_topo(v):
            if v not in visited:
                visited.add(v)
                for child in v._prev:
                    build_topo(child)
                topo.append(v)

        build_topo(self)

        # Base case: d(Output)/d(Output) = 1.0
        self.grad = 1.0

        # Traverse in reverse topological order
        for node in reversed(topo):
            node._backward()


# =====================================================================
# Verification & Optimization Demo
# =====================================================================

if __name__ == '__main__':
    print("=== 1. Validating Autodiff Chain Rule vs Analytical Math ===")
    # Equation: L = (x * y + exp(x))**2
    x = Value(1.5, label='x')
    y = Value(2.0, label='y')

    # Forward pass
    xy = x * y
    expx = x.exp()
    sum_term = xy + expx
    L = sum_term ** 2

    # Backward pass
    L.backward()

    print(f"L value: {L.data:.6f}")
    print(f"dL/dx (autodiff): {x.grad:.6f}")
    print(f"dL/dy (autodiff): {y.grad:.6f}")

    # Exact manual analytical derivative:
    # dL/dy = 2 * (x*y + exp(x)) * x = 2 * (3.0 + 4.481689) * 1.5 = 22.445067
    exact_dL_dy = 2.0 * (x.data * y.data + math.exp(x.data)) * x.data
    print(f"dL/dy (exact analytical): {exact_dL_dy:.6f}")
    assert abs(y.grad - exact_dL_dy) < 1e-5, "Gradient verification failed!"
    print("✓ Autodiff gradient matches exact analytical calculation!")

    print("\n=== 2. Minimizing 2D Function via Gradient Descent ===")
    # Target: Minimize f(w1, w2) = (w1 - 3)^2 + 2 * (w2 + 4)^2
    # Global minimum is at w1 = 3.0, w2 = -4.0
    w1 = Value(0.0)
    w2 = Value(0.0)
    learning_rate = 0.1

    print(f"Starting weights: w1={w1.data:.2f}, w2={w2.data:.2f}")
    for epoch in range(1, 41):
        # Forward pass
        loss = (w1 - 3.0) ** 2 + 2.0 * ((w2 + 4.0) ** 2)

        # Reset gradients
        w1.grad = 0.0
        w2.grad = 0.0

        # Backward pass
        loss.backward()

        # Parameter update (Gradient Descent)
        w1.data -= learning_rate * w1.grad
        w2.data -= learning_rate * w2.grad

        if epoch % 10 == 0:
            print(f"Epoch {epoch:02d} | Loss: {loss.data:.6f} | w1: {w1.data:.4f}, w2: {w2.data:.4f}")

    print(f"Converged weights: w1={w1.data:.4f} (target 3.0), w2={w2.data:.4f} (target -4.0)")

