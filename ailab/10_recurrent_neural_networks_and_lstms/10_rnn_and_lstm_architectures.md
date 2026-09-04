# Module 10: Recurrent Neural Networks (RNNs) & LSTMs

Text, audio, and sensor telemetry are continuous sequential streams with temporal dependencies. Standard feedforward networks assume all inputs are independent and identically distributed. **Recurrent Neural Networks (RNNs)** introduce an internal memory recurrence: a hidden state vector $\mathbf{h}_t$ that acts as a running summary of past inputs. But when training over long sequences, simple RNNs collapse due to the vanishing gradient dilemma—leading directly to Hochreiter & Schmidhuber's breakthrough: the **LSTM**.

---

## 1. The Vanilla Elman Recurrent Cell

At each discrete time step $t \in \{1, \dots, T\}$:

$$\mathbf{h}_t = \tanh\left( W_{xh} \mathbf{x}_t + W_{hh} \mathbf{h}_{t-1} + \mathbf{b}_h \right)$$
$$\hat{\mathbf{y}}_t = \text{softmax}\left( W_{hy} \mathbf{h}_t + \mathbf{b}_y \right)$$

```
     y1          y2          y3
      ^           ^           ^
      |           |           |
   [ h1 ] ===> [ h2 ] ===> [ h3 ] ===>... ht (Hidden Memory State)
      ^           ^           ^
      |           |           |
     x1          x2          x3
```

### Backpropagation Through Time (BPTT)
To calculate gradients with respect to recurrent weight matrix $W_{hh}$, we unroll the computation graph across all $T$ time steps:

$$\frac{\partial \mathcal{L}_T}{\partial \mathbf{h}_1} = \frac{\partial \mathcal{L}_T}{\partial \mathbf{h}_T} \prod_{k=2}^T \frac{\partial \mathbf{h}_k}{\partial \mathbf{h}_{k-1}} = \frac{\partial \mathcal{L}_T}{\partial \mathbf{h}_T} \prod_{k=2}^T \text{diag}(1 - \tanh^2(\cdot)) W_{hh}^T$$

Notice the repeated matrix power $(W_{hh})^T$!
- If the largest eigenvalue $\lambda_{\max}(W_{hh}) > 1 \to$ **Exploding Gradients** ($\infty$, NaN). Mitigated by gradient clipping: $g \leftarrow g \cdot \frac{\tau}{\max(\tau, \|g\|)}$.
- If $\lambda_{\max}(W_{hh}) < 1 \to$ **Vanishing Gradients** ($0$). The model forgets context earlier than 10-15 time steps!

---

## 2. Long Short-Term Memory (LSTM - 1997)

Hochreiter & Schmidhuber solved the vanishing gradient in sequences by designing a constant error carousel: the **Cell State $C_t$**, regulated by three multiplicative sigmoid gates:

```
        C_{t-1} -----------------( * )-----------------( + )-----------------> C_t (Cell State)
                                   ^                     ^
                                   |                     |
                              [ Forget Gate ]      [ Input Gate ]
                                   f_t                   i_t
                                   ^                     ^
                                   |                     |
        h_{t-1} -----\             |                     |
                      +----[ W ]---+---------------------+---------[ Output Gate ]---> h_t
        x_t ---------/                                                   o_t
```

### The 4 Gating Equations:
1. **Forget Gate $\mathbf{f}_t$ (What to erase from past memory):**
   $$\mathbf{f}_t = \sigma\left( W_f [\mathbf{h}_{t-1}, \mathbf{x}_t] + \mathbf{b}_f \right)$$
2. **Input Gate $\mathbf{i}_t$ (What new information to write):**
   $$\mathbf{i}_t = \sigma\left( W_i [\mathbf{h}_{t-1}, \mathbf{x}_t] + \mathbf{b}_i \right)$$
3. **Candidate Cell State $\tilde{\mathbf{C}}_t$ (New candidate memory):**
   $$\tilde{\mathbf{C}}_t = \tanh\left( W_c [\mathbf{h}_{t-1}, \mathbf{x}_t] + \mathbf{b}_c \right)$$
4. **Cell State Update $\mathbf{C}_t$ (Linear additive update!):**
   $$\mathbf{C}_t = \mathbf{f}_t \odot \mathbf{C}_{t-1} + \mathbf{i}_t \odot \tilde{\mathbf{C}}_t$$
5. **Output Gate $\mathbf{o}_t$ & Hidden State $\mathbf{h}_t$:**
   $$\mathbf{o}_t = \sigma\left( W_o [\mathbf{h}_{t-1}, \mathbf{x}_t] + \mathbf{b}_o \right)$$
   $$\mathbf{h}_t = \mathbf{o}_t \odot \tanh(\mathbf{C}_t)$$

> [!IMPORTANT]
> The secret to LSTM's longevity is the **additive cell state update** $\mathbf{C}_t = \mathbf{f}_t \odot \mathbf{C}_{t-1} + \dots$.
> The derivative $\frac{\partial \mathbf{C}_t}{\partial \mathbf{C}_{t-1}} = \mathbf{f}_t$. As long as the forget gate is saturated near $1$, gradient signals can flow backward across hundreds of time steps with zero attenuation!

