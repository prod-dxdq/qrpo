import numpy as np
from numpy.typing import NDArray
from typing import Dict, Any

def fft_features(series: NDArray[np.float64]) -> Dict[str, Any]:
    """Compute simple FFT magnitude spectrum and basic stats.
Input: 1D array of prices or returns.
Output: dict with frequencies, magnitudes, and summary stats.
"""
    x = np.asarray(series, dtype=float)
    x = x - np.nanmean(x)
    n = len(x)
    if n < 8:
        raise ValueError("Need at least 8 samples for FFT features.")
    spec = np.fft.rfft(x)
    mag = np.abs(spec) / n
    freqs = np.fft.rfftfreq(n, d=1.0)
    low = mag[(freqs >= 0.0) & (freqs < 0.1)].sum()
    mid = mag[(freqs >= 0.1) & (freqs < 0.3)].sum()
    high = mag[(freqs >= 0.3)].sum()
    stats = {
        "n": int(n),
        "total_energy": float((mag**2).sum()),
        "band_energy": {"low": float(low), "mid": float(mid), "high": float(high)},
    }
    return {"freqs": freqs.tolist(), "magnitude": mag.tolist(), "stats": stats}
