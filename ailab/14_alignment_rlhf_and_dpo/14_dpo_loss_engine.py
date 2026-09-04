"""
Module 14: Direct Preference Optimization (DPO) Loss Engine from Scratch
========================================================================
Concepts:
1. Bradley-Terry human preference probability model.
2. Direct Preference Optimization (DPO) loss calculation without RL.
3. Implicit reward margin: r(x, y) = beta * log(pi_theta / pi_ref).
4. Gradient updates steering model towards preferred completions.
"""

import numpy as np


def sigmoid(z):
    z = np.clip(z, -30.0, 30.0)
    return 1.0 / (1.0 + np.exp(-z))


def dpo_loss(policy_chosen_logps,
             policy_rejected_logps,
             reference_chosen_logps,
             reference_rejected_logps,
             beta=0.1):
    """
    Computes DPO Loss:
    L_DPO = - E [ log sigma( beta * log(pi(y_w|x) / pi_ref(y_w|x))
                           - beta * log(pi(y_l|x) / pi_ref(y_l|x)) ) ]

    All logps are 1D arrays of shape (Batch,) containing the sequence log-probabilities.
    """
    # Compute log-ratios for chosen (winning) response: log(pi / pi_ref)
    pi_chosen_ratio = policy_chosen_logps - reference_chosen_logps

    # Compute log-ratios for rejected (losing) response: log(pi / pi_ref)
    pi_rejected_ratio = policy_rejected_logps - reference_rejected_logps

    # Implicit reward difference
    implicit_reward_chosen = beta * pi_chosen_ratio
    implicit_reward_rejected = beta * pi_rejected_ratio
    reward_margin = implicit_reward_chosen - implicit_reward_rejected

    # DPO Loss = -log(sigmoid(margin))
    loss = -np.mean(np.log(sigmoid(reward_margin) + 1e-12))

    return loss, reward_margin, implicit_reward_chosen, implicit_reward_rejected


# =====================================================================
# Execution & Verification
# =====================================================================

if __name__ == '__main__':
    print("=== Direct Preference Optimization (DPO) Numerical Simulation ===")
    np.random.seed(42)
    batch_size = 4
    beta = 0.1

    # Base reference model SFT probabilities (in log space)
    ref_chosen = np.array([-4.2, -5.1, -3.8, -6.0])
    ref_rejected = np.array([-4.0, -4.9, -3.7, -5.8])

    # Scenario 1: Initial model where policy matches reference (Step 0)
    loss_init, margin_init, _, _ = dpo_loss(
        policy_chosen_logps=ref_chosen,
        policy_rejected_logps=ref_rejected,
        reference_chosen_logps=ref_chosen,
        reference_rejected_logps=ref_rejected,
        beta=beta
    )
    print(f"1. Step 0 Loss (Policy == Reference): {loss_init:.4f} (Expected -log(0.5) = {np.log(2):.4f})")

    # Scenario 2: Aligned model where policy increases chosen logps and decreases rejected logps
    aligned_chosen = ref_chosen + 1.8     # Higher probability on helpful/safe answer
    aligned_rejected = ref_rejected - 2.5  # Lower probability on harmful answer
    loss_aligned, margin_aligned, r_w, r_l = dpo_loss(
        policy_chosen_logps=aligned_chosen,
        policy_rejected_logps=aligned_rejected,
        reference_chosen_logps=ref_chosen,
        reference_rejected_logps=ref_rejected,
        beta=beta
    )

    print(f"2. Aligned Policy Loss:               {loss_aligned:.4f} (Dramatically reduced!)")
    print(f"3. Mean Implicit Reward Margin:       {np.mean(margin_aligned):.4f}")
    print(f"   Mean Implicit Reward Chosen:       {np.mean(r_w):.4f}")
    print(f"   Mean Implicit Reward Rejected:     {np.mean(r_l):.4f}")

    assert loss_aligned < loss_init, "DPO loss should decrease as preferred responses are favored"
    print("✓ DPO closed-form loss aligns model directly with human preference without RL training instabilities!")

