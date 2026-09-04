# Module 03: Probability, Statistics & Information Theory

All modern artificial intelligence systems are probabilistic machines. From language models estimating next-token probabilities $P(w_t | w_{<t})$ to diffusion models estimating score functions $\nabla_\mathbf{x} \log p(\mathbf{x})$, probability and information theory provide the mathematical vocabulary of uncertainty and learning. (•̀ᴗ•́)و

---

## 1. Probability Fundamentals & Bayes' Rule

Let $X$ and $Y$ be random variables.
- **Joint Probability:** $P(X = x, Y = y)$
- **Marginal Probability:** $P(X = x) = \sum_y P(X = x, Y = y)$
- **Conditional Probability:** $P(Y = y \mid X = x) = \frac{P(X = x, Y = y)}{P(X = x)}$

### Bayes' Theorem
The fundamental rule for updating beliefs given empirical evidence:

$$P(\theta \mid \mathcal{D}) = \frac{P(\mathcal{D} \mid \theta) P(\theta)}{P(\mathcal{D})}$$

Where:
- $P(\theta)$ is the **Prior** (initial hypothesis before seeing data).
- $P(\mathcal{D} \mid \theta)$ is the **Likelihood** (how probable the observed data is given parameters $\theta$).
- $P(\theta \mid \mathcal{D})$ is the **Posterior** (updated belief after observing data $\mathcal{D}$).
- $P(\mathcal{D}) = \int P(\mathcal{D} \mid \theta) P(\theta) d\theta$ is the **Evidence / Marginal Likelihood**.

---

## 2. MLE vs MAP: How Models Learn

### Maximum Likelihood Estimation (MLE)
Find parameters $\theta$ that maximize the likelihood of observing dataset $\mathcal{D} = \{\mathbf{x}^{(1)}, \dots, \mathbf{x}^{(N)}\}$:

$$\theta_{\text{MLE}} = \arg\max_\theta \prod_{i=1}^N P(\mathbf{x}^{(i)} \mid \theta) = \arg\min_\theta \left[ -\sum_{i=1}^N \log P(\mathbf{x}^{(i)} \mid \theta) \right]$$

Minimizing the **Negative Log-Likelihood (NLL)** is mathematically identical to minimizing Cross-Entropy Loss in classification!

### Maximum A Posteriori (MAP)
Incorporates a prior distribution $P(\theta)$ over weights:

$$\theta_{\text{MAP}} = \arg\max_\theta P(\theta \mid \mathcal{D}) = \arg\min_\theta \left[ -\sum_{i=1}^N \log P(\mathbf{x}^{(i)} \mid \theta) - \log P(\theta) \right]$$

> [!NOTE]
> - A **Gaussian Prior** $P(\theta) \sim \mathcal{N}(0, \sigma^2)$ produces $-\log P(\theta) \propto \|\theta\|_2^2$ ($L_2$ Weight Decay / Ridge Regularization).
> - A **Laplace Prior** $P(\theta) \propto \exp(-\lambda |\theta|)$ produces $-\log P(\theta) \propto \|\theta\|_1$ ($L_1$ Lasso Regularization / Sparsity).

---

## 3. Information Theory: Shannon Entropy

How much "surprise" or uncertainty is contained in an event or distribution?
Claude Shannon defined the **information content** (surprisal) of an event with probability $p$ as:

$$I(x) = -\log_2 P(x)$$

Rare events ($P \to 0$) convey immense information; guaranteed events ($P = 1$) convey zero information.

### Shannon Entropy $H(P)$
The expected information content across all possible outcomes:

$$H(P) = -\sum_{x} P(x) \log_2 P(x)$$

For a binary coin with probability of heads $p$:
$$H(p) = -p \log_2 p - (1-p) \log_2 (1-p)$$
Maximal entropy occurs at $p = 0.5$ ($H = 1$ bit of uncertainty).

---

## 4. Cross-Entropy & KL Divergence

### Cross-Entropy $H(P, Q)$
The average number of bits required to encode data from true distribution $P$ using an estimated model distribution $Q$:

$$H(P, Q) = -\sum_{x} P(x) \log Q(x)$$

In classification, $P$ is a one-hot vector $[0, \dots, 1, \dots, 0]$ and $Q$ is the model's softmax prediction vector:
$$H(P, Q) = -\log Q(y_{\text{true}})$$

### Kullback-Leibler (KL) Divergence $D_{KL}(P \parallel Q)$
Measures the relative entropy or statistical distance from distribution $Q$ to true distribution $P$:

$$D_{KL}(P \parallel Q) = \sum_x P(x) \log \left(\frac{P(x)}{Q(x)}\right) = H(P, Q) - H(P)$$

Key properties:
- $D_{KL}(P \parallel Q) \ge 0$ (Gibbs' Inequality, equals 0 iff $P = Q$).
- Asymmetric: $D_{KL}(P \parallel Q) \ne D_{KL}(Q \parallel P)$.

> [!IMPORTANT]
> KL Divergence is the fundamental constraint in **RLHF (Reinforcement Learning from Human Feedback)** and **DPO**: it prevents the aligned model from drifting too far from the base reference model ($D_{KL}(\pi_\theta \parallel \pi_{\text{ref}})$).

