import pandas as pd
import yfinance as yf
from typing import List

def fetch_prices(tickers: List[str], start: str = "2018-01-01", end: str = None) -> pd.DataFrame:
    data = yf.download(tickers, start=start, end=end, auto_adjust=True, progress=False)["Close"]
    if isinstance(data, pd.Series):
        data = data.to_frame()
    data = data.dropna(how="all").fillna(method="ffill").dropna()
    return data
