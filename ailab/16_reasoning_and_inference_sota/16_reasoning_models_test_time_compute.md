# Module 16: SOTA Reasoning Models, Test-Time Compute & Speculative Decoding

In late 2024 and 2025, artificial intelligence entered a new scaling paradigm. While pre-training scaling laws (Chinchilla) yielded diminishing returns due to internet data bottlenecks, **Test-Time Compute Scaling** unlocked superhuman reasoning. Models like OpenAI o1/o3 and DeepSeek-R1 don't just output answers immediately—they "think", explore candidate reasoning trajectories, backtrack from dead ends, and verify sub-steps. Concurrently, **Speculative Decoding** accelerated inference by 2-3x without losing a single drop of accuracy!

---

## 1. The New Scaling Dimension: Test-Time Compute

Classic pre-training scaling follows:
$$\text{Performance} \propto (\text{Pre-training Compute})^{\alpha}$$

**The Test-Time Scaling Law:**
$$\text{Performance} \propto (\text{Inference Compute})^{\beta}$$

By allocating more tokens and compute during *inference* (search, verification, revision), a smaller model can outperform models that are 10x larger!

```
       Accuracy ^
                |                              / [ Search + Verification (o1 / R1) ]
                |                             /
                |                            /
                |............-  [ Direct Next-Token Greedy Output ]
                |              /
                |             /
                +----------------------------------------> Test-Time Compute (FLOPs / Tokens)
```

---

## 2. Process Reward Models (PRM) vs Outcome Reward Models (ORM)

How does a reasoning engine evaluate intermediate thoughts?
- **Outcome Reward Model (ORM):** Grades only the final answer at the very end ($r \in \{0, 1\}$). Fails when a model arrives at the correct answer through flawed logic ("hallucination with lucky guess").
- **Process Reward Model (PRM - Lightman et al., 2023):** Evaluates every individual step of the Chain-of-Thought (CoT):

$$r_{\text{step}} = P(\text{Step } t \text{ is mathematically sound} \mid x, \text{steps}_{<t})$$

### Monte Carlo Tree Search (MCTS) for Reasoning
Using PRM evaluations, the model explores a reasoning graph:
1. **Selection:** Traverse down the tree using Upper Confidence Bounds for Trees (UCT).
2. **Expansion:** Sample $K$ alternative next reasoning steps from the policy model.
3. **Evaluation:** PRM scores the candidate steps.
4. **Backpropagation:** Update value estimates along the path to the root.

---

## 3. Speculative Decoding (Leviathan et al., 2023)

Autoregressive inference on large LLMs (e.g. 70B) is severely **memory-bandwidth bound**: reading 140 GB of model weights from HBM3 into GPU SRAM takes ~30 milliseconds, even if only computing 1 token!

**Speculative Decoding** uses an asymmetry:
- A small, fast **Draft Model** (e.g. 1B) drafts $K$ candidate tokens cheaply: $(\tilde{x}_1, \dots, \tilde{x}_K)$.
- The large **Target Model** (e.g. 70B) evaluates all $K$ candidate tokens **simultaneously in a single parallel forward pass**!

```
 [ Draft Model (1B) ]   ----> Generates 4 tokens cheaply: [ "The", "capital", "of", "France" ]
                                                                |
                                                                v  (Single Parallel GEMM Pass)
 [ Target Model (70B) ] ----> Verifies all 4 tokens in parallel!
                                Accept: "The" (P=0.98)
                                Accept: "capital" (P=0.95)
                                Accept: "of" (P=0.99)
                                Accept: "France" (P=0.97)
                                ===> 4 tokens emitted in the time of 1 target forward pass! (4x Speedup)
```

### The Rejection Sampling Guarantee
To guarantee that the final generated distribution is mathematically identical to sampling directly from the large target model $P$, token $\tilde{x}$ is accepted with probability:

$$\alpha = \min\left(1, \; \frac{P(\tilde{x})}{Q(\tilde{x})}\right)$$

If rejected, sample from the residual distribution:
$$P'(\tilde{x}) = \max\left(0, \; P(\tilde{x}) - Q(\tilde{x})\right)$$

**Result:** Zero quality degradation, exact mathematical equivalence, and 2-3x wall-clock speedup across modern inference servers (vLLM, TensorRT-LLM, TGI)!

