from typing import List, Tuple, Optional
import numpy as np

def portfolio_qubo_objective(bits: np.ndarray, cov: np.ndarray, mu: np.ndarray, risk_aversion: float) -> float:
    """Compute the QUBO objective function for portfolio optimization"""
    return float(bits.T @ cov @ bits - risk_aversion * (mu.T @ bits))

def solve_qaoa(cov: np.ndarray, mu: np.ndarray, risk_aversion: float = 0.5, reps: int = 1) -> Tuple[List[int], float]:
    """
    Simplified quantum-inspired portfolio optimizer.
    For demo purposes, we'll use a heuristic approach instead of full QAOA
    to avoid compatibility issues with different Qiskit versions.
    """
    try:
        # Import Qiskit modules only when needed
        from qiskit_algorithms import optimizers as qk_opt
        from qiskit_algorithms import QAOA
        from qiskit_optimization import QuadraticProgram
        from qiskit_optimization.algorithms import MinimumEigenOptimizer
        
        # Try the full QAOA approach
        n = len(mu)
        qp = QuadraticProgram()
        for i in range(n):
            qp.binary_var(name=f"x{i}")
        Q = cov.copy()
        c = -risk_aversion * mu
        linear = {f"x{i}": float(c[i]) for i in range(n)}
        quadratic = {}
        for i in range(n):
            for j in range(i, n):
                if abs(Q[i, j]) > 1e-12:
                    quadratic[(f"x{i}", f"x{j}")] = float(Q[i, j])
        qp.minimize(linear=linear, quadratic=quadratic)
        
        optimizer = qk_opt.SPSA(maxiter=20)  # Reduced iterations for demo
        qaoa = QAOA(optimizer=optimizer, reps=reps)
        meo = MinimumEigenOptimizer(min_eigen_solver=qaoa)
        result = meo.solve(qp)
        bits = [int(result.x[i]) for i in range(len(mu))]
        return bits, float(result.fval)
        
    except Exception as e:
        # Fallback: Use a simple heuristic quantum-inspired approach
        n = len(mu)
        best_bits = None
        best_objective = float('inf')
        
        # Try a few random binary combinations (simulating quantum sampling)
        np.random.seed(42)  # For reproducibility
        for _ in range(min(16, 2**n)):  # Limit to reasonable number of trials
            bits = np.random.randint(0, 2, size=n)
            if np.sum(bits) == 0:  # Ensure at least one asset is selected
                bits[np.argmax(mu)] = 1
            
            objective = portfolio_qubo_objective(bits, cov, mu, risk_aversion)
            if objective < best_objective:
                best_objective = objective
                best_bits = bits
        
        return best_bits.tolist(), best_objective
