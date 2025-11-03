from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from typing import List
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import os
import pandas_datareader as pdr
from datetime import datetime, timedelta
from ml_model.rf_features import fft_features, train_rf_model, fetch_stock_data, train_stock_model
from quantum.qaoa_optimizer import solve_qaoa
from quantum.qaoa_optimizer import get_qaoa_state_preview

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

class StockAnalysisRequest(BaseModel):
    ticker: str = "SPY"
    period: str = "1mo"

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

@app.post("/rf_efficiency")
async def rf_efficiency(file: UploadFile = File(...)):
    df = pd.read_csv(file.file)

    # Use the train_rf_model function
    model = train_rf_model(df)

    # Predict for new data
    new_data = np.array([[2500, 10, 25]])
    pred = model.predict(new_data)[0]

    # Plot
    plt.figure(figsize=(10, 6))
    plt.scatter(df["freq_MHz"], df["efficiency"], color="blue", alpha=0.6, s=50)
    plt.xlabel("Frequency (MHz)")
    plt.ylabel("Efficiency (%)")
    plt.title("RF Efficiency Prediction")
    plt.grid(True, alpha=0.3)
    plot_path = os.path.join(os.getcwd(), "backend", "ml_model", "rf_plot.png")
    os.makedirs(os.path.dirname(plot_path), exist_ok=True)
    plt.savefig(plot_path, bbox_inches="tight", dpi=100)
    plt.close()

    return JSONResponse({
        "predicted_efficiency": round(float(pred), 2),
        "plot_path": "/plot",
        "model_coefficients": model.coef_.tolist(),
        "model_intercept": float(model.intercept_)
    })

@app.get("/plot")
def get_plot():
    plot_path = os.path.join(os.getcwd(), "backend", "ml_model", "rf_plot.png")
    return FileResponse(plot_path)

@app.post("/stock/analyze")
async def analyze_stock(req: StockAnalysisRequest):
    try:
        # Fetch real-time stock data
        df = fetch_stock_data(ticker=req.ticker, period=req.period)
        
        if len(df) < 5:
            return JSONResponse({
                "error": "Insufficient data",
                "message": f"Only {len(df)} data points available for {req.ticker}"
            }, status_code=400)
        
        # Train model
        model = train_stock_model(df)
        
        # Get latest data for prediction
        latest = df.iloc[-1]
        new_data = np.array([[latest['volume_millions'], latest['price_change_pct'], latest['volatility']]])
        predicted_return = model.predict(new_data)[0]
        
        # Create visualization
        plt.figure(figsize=(12, 6))
        
        # Plot 1: Price over time
        plt.subplot(1, 2, 1)
        plt.plot(df.index, df['Close'], color='#118DFF', linewidth=2)
        plt.fill_between(df.index, df['Close'], alpha=0.3, color='#118DFF')
        plt.xlabel("Date")
        plt.ylabel("Close Price ($)")
        plt.title(f"{req.ticker} Price History")
        plt.grid(True, alpha=0.3)
        plt.xticks(rotation=45)
        
        # Plot 2: Volume over time
        plt.subplot(1, 2, 2)
        colors = ['#12239E' if r > 0 else '#E66C37' for r in df['daily_return']]
        plt.bar(df.index, df['volume_millions'], color=colors, alpha=0.6)
        plt.xlabel("Date")
        plt.ylabel("Volume (Millions)")
        plt.title(f"{req.ticker} Trading Volume")
        plt.grid(True, alpha=0.3)
        plt.xticks(rotation=45)
        
        plt.tight_layout()
        plot_path = os.path.join(os.getcwd(), "backend", "ml_model", "stock_plot.png")
        os.makedirs(os.path.dirname(plot_path), exist_ok=True)
        plt.savefig(plot_path, bbox_inches="tight", dpi=100)
        plt.close()
        
        # Calculate statistics
        avg_return = df['daily_return'].mean()
        volatility = df['volatility'].mean()
        total_return = ((df['Close'].iloc[-1] - df['Close'].iloc[0]) / df['Close'].iloc[0]) * 100
        
        return JSONResponse({
            "ticker": req.ticker,
            "period": req.period,
            "predicted_return": round(float(predicted_return), 3),
            "statistics": {
                "avg_daily_return": round(float(avg_return), 3),
                "avg_volatility": round(float(volatility), 3),
                "total_return": round(float(total_return), 2),
                "latest_price": round(float(df['Close'].iloc[-1]), 2),
                "data_points": int(len(df))
            },
            "model_info": {
                "coefficients": {
                    "volume_millions": round(float(model.coef_[0]), 6),
                    "price_change_pct": round(float(model.coef_[1]), 6),
                    "volatility": round(float(model.coef_[2]), 6)
                },
                "intercept": round(float(model.intercept_), 6)
            },
            "plot_path": "/stock_plot"
        })
    except ValueError as e:
        # Handle data fetching errors with user-friendly messages
        return JSONResponse({
            "error": str(e),
            "message": "Please check the ticker symbol and try again. If the problem persists, the API may be temporarily unavailable."
        }, status_code=400)
    except Exception as e:
        # Handle unexpected errors
        return JSONResponse({
            "error": f"Analysis failed: {str(e)}",
            "type": type(e).__name__
        }, status_code=500)

