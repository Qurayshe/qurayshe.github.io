# Module 05: Logistic Regression, Optimization & The Adam Optimizer

While the perceptron outputs a rigid binary $\pm 1$, real-world decisions require calibrated probabilities. Logistic regression bridges continuous linear combinations and probabilistic outputs via the sigmoid function, optimized through cross-entropy loss and gradient descent. Let's derive the mathematics of modern optimizers! (•̀ᴗ•́)و

---

## 1. The Logistic Sigmoid Function & Log-Odds

To model binary probabilities $p \in (0, 1)$, we apply the **logistic sigmoid** $\sigma(z)$ to the linear pre-activation $z = \mathbf{w}^T \mathbf{x} + b$:

$$\sigma(z) = \frac{1}{1 + e^{-z}} = \frac{e^z}{1 + e^z}$$

```
                σ(z)
                 1 |              .--------
                   |            /
               0.5 |----------/----------- (Decision boundary: z=0)
                   |        /
                 0 | ______/
                   +------------------------ z
                          -4   -2   0   2   4
```

### Beautiful Derivative Property
The derivative of the sigmoid is expressed cleanly in terms of its own output:

$$\frac{d\sigma(z)}{dz} = \sigma(z)(1 - \sigma(z))$$

### Log-Odds (Logit)
$$\log\left(\frac{P(y=1|\mathbf{x})}{1 - P(y=1|\mathbf{x})}\right) = \mathbf{w}^T \mathbf{x} + b$$
The linear term directly models the log-odds of the positive class.

---

## 2. Binary Cross-Entropy Loss (Log-Loss)

Using Maximum Likelihood Estimation, for labels $y_i \in \{0, 1\}$ and predicted probabilities $\hat{y}_i = \sigma(\mathbf{w}^T \mathbf{x}_i + b)$:

$$\mathcal{L}(\mathbf{w}, b) = -\frac{1}{N} \sum_{i=1}^N \Big[ y_i \log(\hat{y}_i) + (1 - y_i) \log(1 - \hat{y}_i) \Big]$$

### The Clean Gradient Formula
Applying the chain rule, the sigmoid derivative cancels out the denominator of the log derivative:

$$\frac{\partial \mathcal{L}}{\partial \mathbf{w}} = \frac{1}{N} X^T (\hat{\mathbf{y}} - \mathbf{y})$$
$$\frac{\partial \mathcal{L}}{\partial b} = \frac{1}{N} \sum_{i=1}^N (\hat{y}_i - y_i)$$

Notice the stunning simplicity: the gradient is simply the feature matrix multiplied by the **residual error vector** $(\hat{\mathbf{y}} - \mathbf{y})$!

---

## 3. The Evolution of Gradient Optimizers

```
 Vanilla SGD ──> Momentum (Polyak) ──> RMSprop (Hinton) ──> Adam (Kingma & Ba)
 (Oscillates)    (Damps vibrations)     (Per-parameter LR)   (First + Second Moments)
```

### 1. Stochastic Gradient Descent (SGD)
$$\mathbf{w}_{t+1} = \mathbf{w}_t - \eta \mathbf{g}_t$$
Suffers from ravines with high curvature: bounces wildly along steep dimensions and crawls along shallow dimensions.

### 2. SGD with Momentum
Accumulates an exponentially decaying velocity vector $v_t$:
$$\mathbf{v}_t = \beta_1 \mathbf{v}_{t-1} + (1 - \beta_1) \mathbf{g}_t$$
$$\mathbf{w}_{t+1} = \mathbf{w}_t - \eta \mathbf{v}_t$$
Dampens perpendicular oscillations and accelerates along flat consistent directions.

### 3. RMSprop
Normalizes learning rate by the moving average of squared gradients:
$$\mathbf{s}_t = \beta_2 \mathbf{s}_{t-1} + (1 - \beta_2) \mathbf{g}_t^2$$
$$\mathbf{w}_{t+1} = \mathbf{w}_t - \frac{\eta}{\sqrt{\mathbf{s}_t} + \epsilon} \mathbf{g}_t$$

### 4. Adam (Adaptive Moment Estimation - Kingma & Ba, 2014)
Combines **Momentum** (first moment $m_t$) and **RMSprop** (second raw moment $v_t$) with critical **bias correction**:

1. First moment estimate:
   $$\mathbf{m}_t = \beta_1 \mathbf{m}_{t-1} + (1 - \beta_1) \mathbf{g}_t$$
2. Second raw moment estimate:
   $$\mathbf{v}_t = \beta_2 \mathbf{v}_{t-1} + (1 - \beta_2) \mathbf{g}_t^2$$
3. Bias-correction (counteracting zero-initialization in early iterations):
   $$\hat{\mathbf{m}}_t = \frac{\mathbf{m}_t}{1 - \beta_1^t}, \quad \hat{\mathbf{v}}_t = \frac{\mathbf{v}_t}{1 - \beta_2^t}$$
4. Parameter update:
   $$\mathbf{w}_{t+1} = \mathbf{w}_t - \frac{\eta}{\sqrt{\hat{\mathbf{v}}_t} + \epsilon} \hat{\mathbf{m}}_t$$

Standard default hyperparameters: $\eta = 0.001$, $\beta_1 = 0.9$, $\beta_2 = 0.999$, $\epsilon = 10^{-8}$. Adam remains the default workhorse optimizer across all deep learning architectures.

