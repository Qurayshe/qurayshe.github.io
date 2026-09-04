# Module 08: Regularization, Normalization & Training Dynamics

Deep networks contain millions or billions of parameters—far more than the number of training points. Why don't they simply memorize the dataset? And why don't activations explode or vanish as signals pass through 100+ layers? The answers lie in **Regularization** ($L_2$ weight decay, Dropout) and **Normalization** (LayerNorm, RMSNorm). Let's master the techniques that make ultra-deep architectures trainable! ️

---

## 1. The Bias-Variance Tradeoff & Overfitting

Total expected generalization error decomposes into three components:

$$\mathbb{E}[(y - \hat{f}(\mathbf{x}))^2] = \text{Bias}[\hat{f}(\mathbf{x})]^2 + \text{Var}[\hat{f}(\mathbf{x})] + \sigma^2$$

- **Underfitting (High Bias):** Model is too simple to capture the underlying pattern.
- **Overfitting (High Variance):** Model memorizes training noise instead of true generalizable signals.
- **Irreducible Error $\sigma^2$:** Noise inherent in the data collection process.

```
       Error ^
             |  \                     / Validation Error
             |   \       Sweet Spot  /
             |    \         (v)     /
             |     \_______......--'
             |      \
             |       \_________________ Training Error
             +-------------------------------> Model Capacity
                Underfitting      Overfitting
```

---

## 2. $L_1$ vs $L_2$ Regularization (Weight Decay)

Add a penalty on the magnitude of the model's weights to the loss function:

$$\mathcal{L}_{\text{total}} = \mathcal{L}_0 + \lambda \Omega(W)$$

1. **$L_2$ Regularization (Ridge / Weight Decay):** $\Omega(W) = \frac{1}{2} \|W\|_2^2 = \frac{1}{2} \sum w_{ij}^2$
   - Gradient: $\frac{\partial \Omega}{\partial W} = W$.
   - Parameter update: $W_{t+1} = (1 - \eta \lambda) W_t - \eta \nabla \mathcal{L}_0$.
   - **Effect:** Exponentially shrinks large weights toward zero, producing smooth decision surfaces.

2. **$L_1$ Regularization (Lasso):** $\Omega(W) = \|W\|_1 = \sum |w_{ij}|$
   - Gradient: $\frac{\partial \Omega}{\partial W} = \text{sign}(W)$.
   - **Effect:** Drives non-critical weights to **exactly zero**, performing automatic feature selection and inducing weight sparsity.

---

## 3. Inverted Dropout (Srivastava et al., 2014)

During training, randomly set each hidden activation to zero with probability $p$ (keep probability $q = 1 - p$):

$$m \sim \text{Bernoulli}(1 - p)$$
$$\tilde{a} = \frac{m \odot a}{1 - p}$$

Why scale by $\frac{1}{1 - p}$ during training?
- **Inverted Dropout:** Scaling up activations during training ensures that the expected value $\mathbb{E}[\tilde{a}] = a$ matches the test-time expectation. At inference/test time, **Dropout is disabled completely** with zero extra computational overhead!
- **Ensemble Interpretation:** Dropping out random units forces neurons to learn independent, non-co-adapted features—effectively ensembling $2^N$ sub-networks.

---

## 4. Layer Normalization vs RMSNorm

While **Batch Normalization (BatchNorm)** normalizes across the batch dimension (which fails on small batch sizes and variable sequence lengths), **Layer Normalization (LayerNorm)** normalizes across the feature dimension for each token independently:

$$\mu = \frac{1}{d} \sum_{i=1}^d x_i, \quad \sigma^2 = \frac{1}{d} \sum_{i=1}^d (x_i - \mu)^2$$
$$\text{LayerNorm}(\mathbf{x}) = \frac{\mathbf{x} - \mu}{\sqrt{\sigma^2 + \epsilon}} \odot \boldsymbol{\gamma} + \boldsymbol{\beta}$$

Where $\boldsymbol{\gamma}$ (scale) and $\boldsymbol{\beta}$ (shift) are learnable affine parameters.

### Modern SOTA: RMSNorm (Root Mean Square Normalization)
Zhang & Sennrich (2019) demonstrated that the computational cost of centering by mean $\mu$ provides negligible regularization benefit. **RMSNorm** simply scales by the root mean square:

$$\text{RMS}(\mathbf{x}) = \sqrt{\frac{1}{d} \sum_{i=1}^d x_i^2 + \epsilon}$$
$$\text{RMSNorm}(\mathbf{x}) = \frac{\mathbf{x}}{\text{RMS}(\mathbf{x})} \odot \boldsymbol{\gamma}$$

> [!NOTE]
> **RMSNorm** is used in modern frontier open-weights LLMs (LLaMA-3, Mistral, Gemma, Qwen) because it saves 7-10% kernel memory bandwidth on GPU without any loss in convergence stability.

---

## 5. Learning Rate Schedules: Cosine Annealing with Warmup

Modern neural network training does not use a constant learning rate.
1. **Linear Warmup:** For the first $T_{\text{warmup}}$ steps, increase $\eta$ linearly from $0$ to $\eta_{\max}$. This prevents early unstable gradients from destroying pre-trained or randomly initialized weights.
2. **Cosine Decay:** Decay the learning rate following a half cosine cycle:

$$\eta_t = \eta_{\min} + \frac{1}{2} (\eta_{\max} - \eta_{\min}) \left(1 + \cos\left(\frac{t - T_{\text{warmup}}}{T_{\text{total}} - T_{\text{warmup}}} \pi\right)\right)$$