@app.get("/stock_plot")
def get_stock_plot():
    plot_path = os.path.join(os.getcwd(), "backend", "ml_model", "stock_plot.png")
    return FileResponse(plot_path)

@app.get("/simulate/portfolio")
def simulate_portfolio(tickers: str = "TSLA,NVDA,SPY,AMD", weights: str = "0.25,0.25,0.25,0.25"):
    """
    Fetch recent stock data and compute cumulative portfolio value with FFT analysis.
    """
    try:
        tickers_list = [t.strip().upper() for t in tickers.split(",")]
        weights_arr = np.array([float(w) for w in weights.split(",")])
        weights_arr /= weights_arr.sum()  # Normalize weights

        # Fetch data from Stooq for each ticker
        end_date = datetime.now()
        start_date = end_date - timedelta(days=90)
        
        all_data = {}
        for ticker in tickers_list:
            try:
                df = pdr.DataReader(ticker, 'stooq', start_date, end_date)
                if not df.empty:
                    all_data[ticker] = df['Close'].sort_index()
            except Exception as e:
                print(f"Failed to fetch {ticker}: {e}")
        
        if not all_data:
            return JSONResponse({"error": "No data could be fetched for the provided tickers"}, status_code=400)
        
        # Combine into single DataFrame
        data = pd.DataFrame(all_data)
        data = data.dropna()
        
        if len(data) < 2:
            return JSONResponse({"error": "Insufficient data points"}, status_code=400)
        
        returns = data.pct_change().dropna()

        # Compute portfolio value over time
        portfolio_values = (1 + (returns * weights_arr).sum(axis=1)).cumprod() * 10000
        portfolio_df = portfolio_values.reset_index()
        portfolio_df.columns = ['Date', 'Value']
        
        # Compute FFT of portfolio curve for volatility spectrum
        portfolio_returns = portfolio_values.pct_change().dropna().values
        fft_result = fft_features(portfolio_returns)
        
        # Get top 5 frequency components (volatility spectrum)
        freqs = np.array(fft_result['freqs'])
        mags = np.array(fft_result['magnitude'])
        
        # Find indices of top 5 magnitudes (excluding DC component at index 0)
        top_indices = np.argsort(mags[1:])[-5:][::-1] + 1
        top_freqs = [float(freqs[i]) for i in top_indices]
        top_mags = [float(mags[i]) for i in top_indices]
        
        # Calculate mean and std from portfolio returns
        mean_return = float(np.mean(portfolio_returns))
        std_return = float(np.std(portfolio_returns))

        return {
            "date": portfolio_df["Date"].dt.strftime("%Y-%m-%d").tolist(),
            "value": portfolio_df["Value"].tolist(),
            "tickers": tickers_list,
            "fft_spectrum": {
                "frequencies": top_freqs,
                "magnitudes": top_mags,
                "mean": mean_return,
                "std": std_return
            },
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return JSONResponse({"error": f"Simulation failed: {str(e)}"}, status_code=500)

@app.get("/quantum/state")
def quantum_state(n: int = 4):
    """
    Get quantum state visualization data for Bloch sphere representation.
    Returns theta and phi angles for each qubit.
    """
    from quantum.qaoa_optimizer import get_qaoa_state_preview
    
    qubits = get_qaoa_state_preview(n)
    return {"qubits": qubits}