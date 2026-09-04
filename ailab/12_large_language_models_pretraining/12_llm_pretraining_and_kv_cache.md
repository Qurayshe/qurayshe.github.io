# Module 12: Large Language Models (LLM) Pretraining & KV-Caching

Modern Large Language Models (LLMs) like GPT-4, LLaMA-3, and Mistral are autoregressive decoder-only Transformers trained to do one simple task at monumental scale: **predict the next token**. When scaled across billions of parameters and trillions of tokens, this simple objective unlocks emergent reasoning, coding, and synthesis capabilities. But how do we generate tokens efficiently without recomputing past context? Enter **KV-Caching**!

---

## 1. The Autoregressive Pre-training Objective

Given a tokenized text sequence $\mathbf{x} = (x_1, x_2, \dots, x_T)$, the joint probability factorizes via the probability chain rule:

$$P(\mathbf{x}) = \prod_{t=1}^T P(x_t \mid x_1, \dots, x_{t-1})$$

The training objective is **Causal Language Modeling (CLM)**, minimizing the average Negative Log-Likelihood:

$$\mathcal{L}(\theta) = -\frac{1}{T} \sum_{t=1}^T \log P_\theta(x_t \mid x_{<t})$$

### Chinchilla Scaling Laws (Hoffmann et al., 2022)
DeepMind demonstrated that model parameters $N$ and training dataset tokens $D$ should scale in equal proportion:
- Optimal token-to-parameter ratio is approximately **20 tokens per parameter**.
- A 70B parameter model requires at least 1.4 trillion tokens for compute-optimal pre-training.

---

## 2. Tokenization: Byte-Pair Encoding (BPE)

LLMs do not process raw characters or words. They operate on subword tokens derived using **Byte-Pair Encoding (BPE)**:
1. Start with base vocabulary of 256 individual byte characters.
2. Statistically count the most frequently co-occurring pair of consecutive symbols.
3. Merge that pair into a new token.
4. Repeat until vocabulary reaches target size (e.g. 32,000 for LLaMA, 128,000 for LLaMA-3).

---

## 3. The Decoder-Only Architecture (Pre-LN Transformer)

A single modern Transformer decoder layer (LLaMA style):

$$\mathbf{x}' = \mathbf{x} + \text{MultiHeadAttention}(\text{RMSNorm}(\mathbf{x}))$$
$$\mathbf{x}'' = \mathbf{x}' + \text{SwiGLU\_FFN}(\text{RMSNorm}(\mathbf{x}'))$$

### SwiGLU Feed-Forward Network (Shazeer, 2020)
Instead of a standard two-layer MLP, modern LLMs use Gated Linear Units:
$$\text{SwiGLU}(\mathbf{x}) = \left( \text{Swish}(\mathbf{x} W_{\text{gate}}) \odot \mathbf{x} W_{\text{up}} \right) W_{\text{down}}$$

---

## 4. The Inference Bottleneck & Key-Value (KV) Caching

During autoregressive generation, the model predicts token $t$, appends it to the prompt, and predicts token $t+1$.
In a naive implementation:
- Step 1: Compute attention over tokens $[1 \dots t]$ $\to O(t^2)$ FLOPs.
- Step 2: Compute attention over tokens $[1 \dots t+1]$ $\to O((t+1)^2)$ FLOPs.
- Generating $N$ tokens takes **$O(N^3)$ redundant operations**!

```
 Naive Generation (Recomputing past keys and values on every token):
   Step 1: Q1, K1, V1
   Step 2: Q2, [K1, K2], [V1, V2]  <-- K1 and V1 recomputed unnecessarily!
   Step 3: Q3, [K1, K2, K3], [V1, V2, V3]

 KV-Cache Generation (Compute ONLY current Q, append K and V to cache):
   Step 1: Store K1, V1 in Cache
   Step 2: Compute Q2, K2, V2 -> Append to Cache -> Attend Q2 with Cache[K1..2]
   Step 3: Compute Q3, K3, V3 -> Append to Cache -> Attend Q3 with Cache[K1..3]
```

### KV-Cache Mechanics
At step $t$:
1. Only pass the **single newest token** $x_t$ through the model.
2. Compute only $\mathbf{q}_t, \mathbf{k}_t, \mathbf{v}_t$.
3. Append $\mathbf{k}_t$ and $\mathbf{v}_t$ to the persistent memory cache on GPU VRAM:
   $$\text{Cache}_K \leftarrow [\text{Cache}_K; \; \mathbf{k}_t], \quad \text{Cache}_V \leftarrow [\text{Cache}_V; \; \mathbf{v}_t]$$
4. Compute attention between single row vector $\mathbf{q}_t$ and cached matrix $\text{Cache}_K$.
5. **Time complexity collapses from $O(N^2)$ per token to $O(N)$ per token!**

### Memory Cost of KV-Cache:
$$\text{Memory} = 2 \times n_{\text{layers}} \times n_{\text{heads}} \times d_k \times \text{seq\_len} \times \text{batch\_size} \times \text{bytes\_per\_elem}$$
For an 8k context window on large models, the KV-cache can exceed model weights—spurring modern innovations like **PagedAttention** (vLLM) and **Grouped-Query Attention (GQA)**.

