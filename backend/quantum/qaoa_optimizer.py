from typing import List, Tuple, Optional
import numpy as np

def portfolio_qubo_objective(bits: np.ndarray, cov: np.ndarray, mu: np.ndarray, risk_aversion: float) -> float:
    """
    Compute the QUBO (Quadratic Unconstrained Binary Optimization) objective function for portfolio optimization.
    
    This function calculates the portfolio's risk-adjusted return:
    - First term (bits.T @ cov @ bits): Portfolio variance (risk)
    - Second term (risk_aversion * mu.T @ bits): Expected return scaled by risk preference
    
    Args:
        bits: Binary array where 1 = include asset, 0 = exclude asset
        cov: Covariance matrix of asset returns (measures risk correlation)
        mu: Expected returns vector for each asset
        risk_aversion: Lambda parameter - higher values prefer return over risk
        
    Returns:
        Float representing the portfolio objective to minimize (lower is better)
    """
    return float(bits.T @ cov @ bits - risk_aversion * (mu.T @ bits))

def solve_qaoa(cov: np.ndarray, mu: np.ndarray, risk_aversion: float = 0.5, reps: int = 1) -> Tuple[List[int], float]:
    """
    Quantum Approximate Optimization Algorithm (QAOA) for portfolio selection.
    
    QAOA is a hybrid quantum-classical algorithm that:
    1. Prepares a quantum superposition of all possible portfolios
    2. Applies quantum gates to explore optimal solutions
    3. Uses classical optimization to tune quantum parameters
    4. Measures the quantum state to get the best portfolio
    
    Falls back to classical heuristic if Qiskit/quantum backend unavailable.
    
    Args:
        cov: Covariance matrix (n x n) of asset returns
        mu: Expected returns vector (n,) for each asset
        risk_aversion: Trade-off parameter between risk and return (default 0.5)
        reps: Number of QAOA repetitions/layers (more = better quality, slower)
        
    Returns:
        Tuple of (binary selection array, objective value)
    """
    try:
        # Import Qiskit modules only when needed (lazy loading for performance)
        from qiskit_algorithms import optimizers as qk_opt
        from qiskit_algorithms import QAOA
        from qiskit_optimization import QuadraticProgram
        from qiskit_optimization.algorithms import MinimumEigenOptimizer
        
        # ===== QUANTUM PATH: Try the full QAOA approach =====
        n = len(mu)  # Number of assets
        
        # Build QUBO problem in Qiskit format
        qp = QuadraticProgram()
        for i in range(n):
            qp.binary_var(name=f"x{i}")  # x_i ∈ {0, 1} for each asset
            
        # Set up objective function: minimize risk - lambda * return
        Q = cov.copy()  # Quadratic coefficients (risk term)
        c = -risk_aversion * mu  # Linear coefficients (return term, negated for minimization)
        
        # Map to Qiskit's optimization problem format
        linear = {f"x{i}": float(c[i]) for i in range(n)}
        quadratic = {}
        for i in range(n):
            for j in range(i, n):
                if abs(Q[i, j]) > 1e-12:  # Only include non-zero entries
                    quadratic[(f"x{i}", f"x{j}")] = float(Q[i, j])
        qp.minimize(linear=linear, quadratic=quadratic)
        
        # Configure QAOA with classical optimizer (SPSA = Simultaneous Perturbation Stochastic Approximation)
        optimizer = qk_opt.SPSA(maxiter=20)  # Reduced iterations for demo speed
        qaoa = QAOA(optimizer=optimizer, reps=reps)  # Create QAOA solver
        
        # Wrap QAOA in MinimumEigenOptimizer for portfolio problem
        meo = MinimumEigenOptimizer(min_eigen_solver=qaoa)
        result = meo.solve(qp)
        
        # Extract binary solution and objective value
        bits = [int(result.x[i]) for i in range(len(mu))]
        return bits, float(result.fval)
        
    except Exception as e:
        # ===== CLASSICAL FALLBACK: Quantum libraries unavailable or failed =====
        # Use a simple heuristic quantum-inspired approach (random sampling)
        n = len(mu)
        best_bits = None
        best_objective = float('inf')
        
        # Try random binary combinations (simulates quantum sampling without quantum hardware)
        np.random.seed(42)  # For reproducibility in demos
        for _ in range(min(16, 2**n)):  # Limit trials for performance (max 16 samples)
            bits = np.random.randint(0, 2, size=n)  # Random portfolio selection
            
            # Ensure at least one asset is selected (no empty portfolio)
            if np.sum(bits) == 0:
                bits[np.argmax(mu)] = 1  # Select highest return asset
            
            # Evaluate this portfolio candidate
            objective = portfolio_qubo_objective(bits, cov, mu, risk_aversion)
            
            # Keep track of best solution found
            if objective < best_objective:
                best_objective = objective
                best_bits = bits
        
        return best_bits.tolist(), best_objective

def get_qaoa_state_preview(n_qubits: int = 3):
    """
    Generate simulated quantum state data for Bloch sphere visualization.
    
    The Bloch sphere is a geometric representation of a qubit's quantum state:
    - North pole (θ=0): |0⟩ state (classic bit 0)
    - South pole (θ=π): |1⟩ state (classic bit 1)  
    - Equator: Superposition states (50/50 mix of |0⟩ and |1⟩)
    - θ (theta): Polar angle (0 to π) - controls |0⟩ vs |1⟩ probability
    - φ (phi): Azimuthal angle (0 to 2π) - controls quantum phase
    
    In portfolio optimization context:
    - Each qubit represents whether an asset is selected
    - Superposition = quantum exploring multiple portfolios simultaneously
    - Measurement collapses to a definite portfolio selection
    
    Args:
        n_qubits: Number of qubits to simulate (typically = number of assets)
        
    Returns:
        List of dicts with theta and phi angles for each qubit's Bloch sphere position
    """
    np.random.seed(42)  # Fixed seed for consistent visualization

    # Generate random angles representing quantum superposition states
    # (In real QAOA, these would come from the quantum circuit's parameterized gates)
    theta = np.random.uniform(0, np.pi, n_qubits)  # Polar angle: 0 (|0⟩) to π (|1⟩)
    phi = np.random.uniform(0, 2 * np.pi, n_qubits)  # Azimuthal angle: quantum phase
    
    return [{"theta": float(t), "phi": float(p)} for t, p in zip(theta, phi)]