# Module 11: Scaled Dot-Product Attention, Transformers & RoPE

In 2017, Vaswani et al. published *"Attention Is All You Need"*, forever changing the trajectory of computing. While RNNs processed tokens sequentially ($O(N)$ sequential operations), the **Transformer** processes an entire context window in parallel ($O(1)$ sequential operations) via the **Attention Mechanism**. Every modern foundation model—from GPT-4 to Claude, Gemini, LLaMA, and AlphaFold—is built on this exact architecture!

---

## 1. Information Retrieval Analogy: Query, Key, Value

Think of Attention as a fuzzy database lookup:
- **Query ($Q$):** What the current token is searching for.
- **Key ($K$):** What each candidate token in the sequence possesses or advertises.
- **Value ($V$):** The actual informational content of the token to be extracted.

Given input embeddings $X \in \mathbb{R}^{B \times L \times d_{\text{model}}}$, we project them into query, key, and value spaces:
$$Q = X W_Q, \quad K = X W_K, \quad V = X W_V$$

---

## 2. Scaled Dot-Product Attention Math

$$\text{Attention}(Q, K, V) = \text{softmax}\left( \frac{Q K^T}{\sqrt{d_k}} + M \right) V$$

```
   Q (L x d_k)   *   K^T (d_k x L)
         \               /
          v             v
       [ Raw Logits (L x L) ]
                 |
                 v   / sqrt(d_k)   (Scaling prevents softmax saturation)
       [ Scaled Logits ]
                 |
                 v   + M           (Causal Mask: sets future positions to -inf)
       [ Masked Logits ]
                 |
                 v   softmax
       [ Attention Weights A (L x L) ] (Each row sums to 1.0)
                 |
                 v   * V (L x d_v)
       [ Contextual Embeddings (L x d_v) ]
```

### Why Scale by $\frac{1}{\sqrt{d_k}}$?
If elements of $Q$ and $K$ are independent random variables with mean 0 and variance 1:
$$\mathbb{E}[q \cdot k] = 0, \quad \text{Var}[q \cdot k] = \sum_{i=1}^{d_k} \text{Var}[q_i k_i] = d_k$$
As dimension $d_k$ grows large (e.g. 64 or 128), dot products grow proportionally to $\sqrt{d_k}$, pushing values into regions where the softmax gradient approaches zero! Dividing by $\sqrt{d_k}$ preserves unit variance ($\text{Var} = 1$).

### Causal Masking (Autoregressive Generation)
For generative language models, token $t$ cannot look into the future ($t' > t$). We add an upper-triangular mask matrix $M$:
$$M_{ij} = \begin{cases} 0 & \text{if } j \le i \\ -\infty & \text{if } j > i \end{cases}$$
Since $e^{-\infty} = 0$, attention weights to future tokens become identically zero!

---

## 3. Multi-Head Attention (MHA)

Instead of performing a single attention function, Multi-Head Attention splits the hidden dimension across $h$ heads ($d_k = d_{\text{model}} / h$):

$$\text{MultiHead}(Q, K, V) = \text{Concat}(\text{head}_1, \dots, \text{head}_h) W_O$$
$$\text{head}_i = \text{Attention}(Q W_Q^{(i)}, K W_K^{(i)}, V W_V^{(i)})$$

**Why multiple heads?**
Different heads attend to distinct linguistic features simultaneously:
- Head 1 attends to immediate preceding punctuation.
- Head 2 links pronouns ("it", "she") to their distant noun antecedents.
- Head 3 tracks subject-verb agreement across long clauses.

---

## 4. Modern Positional Encoding: Rotary Position Embedding (RoPE)

Transformers are permutation-invariant: without positional cues, "dog bites man" is identical to "man bites dog".
While the original Transformer added static sinusoidal absolute vectors ($x_t + p_t$), modern SOTA LLMs (LLaMA, Mistral, PaLM, Qwen) use **Rotary Position Embeddings (RoPE - Su et al., 2021)**.

RoPE encodes relative position by rotating 2D coordinate pairs of query and key vectors in the complex plane by an angle proportional to token position $m$:

$$R_{\Theta, m}^d = \text{diag}\left( R_{\theta_1, m}, R_{\theta_2, m}, \dots, R_{\theta_{d/2}, m} \right)$$
$$R_{\theta_i, m} = \begin{bmatrix} \cos(m \theta_i) & -\sin(m \theta_i) \\ \sin(m \theta_i) & \cos(m \theta_i) \end{bmatrix}$$

$$\tilde{\mathbf{q}}_m = R_{\Theta, m} \mathbf{q}_m, \quad \tilde{\mathbf{k}}_n = R_{\Theta, n} \mathbf{k}_n$$

### The Inner Product Invariance Property
$$\langle \tilde{\mathbf{q}}_m, \tilde{\mathbf{k}}_n \rangle = \mathbf{q}_m^T R_{\Theta, m}^T R_{\Theta, n} \mathbf{k}_n = \mathbf{q}_m^T R_{\Theta, n - m} \mathbf{k}_n = g(\mathbf{q}_m, \mathbf{k}_n, m - n)$$

The attention score depends **purely on relative distance $m - n$**, enabling seamless context window extension and long-context extrapolation!

