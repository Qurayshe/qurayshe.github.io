# Module 13: Parameter-Efficient Fine-Tuning (PEFT), LoRA & QLoRA

Full-parameter fine-tuning of a 70-billion parameter model requires over 800 GB of GPU VRAM just to hold the optimizer states (Adam stores 2 float32 moment vectors per weight). **Parameter-Efficient Fine-Tuning (PEFT)** circumvents this prohibitive hardware barrier. By freezing the pre-trained weights $W_0$ and decomposing parameter adaptations into low-rank matrices, **Low-Rank Adaptation (LoRA)** reduces trainable parameters by 99.9% while matching full fine-tuning performance!

---

## 1. The Intrinsic Rank Hypothesis

Aghajanyan et al. (2020) demonstrated that pre-trained foundation models have an exceptionally low **intrinsic dimension**: the weight changes needed to adapt a pre-trained model to a downstream specialized task lie in a subspace of very small rank $r \ll d$.

Given a pre-trained linear layer:
$$\mathbf{h} = W_0 \mathbf{x}, \quad W_0 \in \mathbb{R}^{d \times k}$$

Instead of updating all elements of $W_0$, Hu et al. (2021) constrain the parameter update $\Delta W$ with a low-rank decomposition:

$$\Delta W = B \cdot A$$

Where:
- $B \in \mathbb{R}^{d \times r}$
- $A \in \mathbb{R}^{r \times k}$
- Rank $r \ll \min(d, k)$ (commonly $r \in \{8, 16, 32\}$).

```
                 h = W0 * x + (alpha / r) * (B * A) * x

                                [ Output h ]
                                   ^     ^
                                   |     |
              (Frozen W0)          |     +------ [ Matrix B (d x r) ]
           [ W0 Matrix (d x k) ]   |                 ^
                   |               |                 |
                   |               |             [ Matrix A (r x k) ]
                   |               |                 ^
                   +---------------+                 |
                                   |                 |
                             [ Input Vector x ] -----+
```

---

## 2. Initialization & Scaling Hyperparameter $\alpha$

### Asymmetric Initialization:
- Matrix $A$ is initialized with a Gaussian distribution $\mathcal{N}(0, \sigma^2)$.
- Matrix $B$ is initialized to **exact zeros**: $B = \mathbf{0}$.
- **Result:** At the start of training, $\Delta W = B \cdot A = \mathbf{0} \cdot A = \mathbf{0}$. The model begins execution with exactly its original pre-trained behavior!

### Scaling Factor $\frac{\alpha}{r}$:
The modified forward pass is:

$$\mathbf{h} = W_0 \mathbf{x} + \frac{\alpha}{r} (B A) \mathbf{x}$$

Where $\alpha$ is a constant hyperparameter. When varying the rank $r$ during experiments, scaling by $\frac{\alpha}{r}$ avoids the need to retune learning rates.

---

## 3. Zero Inference Latency Overhead: Weight Merging

During production serving, having separate LoRA branches introduces kernel launch overhead.
Because matrix multiplication is linear, the trained LoRA adapter can be **permanently folded directly into the base weights**:

$$W_{\text{merged}} = W_0 + \frac{\alpha}{r} (B A)$$

At deployment, the merged model operates as a standard single matrix $W_{\text{merged}}$ with **zero additional FLOPs or latency overhead**! If switching tasks dynamically, you can subtract $\Delta W$ and add a different adapter instantly.

---

## 4. QLoRA: Quantized 4-bit LoRA (Dettmers et al., 2023)

QLoRA enables fine-tuning a 65B parameter model on a single 48GB GPU by introducing three key innovations:
1. **4-bit NormalFloat (NF4):** An information-theoretically optimal quantile quantization data type for normally distributed neural network weights.
2. **Double Quantization (DQ):** Quantizing the quantization constants themselves, saving 0.37 bits per parameter.
3. **Paged Optimizers:** Using CUDA unified memory to dynamically page optimizer states between GPU VRAM and CPU RAM during gradient checkpoint memory spikes.

