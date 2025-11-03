import numpy as np
import pandas as pd
from numpy.typing import NDArray
from typing import Dict, Any
from sklearn.linear_model import LinearRegression
import pandas_datareader as pdr
from datetime import datetime, timedelta
import time
import os

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

def fetch_stock_data(ticker: str = "SPY", period: str = "1mo") -> pd.DataFrame:
    """Fetch real-time stock data from multiple sources and prepare features.
    
    Uses Stooq (free, no API key) as primary source with fallback to realistic demo data.
    
    Args:
        ticker: Stock ticker symbol (default: SPY - S&P 500 ETF)
        period: Time period for data (default: 1mo)
    
    Returns:
        DataFrame with features: volume_millions, price_change_pct, volatility, daily_return
    """
    df = None
    end_date = datetime.now()
    start_date = end_date - timedelta(days=35)  # Get extra days for rolling calculations
    
    # Try Stooq (free, no API key required, works for US stocks)
    try:
        df = pdr.DataReader(ticker, 'stooq', start_date, end_date)
        if not df.empty:
            # Stooq returns data in reverse chronological order, sort it
            df = df.sort_index()
            # Ensure proper column names
            if 'Volume' not in df.columns and 'volume' in df.columns:
                df.rename(columns={'volume': 'Volume'}, inplace=True)
    except Exception as e:
        print(f"⚠️ Stooq API error for {ticker}: {str(e)[:100]}")
    
    # If Stooq fails, generate realistic demo data
    if df is None or df.empty or len(df) < 5:
        print(f"📊 Using demo data for {ticker} (for real data: ensure ticker is valid US stock)")
        
        # Generate realistic stock data
        np.random.seed(hash(ticker) % 2**32)  # Consistent data per ticker
        dates = pd.date_range(start=start_date, end=end_date, freq='B')  # Business days
        
        # Base price depends on ticker
        base_prices = {
            'SPY': 450, 'AAPL': 180, 'MSFT': 380, 'GOOGL': 140,
            'TSLA': 250, 'AMZN': 145, 'META': 320, 'NVDA': 480,
            'IBM': 140, 'NFLX': 450, 'DIS': 95
        }
        base_price = base_prices.get(ticker.upper(), 100)
        
        # Simulate realistic price movements with trends
        returns = np.random.normal(0.001, 0.012, len(dates))
        prices = base_price * (1 + returns).cumprod()
        
        df = pd.DataFrame({
            'Open': prices * (1 + np.random.normal(0, 0.003, len(dates))),
            'High': prices * (1 + abs(np.random.normal(0.008, 0.004, len(dates)))),
            'Low': prices * (1 - abs(np.random.normal(0.008, 0.004, len(dates)))),
            'Close': prices,
            'Volume': np.random.randint(40_000_000, 120_000_000, len(dates))
        }, index=dates)
        
        # Ensure High/Low make sense
        df['High'] = df[['Open', 'High', 'Close']].max(axis=1)
        df['Low'] = df[['Open', 'Low', 'Close']].min(axis=1)
    
    # Calculate features
    df['volume_millions'] = df['Volume'] / 1_000_000  # Volume in millions
    df['price_change_pct'] = ((df['Close'] - df['Open']) / df['Open']) * 100  # Daily % change
    df['volatility'] = df['Close'].rolling(window=5, min_periods=1).std()  # 5-day rolling volatility
    df['daily_return'] = ((df['Close'] - df['Close'].shift(1)) / df['Close'].shift(1)) * 100  # Daily return %
    
    # Drop NaN values
    df = df.dropna()
    
    return df

def train_stock_model(df: pd.DataFrame) -> LinearRegression:
    """Train a model to predict daily returns based on market features.
    
    Args:
        df: DataFrame with columns: volume_millions, price_change_pct, volatility, daily_return
    
    Returns:
        Trained LinearRegression model
    """
    X = df[["volume_millions", "price_change_pct", "volatility"]]
    y = df["daily_return"]
    model = LinearRegression()
    model.fit(X, y)
    return model

def train_rf_model(df):
    """Legacy function for RF efficiency - kept for backward compatibility"""
    X = df[["freq_MHz", "power_dBm", "temp_C"]]
    y = df["efficiency"]
    model = LinearRegression()
    model.fit(X, y)
    return model