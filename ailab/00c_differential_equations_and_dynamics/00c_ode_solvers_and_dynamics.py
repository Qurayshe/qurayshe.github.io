"""
Ordinary Differential Equations (ODEs) & Dynamical Systems
Euler Integration, Runge-Kutta 4 (RK4), Phase Space, and Gradient Flows.
Implemented from first principles in pure Python (no external dependencies).
"""

import math
from typing import Callable, List, Tuple


# A derivative function for a system of ODEs: dy/dt = f(t, y)
# where y is a state vector of length d, returning dy/dt of length d.
ODESystem = Callable[[float, List[float]], List[float]]


class ODESolver:
    """Numerical integrators for ordinary differential equations."""

    @staticmethod
    def euler_step(f: ODESystem, t: float, y: List[float], dt: float) -> List[float]:
        """
        Forward Euler step: y_{n+1} = y_n + dt * f(t_n, y_n)
        Local truncation error: O(dt^2), Global error: O(dt).
        """
        dydt = f(t, y)
        return [y_i + dt * dy_i for y_i, dy_i in zip(y, dydt)]

    @staticmethod
    def rk4_step(f: ODESystem, t: float, y: List[float], dt: float) -> List[float]:
        """
        Classical 4th-Order Runge-Kutta (RK4) step.
        Local truncation error: O(dt^5), Global error: O(dt^4).
        """
        dim = len(y)

        # Stage 1
        k1 = f(t, y)

        # Stage 2
        y2 = [y[i] + 0.5 * dt * k1[i] for i in range(dim)]
        k2 = f(t + 0.5 * dt, y2)

        # Stage 3
        y3 = [y[i] + 0.5 * dt * k2[i] for i in range(dim)]
        k3 = f(t + 0.5 * dt, y3)

        # Stage 4
        y4 = [y[i] + dt * k3[i] for i in range(dim)]
        k4 = f(t + dt, y4)

        # Weighted blend
        return [
            y[i] + (dt / 6.0) * (k1[i] + 2.0 * k2[i] + 2.0 * k3[i] + k4[i])
            for i in range(dim)
        ]

    @staticmethod
    def integrate(
        f: ODESystem,
        y0: List[float],
        t_span: Tuple[float, float],
        dt: float,
        method: str = "rk4"
    ) -> Tuple[List[float], List[List[float]]]:
        """
        Integrates an ODE system over t_span = (t_start, t_end) with fixed step size dt.
        Returns (time_points, trajectory).
        """
        t_start, t_end = t_span
        t = t_start
        y = [float(val) for val in y0]

        times = [t]
        trajectory = [y[:]]

        step_fn = ODESolver.rk4_step if method == "rk4" else ODESolver.euler_step

        while t < t_end - 1e-12:
            current_dt = min(dt, t_end - t)
            y = step_fn(f, t, y, current_dt)
            t += current_dt
            times.append(t)
            trajectory.append(y[:])

        return times, trajectory


# ---------------------------------------------------------------------------
# Dynamical Systems Case Studies
# ---------------------------------------------------------------------------

def exponential_decay_ode(t: float, y: List[float]) -> List[float]:
    """dy/dt = -k * y with k = 2.0."""
    k = 2.0
    return [-k * y[0]]


def harmonic_oscillator_ode(t: float, state: List[float]) -> List[float]:
    """
    Second-order ODE: d^2x/dt^2 + omega^2 * x = 0
    Expressed as first-order system:
      dx/dt = v
      dv/dt = -omega^2 * x
    """
    omega = 2.0
    x, v = state[0], state[1]
    return [v, -omega * omega * x]


def gradient_flow_ode(t: float, state: List[float]) -> List[float]:
    """
    Continuous-Time Gradient Flow for Potential Function:
      L(x, y) = (x - 2)^2 + 10*(y - 3)^2
    Gradient:
      dL/dx = 2*(x - 2)
      dL/dy = 20*(y - 3)
    Flow:
      dx/dt = -dL/dx
      dy/dt = -dL/dy
    """
    x, y = state[0], state[1]
    dL_dx = 2.0 * (x - 2.0)
    dL_dy = 20.0 * (y - 3.0)
    return [-dL_dx, -dL_dy]


def test_differential_equations_and_dynamics():
    print("--- 1. First-Order ODE: Analytical vs Euler vs RK4 ---")
    # dy/dt = -2y, y(0) = 1.0. Exact solution: y(t) = exp(-2t)
    t_end = 2.0
    exact_y_end = math.exp(-2.0 * t_end)
    print(f"Exact theoretical y(2.0): {exact_y_end:.6f}")

    # Solve with Euler (dt = 0.1)
    _, traj_euler = ODESolver.integrate(exponential_decay_ode, [1.0], (0.0, t_end), dt=0.1, method="euler")
    y_euler = traj_euler[-1][0]
    euler_err = abs(y_euler - exact_y_end)
    print(f"Euler y(2.0): {y_euler:.6f} (Error: {euler_err:.6f})")

    # Solve with RK4 (dt = 0.1)
    _, traj_rk4 = ODESolver.integrate(exponential_decay_ode, [1.0], (0.0, t_end), dt=0.1, method="rk4")
    y_rk4 = traj_rk4[-1][0]
    rk4_err = abs(y_rk4 - exact_y_end)
    print(f"RK4 y(2.0):   {y_rk4:.6f} (Error: {rk4_err:.6e})")

    # RK4 should be orders of magnitude more accurate than Euler
    assert rk4_err < 1e-5
    assert rk4_err < euler_err / 100.0
    print("RK4 4th-order accuracy confirmed.")

    print("\n--- 2. Harmonic Oscillator Phase Space (Energy Conservation) ---")
    # Initial state: x(0) = 1.0, v(0) = 0.0, omega = 2.0
    # Total Energy E = 0.5 * v^2 + 0.5 * omega^2 * x^2 = 0 + 0.5 * 4 * 1 = 2.0
    initial_energy = 0.5 * (0.0**2) + 0.5 * (2.0**2) * (1.0**2)
    _, traj_harm = ODESolver.integrate(harmonic_oscillator_ode, [1.0, 0.0], (0.0, 10.0), dt=0.01, method="rk4")

    final_x, final_v = traj_harm[-1][0], traj_harm[-1][1]
    final_energy = 0.5 * (final_v**2) + 0.5 * (2.0**2) * (final_x**2)
    energy_drift = abs(final_energy - initial_energy)
    print(f"Initial Energy: {initial_energy:.6f}, Final Energy after 10s: {final_energy:.6f}")
    print(f"Energy drift over 1,000 RK4 integration steps: {energy_drift:.6e}")
    assert energy_drift < 1e-4
    print("Phase-space symplectic orbit stability verified.")

    print("\n--- 3. Continuous Gradient Flow as Neural Network Optimization ---")
    # Target minimum is (x*, y*) = (2.0, 3.0)
    # Start at arbitrary point (x0, y0) = (-5.0, -10.0)
    _, traj_opt = ODESolver.integrate(gradient_flow_ode, [-5.0, -10.0], (0.0, 5.0), dt=0.02, method="rk4")
    converged_x, converged_y = traj_opt[-1][0], traj_opt[-1][1]
    print(f"Starting point: (-5.0, -10.0)")
    print(f"Converged equilibrium: ({converged_x:.4f}, {converged_y:.4f})")
    assert math.isclose(converged_x, 2.0, abs_tol=1e-3)
    assert math.isclose(converged_y, 3.0, abs_tol=1e-3)
    print("Continuous-time dynamical convergence to optimum confirmed.")


if __name__ == "__main__":
    test_differential_equations_and_dynamics()
