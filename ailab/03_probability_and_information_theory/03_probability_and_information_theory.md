# Module 03: Probability, Statistics & Information Theory

All modern artificial intelligence systems are probabilistic machines. From Large Language Models predicting the next-token probability distribution $P(w_t \mid w_{<t})$ to Diffusion models approximating continuous score functions $\nabla_\mathbf{x} \log p(\mathbf{x})$, probability and information theory provide the mathematical language of learning and uncertainty.

Let us master Bayes' theorem, Maximum Likelihood Estimation, Shannon Entropy, Cross-Entropy Loss, and KL Divergence with clear intuition and step-by-step numerical examples!

---

## 1. Probability Fundamentals & Bayes' Rule

Let $X$ and $Y$ be random variables:
- **Joint Probability:** $P(X = x, Y = y)$ (probability both happen simultaneously).
- **Marginal Probability:** $P(X = x) = \sum_y P(X = x, Y = y)$ (summing over all possibilities of $Y$).
- **Conditional Probability:** $P(Y = y \mid X = x) = \frac{P(X = x, Y = y)}{P(X = x)}$.

### Bayes' Theorem: The Engine of Belief Updating
Bayes' Theorem provides the exact formula for updating our belief in a hypothesis $\theta$ after observing empirical evidence $\mathcal{D}$:

