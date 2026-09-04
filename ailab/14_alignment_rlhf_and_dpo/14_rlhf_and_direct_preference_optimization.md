# Module 14: Alignment: RLHF & Direct Preference Optimization (DPO)

Pre-trained LLMs are raw probability engines: given a toxic or dangerous prompt, they complete it with high probability because internet text contains toxicity. **Alignment** steers models to be Helpful, Honest, and Harmless (HHH). While the original ChatGPT used **Reinforcement Learning from Human Feedback (RLHF)** with PPO and separate reward models, the modern SOTA has largely transitioned to **Direct Preference Optimization (DPO)**—solving preference optimization in closed-form with a single classification loss!

---

## 1. The Preference Modeling Formulation

Given a prompt $x$ and a pair of candidate responses $(y_w, y_l)$ where human evaluators prefer $y_w$ (winning response) over $y_l$ (losing response):
$$y_w \succ y_l \mid x$$

### The Bradley-Terry Preference Model (1952)
The probability that human annotators prefer $y_w$ over $y_l$ is modeled using a latent scalar reward function $r(x, y)$:

$$P(y_w \succ y_l \mid x) = \sigma\left( r(x, y_w) - r(x, y_l) \right) = \frac{1}{1 + e^{-(r(x, y_w) - r(x, y_l))}}$$

---

## 2. Classic RLHF Pipeline (Ouyang et al., 2022 - InstructGPT)

RLHF operates in three distinct phases:

```
 [ Step 1: Pre-training ]
           |
           v
 [ Step 2: Supervised Fine-Tuning (SFT) ]  (Instruction-following demonstrations)
           |
           v
 [ Step 3: Train Reward Model r_phi ]       (Ranked pairs via Bradley-Terry loss)
           |
           v
 [ Step 4: PPO Policy Optimization ]        (Actor, Critic, Reference Model, Value Network)
```

### The PPO RL Objective with KL Penalty:
$$\max_{\pi_\theta} \mathbb{E}_{x \sim \mathcal{D}, y \sim \pi_\theta} \left[ r_\phi(x, y) \right] - \beta D_{KL}\left( \pi_\theta(y \mid x) \;\parallel\; \pi_{\text{ref}}(y \mid x) \right)$$

Where $\pi_{\text{ref}}$ is the frozen SFT model. The KL penalty prevents **Reward Hacking** (where the model outputs degenerate gibberish that exploits quirks in the reward model).

**The Major Pain Points of RLHF:**
1. Extremely unstable: Requires maintaining **4 separate large models in GPU memory** simultaneously (Policy $\pi_\theta$, Value Critic $V_\psi$, Reward Model $r_\phi$, Reference Model $\pi_{\text{ref}}$).
2. Fragile hyperparameter tuning with PPO policy clipping.

---

## 3. The DPO Breakthrough (Rafailov et al., NeurIPS 2023)

Rafailov et al. asked a profound theoretical question:
*"Can we mathematically re-parameterize the RL reward function directly in terms of the optimal policy $\pi^*$?"*

By solving the constrained RL objective analytically, the optimal policy satisfies:
$$\pi^*(y \mid x) = \frac{1}{Z(x)} \pi_{\text{ref}}(y \mid x) \exp\left( \frac{1}{\beta} r(x, y) \right)$$

Taking logarithms and rearranging reveals that **the reward is implicitly defined by the log-ratio of the policy to the reference model**:

$$r(x, y) = \beta \log \left( \frac{\pi^*(y \mid x)}{\pi_{\text{ref}}(y \mid x)} \right) + \beta \log Z(x)$$

### The Closed-Form DPO Loss Function
Substituting this implicit reward expression directly into the Bradley-Terry preference objective causes the partition function $Z(x)$ to cancel out completely!

$$\mathcal{L}_{\text{DPO}}(\theta; \pi_{\text{ref}}) = -\mathbb{E}_{(x, y_w, y_l) \sim \mathcal{D}} \left[ \log \sigma \left( \beta \log \frac{\pi_\theta(y_w \mid x)}{\pi_{\text{ref}}(y_w \mid x)} - \beta \log \frac{\pi_\theta(y_l \mid x)}{\pi_{\text{ref}}(y_l \mid x)} \right) \right]$$

### Why DPO Changed the Field:
- **No Reinforcement Learning:** No action sampling, no actor-critic loops, no reward models.
- **Single Training Phase:** Standard binary classification gradient descent directly on token log-probabilities.
- **Memory Efficient:** Only the active model $\pi_\theta$ and frozen reference $\pi_{\text{ref}}$ are required.
- Adopted in the post-training pipelines of **Llama 3, Mistral NeMo, Zephyr, and DeepSeek**.

