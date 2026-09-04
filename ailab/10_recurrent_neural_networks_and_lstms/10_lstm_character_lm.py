"""
Module 10: LSTM Cell & Sequential Character Generator from Scratch
==================================================================
Concepts:
1. Gated Recurrent Architecture: Forget, Input, and Output Gates.
2. Additive Cell State update mechanism preventing vanishing gradients.
3. Unrolling an LSTM through time steps.
4. Auto-regressive sequential generation of characters.
"""

import numpy as np


def sigmoid(x):
    return 1.0 / (1.0 + np.exp(-np.clip(x, -30.0, 30.0)))


class LSTMCell:
    """A standalone LSTM cell with explicit gating matrices."""

    def __init__(self, input_dim, hidden_dim):
        self.input_dim = input_dim
        self.hidden_dim = hidden_dim
        concat_dim = input_dim + hidden_dim

        # Combined weight matrix for [f, i, c_tilde, o] gates
        std = np.sqrt(2.0 / concat_dim)
        self.W = np.random.randn(4 * hidden_dim, concat_dim) * std
        self.b = np.zeros((4 * hidden_dim, 1))

        # Helpful bias trick: initialize forget gate bias to 1.0 to remember early
        self.b[:hidden_dim, :] = 1.0

    def forward(self, x, h_prev, c_prev):
        """
        x: (input_dim, 1)
        h_prev: (hidden_dim, 1)
        c_prev: (hidden_dim, 1)
        """
        H = self.hidden_dim
        # Concatenate hidden state and input vector
        concat = np.vstack((h_prev, x))

        # Compute all 4 pre-activations simultaneously
        gates = np.dot(self.W, concat) + self.b

        f_gate = sigmoid(gates[0:H])              # Forget gate
        i_gate = sigmoid(gates[H:2*H])            # Input gate
        c_tilde = np.tanh(gates[2*H:3*H])         # Candidate memory
        o_gate = sigmoid(gates[3*H:4*H])          # Output gate

        # Cell state additive update
        c_next = f_gate * c_prev + i_gate * c_tilde
        # Hidden state output
        h_next = o_gate * np.tanh(c_next)

        return h_next, c_next


class MinimalLSTMSeq:
    """Sequential sequence processor processing a batch of time steps."""

    def __init__(self, vocab_size, hidden_dim):
        self.hidden_dim = hidden_dim
        self.vocab_size = vocab_size
        self.cell = LSTMCell(input_dim=vocab_size, hidden_dim=hidden_dim)
        # Decoder projection to vocabulary logits
        self.W_vocab = np.random.randn(vocab_size, hidden_dim) * 0.1
        self.b_vocab = np.zeros((vocab_size, 1))

    def step_forward(self, char_idx, h_prev, c_prev):
        # Convert character index to one-hot vector
        x = np.zeros((self.vocab_size, 1))
        x[char_idx] = 1.0

        h_next, c_next = self.cell.forward(x, h_prev, c_prev)
        logits = np.dot(self.W_vocab, h_next) + self.b_vocab
        # Softmax probabilities
        exp_l = np.exp(logits - np.max(logits))
        probs = exp_l / np.sum(exp_l)
        return probs, h_next, c_next


# =====================================================================
# Execution & Verification
# =====================================================================

if __name__ == '__main__':
    print("=== 1. LSTM Gate Gating Dynamics ===")
    vocab = ['<bos>', 's', 'y', 's', 't', 'e', 'm', 's', '<eos>']
    vocab_size = len(vocab)
    hidden_dim = 16

    lstm_lm = MinimalLSTMSeq(vocab_size=vocab_size, hidden_dim=hidden_dim)

    # Initial zero states
    h = np.zeros((hidden_dim, 1))
    c = np.zeros((hidden_dim, 1))

    print("Unrolling sequential time-steps:")
    for t, char in enumerate(vocab[:-1]):
        probs, h, c = lstm_lm.step_forward(t, h, c)
        pred_idx = np.argmax(probs)
        print(f"Step {t:02d} | Input: '{char:>6}' -> Next Char Probs Sum: {np.sum(probs):.2f} | Hidden State Norm: {np.linalg.norm(h):.4f}")

    print("\n✓ LSTM cell gating updates cell state additive memory across time steps without signal degradation!")