$$P(\theta \mid \mathcal{D}) = \frac{P(\mathcal{D} \mid \theta) P(\theta)}{P(\mathcal{D})} = \frac{P(\mathcal{D} \mid \theta) P(\theta)}{\sum_{\theta'} P(\mathcal{D} \mid \theta') P(\theta')}$$

- $P(\theta)$: **Prior** (Our initial belief before seeing data).
- $P(\mathcal{D} \mid \theta)$: **Likelihood** (How probable the observed data is given hypothesis $\theta$).
- $P(\theta \mid \mathcal{D})$: **Posterior** (Our updated belief after seeing data $\mathcal{D}$).
- $P(\mathcal{D})$: **Evidence / Marginal Likelihood** (Normalizing constant).

### Complete Step-by-Step Numerical Example (Medical Diagnosis)
Imagine a rare disease affects $1\%$ of the population ($P(\text{Disease}) = 0.01$).
A lab test has:
- **Sensitivity:** $P(\text{Positive} \mid \text{Disease}) = 0.95$ (True positive rate).
- **False Positive Rate:** $P(\text{Positive} \mid \text{No Disease}) = 0.05$.

A patient tests positive. What is the actual probability they have the disease?

1. **Prior:**
   $$P(D) = 0.01, \quad P(\neg D) = 0.99$$
2. **Likelihoods:**
   $$P(+ \mid D) = 0.95, \quad P(+ \mid \neg D) = 0.05$$
3. **Total Evidence $P(+)$:**
   $$P(+) = P(+ \mid D) P(D) + P(+ \mid \neg D) P(\neg D)$$
   $$P(+) = (0.95 \times 0.01) + (0.05 \times 0.99) = 0.0095 + 0.0495 = \mathbf{0.0590}$$
4. **Compute Posterior $P(D \mid +)$:**
   $$P(D \mid +) = \frac{0.0095}{0.0590} \approx \mathbf{0.161} \quad (16.1\%)$$

Despite a $95\%$ accurate test, the true chance is only $16.1\%$ because the base rate prior was so low! This exact Bayesian reasoning prevents AI classification systems from hallucinating rare diagnoses.

---

## 2. MLE vs MAP: How Models Learn

### Maximum Likelihood Estimation (MLE)
Given a dataset of independent observations $\mathcal{D} = \{\mathbf{x}_1, \dots, \mathbf{x}_N\}$, MLE finds the parameter $\theta$ that makes the observed data as likely as possible:

$$\theta_{\text{MLE}} = \arg\max_\theta \prod_{i=1}^N P(\mathbf{x}_i \mid \theta) = \arg\min_\theta \left[ -\sum_{i=1}^N \log P(\mathbf{x}_i \mid \theta) \right]$$

Minimizing the **Negative Log-Likelihood (NLL)** turns giant products of tiny decimals into stable sums of logarithms!

#### Why Gaussian Likelihood Equals Mean Squared Error (MSE)
Assume output errors are Gaussian noise $\epsilon \sim \mathcal{N}(0, \sigma^2)$:
$$P(y \mid \mathbf{x}, \mathbf{w}) = \frac{1}{\sqrt{2\pi\sigma^2}} \exp\left( -\frac{(y - \mathbf{w}^T \mathbf{x})^2}{2\sigma^2} \right)$$

Taking the negative logarithm:
$$-\log P(y \mid \mathbf{x}, \mathbf{w}) = \frac{1}{2\sigma^2} (y - \mathbf{w}^T \mathbf{x})^2 + \text{constant}$$

**Minimizing Mean Squared Error is mathematically identical to Maximum Likelihood Estimation under a Gaussian noise assumption!**

### Maximum A Posteriori (MAP) & Regularization
MAP adds a prior distribution $P(\theta)$ over weights:

$$\theta_{\text{MAP}} = \arg\max_\theta P(\theta \mid \mathcal{D}) = \arg\min_\theta \left[ -\sum_{i=1}^N \log P(\mathbf{x}_i \mid \theta) - \log P(\theta) \right]$$

- If $P(\theta) \sim \mathcal{N}(0, \tau^2)$ (Gaussian Prior): $-\log P(\theta) \propto \|\theta\|_2^2$ $\implies$ **$L_2$ Weight Decay / Ridge Regularization**.
- If $P(\theta) \propto \exp(-\lambda |\theta|)$ (Laplace Prior): $-\log P(\theta) \propto \|\theta\|_1$ $\implies$ **$L_1$ Lasso Regularization / Sparsity**.

---

## 3. Information Theory: Shannon Entropy

How much "surprise" or uncertainty is contained in a probability distribution?

Claude Shannon defined the **information content** (surprisal) of an event with probability $p$ as:

$$I(x) = -\log_2 P(x)$$

- If an event is guaranteed ($p = 1$): $I = -\log_2(1) = 0$ bits of surprise.
- If an event has $p = 0.5$: $I = -\log_2(0.5) = 1$ bit of surprise.
- If an event is rare ($p = 0.001$): $I = -\log_2(0.001) \approx 9.97$ bits of massive surprise.

### Shannon Entropy $H(P)$
Entropy is the expected surprisal across all possible outcomes:

$$H(P) = -\sum_{x} P(x) \log_2 P(x)$$

```
        Binary Entropy Curve H(p) for a Coin with P(Heads) = p
        
       H(p) ^
        1.0 +                      * (Max Entropy = 1.0 bit at p=0.5)
            |                    /   \
        0.8 |                   /     \
            |                  /       \
        0.5 |                 /         \
            |                /           \
        0.0 +---------------*-------------*----------------> p
            0.0            0.5           1.0
          Guaranteed Tails             Guaranteed Heads
```

#### Numeric Comparison:
1. **Fair Coin ($P = [0.5, 0.5]$):**
   $$H = -(0.5 \log_2 0.5 + 0.5 \log_2 0.5) = -(0.5(-1) + 0.5(-1)) = \mathbf{1.0 \text{ bit}}$$
2. **Biased Coin ($P = [0.9, 0.1]$):**
   $$H = -(0.9 \log_2 0.9 + 0.1 \log_2 0.1) = -(0.9(-0.152) + 0.1(-3.322)) = -(-0.137 - 0.332) = \mathbf{0.469 \text{ bits}}$$
3. **Fair 4-sided Die ($P = [0.25, 0.25, 0.25, 0.25]$):**
   $$H = -4 \times (0.25 \log_2 0.25) = -4 \times (0.25 \times -2) = \mathbf{2.0 \text{ bits}}$$

---

## 4. Cross-Entropy & Kullback-Leibler (KL) Divergence

### Cross-Entropy $H(P, Q)$
Cross-entropy measures the average number of bits needed to encode events from true distribution $P$ using an imperfect model distribution $Q$:

$$H(P, Q) = -\sum_{x} P(x) \log Q(x)$$

In LLM next-token training and classification, the ground-truth target is a one-hot vector $P = [0, \dots, 1, \dots, 0]$ where only index $y_{\text{true}}$ has probability $1$:

$$H(P, Q) = -\log Q(y_{\text{true}})$$

If the model predicts $Q(y_{\text{true}}) = 0.99$, loss is $-\ln(0.99) = 0.01$. If the model predicts $Q(y_{\text{true}}) = 0.01$, loss is $-\ln(0.01) = 4.60$!

### Kullback-Leibler (KL) Divergence
KL Divergence measures the relative entropy or statistical distance between model distribution $Q$ and true distribution $P$:

$$D_{KL}(P \parallel Q) = \sum_{x} P(x) \log\left(\frac{P(x)}{Q(x)}\right) = H(P, Q) - H(P)$$

Key mathematical properties:
1. **Non-negativity (Gibbs' Inequality):** $D_{KL}(P \parallel Q) \ge 0$, with equality if and only if $P = Q$.
2. **Asymmetric:** $D_{KL}(P \parallel Q) \neq D_{KL}(Q \parallel P)$ (It is a directed divergence, not a symmetric Euclidean distance!).

### Complete Numerical Walkthrough
Let the true distribution be $P = [0.8, 0.2]$.
Compare two model predictions:
- Model A: $Q_A = [0.7, 0.3]$
- Model B: $Q_B = [0.4, 0.6]$

1. **KL Divergence of Model A:**
   $$D_{KL}(P \parallel Q_A) = 0.8 \ln\left(\frac{0.8}{0.7}\right) + 0.2 \ln\left(\frac{0.2}{0.3}\right)$$
   $$= 0.8 \ln(1.1428) + 0.2 \ln(0.6667) = 0.8(0.1335) + 0.2(-0.4055) = 0.1068 - 0.0811 = \mathbf{0.0257}$$

2. **KL Divergence of Model B:**
   $$D_{KL}(P \parallel Q_B) = 0.8 \ln\left(\frac{0.8}{0.4}\right) + 0.2 \ln\left(\frac{0.2}{0.6}\right)$$
   $$= 0.8 \ln(2.0) + 0.2 \ln(0.3333) = 0.8(0.6931) + 0.2(-1.0986) = 0.5545 - 0.2197 = \mathbf{0.3348}$$

Model A is more than $13\times$ closer to the true distribution than Model B!

---

## 5. Frontier AI Connection: RLHF and DPO

In aligning frontier models (ChatGPT, Claude, LLaMA-3), pre-trained LLMs undergo **RLHF** (Reinforcement Learning from Human Feedback) or **DPO** (Direct Preference Optimization).

When training the model to maximize user preference rewards, there is a dangerous failure mode called **Reward Hacking**: the model might learn weird adversarial responses that game the reward classifier but produce nonsensical English.

To prevent this, the loss explicitly penalizes KL divergence from the original pre-trained model $\pi_{\text{ref}}$:

$$\mathcal{L}(\theta) = -\mathbb{E}[R(\mathbf{x}, \mathbf{y})] + \beta \, D_{KL}(\pi_\theta(\mathbf{y} \mid \mathbf{x}) \parallel \pi_{\text{ref}}(\mathbf{y} \mid \mathbf{x}))$$

The parameter $\beta$ acts as an information-theoretic leash: the aligned chatbot is allowed to become more helpful, but is physically constrained from drifting away from its foundation language knowledge!
