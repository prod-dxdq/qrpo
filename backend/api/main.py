from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import numpy as np

from ml_model.rf_features import fft_features
from quantum.qaoa_optimizer import solve_qaoa

app = FastAPI(title="QRPO Backend", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class FFTRequest(BaseModel):
    series: List[float]

class ClassicalOptRequest(BaseModel):
    mu: List[float]
    cov: List[List[float]]
    lam: float = 0.5

class QuantumOptRequest(BaseModel):
    mu: List[float]
    cov: List[List[float]]
    lam: float = 0.5
    reps: int = 1

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/features/fft")
def features_fft(req: FFTRequest):
    data = np.array(req.series, dtype=float)
    res = fft_features(data)
    return res

@app.post("/optimize/classical")
def optimize_classical(req: ClassicalOptRequest):
    import scipy.optimize as spo
    mu = np.array(req.mu, dtype=float)
    cov = np.array(req.cov, dtype=float)
    lam = float(req.lam)
    n = len(mu)
    w0 = np.ones(n) / n

    def objective(w):
        return float(w @ cov @ w - lam * (mu @ w))

    cons = ({"type": "eq", "fun": lambda w: np.sum(w) - 1.0},)
    bounds = [(0.0, 1.0)] * n
    res = spo.minimize(objective, w0, method="SLSQP", bounds=bounds, constraints=cons)
    return {"weights": res.x.tolist(), "objective": float(objective(res.x)), "success": bool(res.success), "message": res.message}

@app.post("/optimize/quantum")
def optimize_quantum(req: QuantumOptRequest):
    try:
        mu = np.array(req.mu, dtype=float)
        cov = np.array(req.cov, dtype=float)
        lam = float(req.lam)
        reps = int(req.reps)
        bits, fval = solve_qaoa(cov, mu, risk_aversion=lam, reps=reps)
        return {"selection_bits": bits, "objective": fval}
    except Exception as e:
        return {"error": str(e), "type": type(e).__name__}
