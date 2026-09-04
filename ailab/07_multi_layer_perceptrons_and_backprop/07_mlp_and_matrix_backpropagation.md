# Module 07: Multi-Layer Perceptrons (MLP) & Matrix Backpropagation

By stacking multiple linear layers separated by non-linear activation functions, the Multi-Layer Perceptron (MLP) breaks through the single-layer perceptron's linear barrier. According to the **Universal Approximation Theorem** (Cybenko 1989, Hornik 1991), a feedforward neural network with just one hidden non-linear layer can approximate any continuous function on compact subsets of $\mathbb{R}^n$ to arbitrary precision. Let's derive matrix backpropagation!

---

## 1. Network Forward Propagation & Matrix Notation

Let $X \in \mathbb{R}^{B \times d_{\text{in}}}$ be a batch of $B$ samples.
For each layer $l = 1, \dots, L$:

$$Z^{[l]} = A^{[l-1]} W^{[l]} + \mathbf{b}^{[l]}$$
$$A^{[l]} = g^{[l]}(Z^{[l]})$$

Where:
- $A^{[0]} = X$ is the input data batch.
- $W^{[l]} \in \mathbb{R}^{d_{l-1} \times d_l}$ is the weight matrix.
- $\mathbf{b}^{[l]} \in \mathbb{R}^{1 \times d_l}$ is the broadcasted bias row vector.
- $g^{[l]}$ is an element-wise non-linear activation function.

```
       [ Input X ] (B x d_in)
            |
            v
     [ Linear: W1, b1 ] ----> Z1 = X @ W1 + b1
            |
            v
     [ Activation: g ] -----> A1 = ReLU(Z1)
            |
            v
     [ Linear: W2, b2 ] ----> Z2 = A1 @ W2 + b2
            |
            v
     [ Softmax Loss ] ------> Loss L (Scalar)
```

---

## 2. Activation Functions: Dying ReLUs to Modern GELU

| Activation | Formula | Gradient | Notes & Tradeoffs |
| :--- | :--- | :--- | :--- |
| **Sigmoid** | $\sigma(z) = \frac{1}{1 + e^{-z}}$ | $\sigma(1 - \sigma)$ | Saturates at large $\|z\| \to$ vanishing gradients. Not zero-centered. |
| **Tanh** | $\tanh(z) = \frac{e^z - e^{-z}}{e^z + e^{-z}}$ | $1 - \tanh^2(z)$ | Zero-centered, but still suffers from saturation. |
| **ReLU** | $\max(0, z)$ | $1 \text{ if } z > 0 \text{ else } 0$ | Fast, no vanishing gradient for $z > 0$, but suffers from "Dying ReLU" when $z < 0$. |
| **GELU** | $z \cdot \Phi(z) \approx 0.5z(1 + \tanh(\sqrt{2/\pi}(z + 0.044715z^3)))$ | Smooth non-zero | **Modern Standard in Transformers (BERT, GPT-3/4, LLaMA)**. Probabilistic stochastic regularizer. |

---

## 3. The Full Matrix Backpropagation Derivation

Let $\mathcal{L}$ be the scalar loss.
Define the incoming error adjoint at layer $l$:
$$\delta^{[l]} \equiv \frac{\partial \mathcal{L}}{\partial Z^{[l]}} \in \mathbb{R}^{B \times d_l}$$

For the output layer paired with Softmax and Cross-Entropy, the combination simplifies to:
$$\delta^{[L]} = \frac{1}{B} (\hat{Y} - Y)$$

### Propagating Backwards Through Layers:
1. **Gradient with respect to weights $W^{[l]}$:**
   $$\frac{\partial \mathcal{L}}{\partial W^{[l]}} = (A^{[l-1]})^T \delta^{[l]} \in \mathbb{R}^{d_{l-1} \times d_l}$$

2. **Gradient with respect to bias $\mathbf{b}^{[l]}$:**
   $$\frac{\partial \mathcal{L}}{\partial \mathbf{b}^{[l]}} = \sum_{i=1}^B \delta_i^{[l]} \in \mathbb{R}^{1 \times d_l}$$

3. **Backpropagating through activation function:**
   $$\frac{\partial \mathcal{L}}{\partial A^{[l-1]}} = \delta^{[l]} (W^{[l]})^T \in \mathbb{R}^{B \times d_{l-1}}$$
   $$\delta^{[l-1]} = \frac{\partial \mathcal{L}}{\partial A^{[l-1]}} \odot g'^{[l-1]}(Z^{[l-1]})$$

> [!TIP]
> Notice the dimensions match automatically!
> Transposing $(A^{[l-1]})^T$ and $(W^{[l]})^T$ in matrix multiplication precisely aligns the row-column inner products with the multivariate chain rule!

---

## 4. Weight Initialization Mechanics

Why not initialize all weights to zero?
- If $W = \mathbf{0}$, every hidden neuron receives the identical gradient and computes the identical activation $\to$ **Symmetry breaking fails**!
- If weights are initialized too large $\to$ activations explode ($\infty$).
- If initialized too small $\to$ activations shrink to $0$ (vanishing signals).

### 1. Xavier / Glorot Initialization (for Tanh / Sigmoid):
$$W \sim \mathcal{N}\left(0, \; \frac{2}{d_{\text{in}} + d_{\text{out}}}\right)$$

### 2. He / Kaiming Initialization (for ReLU / GELU):
Because ReLU zeros out half of all activations on average, the variance must be doubled to preserve signal variance:
$$W \sim \mathcal{N}\left(0, \; \frac{2}{d_{\text{in}}}\right)$$

