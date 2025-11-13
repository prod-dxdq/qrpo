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
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables from .env file in backend directory
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

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

        # Compute correlation matrix
        correlation_matrix = returns.corr()
        correlation_data = []
        for i, ticker1 in enumerate(tickers_list):
            for j, ticker2 in enumerate(tickers_list):
                correlation_data.append({
                    "x": ticker1,
                    "y": ticker2,
                    "value": float(correlation_matrix.iloc[i, j])
                })

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

        # Calculate asset metrics for 3D galaxy visualization
        asset_metrics = []
        market_returns = returns[tickers_list[0]] if len(tickers_list) > 0 else returns.mean(axis=1)  # Use first ticker as market proxy
        
        for i, ticker in enumerate(tickers_list):
            asset_returns = returns[ticker]
            
            # Calculate metrics
            mean_asset_return = float(asset_returns.mean())
            volatility = float(asset_returns.std())
            correlation_to_market = float(returns[ticker].corr(market_returns))
            weight = float(weights_arr[i])
            
            asset_metrics.append({
                "ticker": ticker,
                "weight": weight,
                "return": mean_asset_return,
                "volatility": volatility,
                "correlation": correlation_to_market
            })

        return {
            "date": portfolio_df["Date"].dt.strftime("%Y-%m-%d").tolist(),
            "value": portfolio_df["Value"].tolist(),
            "tickers": tickers_list,
            "correlation_matrix": correlation_data,
            "assets": asset_metrics,
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

class ChatRequest(BaseModel):
    message: str
    conversation_history: List[dict] = []

def get_stock_data(ticker: str):
    """Fetch real-time stock data from yfinance"""
    try:
        import yfinance as yf
        stock = yf.Ticker(ticker)
        info = stock.info
        hist = stock.history(period="1mo")
        
        if hist.empty:
            return None
            
        current_price = hist['Close'].iloc[-1]
        month_ago_price = hist['Close'].iloc[0]
        month_change = ((current_price - month_ago_price) / month_ago_price) * 100
        
        return {
            'ticker': ticker.upper(),
            'price': round(current_price, 2),
            'month_change': round(month_change, 2),
            'name': info.get('longName', ticker),
            'sector': info.get('sector', 'Unknown'),
            'pe_ratio': info.get('trailingPE', 'N/A'),
            'market_cap': info.get('marketCap', 'N/A')
        }
    except:
        return None

def analyze_market_sentiment():
    """Analyze current market sentiment using major indices"""
    try:
        import yfinance as yf
        indices = {
            'SPY': 'S&P 500',
            'QQQ': 'Nasdaq',
            'DIA': 'Dow Jones'
        }
        
        sentiment = {}
        for ticker, name in indices.items():
            stock = yf.Ticker(ticker)
            hist = stock.history(period="1mo")
            if not hist.empty:
                current = hist['Close'].iloc[-1]
                month_ago = hist['Close'].iloc[0]
                change = ((current - month_ago) / month_ago) * 100
                sentiment[name] = round(change, 2)
        
        return sentiment
    except:
        return None

def get_smart_finance_response(question: str) -> str:
    """Generate intelligent responses based on real market data"""
    import re
    q_lower = question.lower()
    
    # Extract ticker symbols from question (e.g., AAPL, MSFT, TSLA)
    ticker_pattern = r'\b[A-Z]{1,5}\b'
    potential_tickers = re.findall(ticker_pattern, question)
    
    # Check for specific stock mentions
    if potential_tickers:
        ticker = potential_tickers[0]
        stock_data = get_stock_data(ticker)
        if stock_data:
            trend = "📈 up" if stock_data['month_change'] > 0 else "📉 down"
            return f"""📊 **{stock_data['name']} ({stock_data['ticker']}) Analysis**

**Current Data:**
• Price: ${stock_data['price']}
• 1-Month Change: {trend} {abs(stock_data['month_change'])}%
• Sector: {stock_data['sector']}
• P/E Ratio: {stock_data['pe_ratio']}

**Analysis:**
{get_stock_recommendation(stock_data)}

**Technical Levels:**
• Support: ${round(stock_data['price'] * 0.95, 2)}
• Resistance: ${round(stock_data['price'] * 1.05, 2)}

This is based on real-time market data from Yahoo Finance."""
    
    # Stock buying questions
    if any(word in q_lower for word in ["buy", "purchase", "invest in", "stocks should i", "what stocks"]):
        market_sentiment = analyze_market_sentiment()
        sentiment_text = ""
        if market_sentiment:
            sentiment_text = "\n**Current Market:**\n"
            for index, change in market_sentiment.items():
                trend = "📈" if change > 0 else "📉"
                sentiment_text += f"• {index}: {trend} {change}%\n"
        
        # Get real data for top recommendations
        recommendations = []
        top_picks = ['NVDA', 'MSFT', 'AAPL', 'GOOGL']
        for ticker in top_picks:
            data = get_stock_data(ticker)
            if data:
                recommendations.append(data)
        
        rec_text = ""
        if recommendations:
            rec_text = "\n**Top Picks (Real-Time Data):**\n"
            for stock in recommendations[:3]:
                trend = "📈" if stock['month_change'] > 0 else "📉"
                rec_text += f"• **{stock['ticker']}** ${stock['price']} ({trend} {abs(stock['month_change'])}% this month)\n"
        
        return f"""📈 **Smart Stock Recommendations**
{sentiment_text}
{rec_text}

**Strategy:**
• Dollar-cost average over 4-6 weeks
• Set stop-losses at 8% below entry
• Target 15-25% gains over 6-12 months
• Diversify across 5+ positions

**Sectors to Watch:**
• 🤖 AI/Tech - Strong momentum with AI boom
• ⚕️ Healthcare - Defensive with aging demographics  
• ⚡ Clean Energy - Long-term growth trend
• 🏦 Financials - Benefit from higher rates

⚠️ **Risk Management:** Monitor Fed policy, inflation data, and earnings reports. Never invest more than you can afford to lose."""

    # Selling questions
    elif any(word in q_lower for word in ["sell", "exit", "take profit", "when should i sell"]):
        return """💰 **Strategic Exit Planning (Real-Time Analysis)**

**When to Sell:**
1. **Profit Target Hit** - Lock in 20-30% gains on growth stocks
2. **Fundamental Change** - Company misses earnings 2+ quarters
3. **Technical Break** - Price drops below 200-day moving average with volume
4. **Portfolio Rebalancing** - Trim positions exceeding 15% of portfolio

**Exit Signals:**
• 📊 RSI > 70 (overbought) + bearish divergence
• 📉 Break below key support with high volume
• 🔴 Negative earnings surprise + guidance cut
• 🌍 Sector rotation out of your holdings

**Tax Optimization:**
• Hold > 1 year for long-term capital gains (15-20% tax vs 22-37%)
• Harvest losses to offset gains
• Consider selling in low-income years

**Rule of Thumb:** 
• Sell 25% at +20% gain
• Sell 25% at +40% gain  
• Keep 50% with trailing stop-loss for long-term growth

**Pro Tip:** Set alerts for technical breaks and earnings dates. Don't let emotions drive decisions!"""

    # Portfolio/diversification questions
    elif any(word in q_lower for word in ["portfolio", "diversif", "allocat", "balance"]):
        return """🎯 **Optimal Portfolio Construction**

**Recommended Allocation (Moderate Risk):**
• 40% - Large Cap Stocks (SPY, VOO)
• 20% - Growth Tech (QQQ, individual picks)
• 15% - International (VEA, VWO)
• 10% - Bonds (BND, TLT)
• 10% - Real Estate/Commodities (VNQ, GLD)
• 5% - Cash/High-Yield Savings

**Diversification Rules:**
✅ 10+ individual stocks across 5+ sectors
✅ No single position > 15% of portfolio
✅ Mix of growth, value, and dividend stocks
✅ Rebalance quarterly when drift > 5%

**Risk Levels:**
• **Conservative:** 60/40 stocks/bonds (Sharpe ~0.7)
• **Moderate:** 70/30 stocks/bonds (Sharpe ~0.9)
• **Aggressive:** 90/10 stocks/bonds (Sharpe ~1.1)

**Quantum Enhancement:**  
Use QAOA algorithms (like in this app!) to optimize correlation matrices and find efficient frontier allocations with better risk-adjusted returns."""

    # Risk questions
    elif any(word in q_lower for word in ["risk", "volatil", "protect", "hedge", "drawdown"]):
        return """🛡️ **Risk Management Strategies**

**Position Sizing:**
• Max 5% per stock
• Max 15% per sector
• Keep 5-10% cash for opportunities

**Stop Loss Strategy:**
• Growth stocks: 8% trailing stop
• Blue chips: 15% trailing stop
• High volatility: 12% trailing stop

**Portfolio Hedges:**
• **GLD (Gold)** - Inflation & crisis hedge
• **TLT (Long Bonds)** - Flight-to-safety
• **VIX Calls** - Volatility spike protection
• **Put Options** - Downside insurance

**Risk Metrics to Monitor:**
📊 **Beta** - Portfolio sensitivity to market (target: 0.8-1.2)
📉 **Sharpe Ratio** - Return per unit risk (target: > 1.0)
🎲 **Max Drawdown** - Worst peak-to-trough loss (keep < 20%)
📈 **Sortino Ratio** - Downside risk focus (target: > 1.5)

**Advanced:** Use quantum VQE algorithms for more accurate Value-at-Risk (VaR) calculations and tail-risk modeling."""

    # Market/economic questions
    elif any(word in q_lower for word in ["market", "economy", "fed", "inflation", "interest rate", "recession"]):
        market_sentiment = analyze_market_sentiment()
        sentiment_text = ""
        if market_sentiment:
            sentiment_text = "**Current Market Performance:**\n"
            for index, change in market_sentiment.items():
                trend = "📈 Bullish" if change > 2 else "📉 Bearish" if change < -2 else "➡️ Neutral"
                sentiment_text += f"• {index}: {change}% ({trend})\n"
        
        return f"""🌍 **Market & Economic Analysis**

{sentiment_text}

**Key Factors to Watch:**

**Federal Reserve:**
• Interest rate decisions (affects borrowing costs)
• Quantitative tightening/easing
• Forward guidance signals

**Economic Indicators:**
• 📊 CPI/PCE inflation data
• 💼 Unemployment rate
• 🏭 Manufacturing PMI
• 🏘️ Housing starts
• 📈 GDP growth rate

**Market Sentiment:**
• VIX (Fear Index): <15 = complacent, >30 = panic
• Put/Call Ratio: <0.7 = bullish, >1.1 = bearish  
• Breadth indicators (advance/decline line)

**Recession Signals:**
⚠️ Inverted yield curve (2yr > 10yr)
⚠️ 3+ months of declining GDP
⚠️ Rising unemployment + declining earnings

**Action Plan:**
• Stay diversified across asset classes
• Increase cash in late cycle
• Favor quality companies with strong balance sheets"""

    # Quantum computing questions
    elif any(word in q_lower for word in ["quantum", "qaoa", "vqe", "qubit"]):
        return """⚛️ **Quantum Computing in Finance**

**Key Applications:**

**1. Portfolio Optimization (QAOA)**
• Solve NP-hard portfolio selection efficiently
• Handle 100+ asset universes
• Find global optimum vs local minimum
• 10-1000x speedup over classical methods

**2. Risk Analysis (VQE)**
• More accurate correlation modeling
• Better tail-risk estimation  
• Dynamic hedging strategies

**3. Option Pricing**
• Quantum Monte Carlo for derivatives
• Faster convergence rates
• Path-dependent option handling

**This App Uses:**
✅ Qiskit QAOA for portfolio optimization
✅ Classical ML + RF features from price signals
✅ Quantum state visualization (Bloch sphere)

**Current State:**
• Available: IBM Quantum, AWS Braket, Azure Quantum
• Limitations: 50-100 qubits, error correction challenges
• Timeline: Quantum advantage in 2-5 years

**Practical Use:** Combine quantum optimization with classical ML for hybrid strategies. Try the "Run Optimization" feature in this app!"""

    # Technical analysis questions
    elif any(word in q_lower for word in ["technical", "indicator", "chart", "moving average", "rsi", "macd", "support", "resistance"]):
        return """📊 **Technical Analysis Toolkit**

**Trend Indicators:**
• **MA 50/200** - Golden cross = buy | Death cross = sell
• **MACD (12,26,9)** - Crossovers show momentum shifts
• **ADX** - Trend strength (>25 = strong trend)

**Momentum:**
• **RSI (14)** - <30 oversold (buy) | >70 overbought (sell)
• **Stochastic** - Confirm RSI signals
• **Bollinger Bands** - Volatility breakouts (2 std dev)

**Volume Analysis:**
• **OBV** - Confirm price trends with volume
• **VWAP** - Intraday fair value
• **Volume Profile** - Key support/resistance

**Chart Patterns:**
📈 Bullish: Cup & handle, ascending triangle, double bottom
📉 Bearish: Head & shoulders, descending triangle, double top

**Trading Signals:**
✅ **Strong Buy:** RSI climbing from <30 + MACD crossover + volume surge
⚠️ **Caution:** Bearish divergence (price ↑, indicator ↓)
❌ **Sell:** RSI >70 + MA200 breakdown + distribution

**Pro Tip:** Use 3+ indicators for confirmation. Never trade on a single signal. This app uses RF features from FFT analysis for signal processing!"""

    # Crypto questions  
    elif any(word in q_lower for word in ["crypto", "bitcoin", "ethereum", "btc", "eth", "blockchain"]):
        return """₿ **Cryptocurrency Investment Guide**

**Major Cryptocurrencies:**
• **Bitcoin (BTC)** - Digital gold, store of value
• **Ethereum (ETH)** - Smart contract platform  
• **Solana (SOL)** - Fast, low-cost transactions

**Investment Strategies:**
1. **DCA Strategy** - Buy fixed $ amount weekly
2. **HODL** - Long-term hold through volatility
3. **Rebalancing** - Take profits at resistance levels

**Risk Management:**
⚠️ Never invest more than 5-10% of portfolio in crypto
⚠️ Use hardware wallets for large amounts
⚠️ Understand tax implications (capital gains)

**Key Metrics:**
• Market cap & circulating supply
• Trading volume (higher = more liquid)
• Network activity & adoption
• Developer activity on GitHub

**Caution:** Crypto is highly volatile (50%+ swings). Only invest what you can afford to lose. Not FDIC insured."""

    # Options/derivatives
    elif any(word in q_lower for word in ["option", "call", "put", "derivative", "covered call", "iron condor"]):
        return """📜 **Options Trading Strategies**

**Basic Strategies:**

**1. Covered Call** (Income generation)
• Own 100 shares, sell 1 call option
• Earn premium, cap upside
• Best when: Stock is flat/slightly bullish

**2. Cash-Secured Put** (Buy stock cheaper)
• Sell put, keep cash to buy if assigned
• Earn premium while waiting
• Best when: Want to own stock at lower price

**3. Protective Put** (Insurance)
• Own stock, buy put option
• Limit downside risk
• Best when: Holding through uncertainty

**Advanced:**
• **Iron Condor** - Neutral strategy, profit from low volatility
• **Bull/Bear Spreads** - Directional bets with defined risk
• **Straddle** - Profit from big moves either direction

**Greeks to Know:**
• Delta (Δ) - Price sensitivity
• Theta (Θ) - Time decay (enemy of buyers)
• Vega (V) - Volatility sensitivity  
• Gamma (Γ) - Delta change rate

**Risk Warning:** Options can expire worthless. Start small, paper trade first, and never risk more than 5% per trade."""

    # General/default response
    else:
        return """💼 **AI Finance Assistant (Real-Time Data)**

I can help you with:

**Stock Analysis:**
• Specific buy/sell recommendations with real-time prices
• Technical analysis with current indicators
• Fundamental analysis using live market data

**Portfolio Management:**
• Asset allocation strategies
• Risk management and hedging
• Diversification optimization with quantum algorithms

**Market Insights:**
• Current market sentiment (S&P 500, Nasdaq, Dow)
• Economic indicators and Fed policy
• Sector rotation analysis

**Advanced Topics:**
• Quantum computing for portfolio optimization (QAOA)
• Options strategies and derivatives
• Tax-efficient investing

**Ask me questions like:**
• "What stocks should I buy right now?"
• "Analyze AAPL for me"
• "When should I sell my tech stocks?"
• "How do I build a diversified portfolio?"
• "What are the best risk management strategies?"

I provide actionable advice using **real-time data from Yahoo Finance**! 📈"""

def get_stock_recommendation(stock_data):
    """Generate recommendation based on stock performance"""
    change = stock_data['month_change']
    
    if change > 10:
        return f"""**Recommendation:** ⚠️ **Caution - Overbought**
The stock has gained {change}% in the last month, which may indicate overbought conditions. Consider:
• Waiting for a pullback (5-10% correction)
• Taking partial profits if you own it
• Setting alerts at support levels"""
    elif change > 5:
        return f"""**Recommendation:** ✅ **Bullish Momentum**
Strong uptrend with {change}% monthly gain. Consider:
• Entry on minor dips (2-3%)
• Stop-loss at 8% below entry
• Target: +15-20% over next 3-6 months"""
    elif change > -5:
        return f"""**Recommendation:** ➡️ **Consolidation**
Stock is relatively flat ({change}% monthly). Consider:
• Accumulating on weakness for long-term hold
• Selling covered calls for income
• Monitoring for breakout/breakdown"""
    else:
        return f"""**Recommendation:** 📉 **Bearish - Avoid**
Stock is down {abs(change)}% this month. Consider:
• Waiting for trend reversal confirmation
• Looking for better opportunities
• If you own it, review your thesis"""


@app.post("/chat")
async def chat(req: ChatRequest):
    """
    AI-powered finance chatbot endpoint with real-time market data.
    Uses yfinance for live stock prices and market analysis.
    """
    try:
        # Use smart responses with real market data
        response_text = get_smart_finance_response(req.message)
        
        return {
            "response": response_text,
            "model": "yfinance-powered",
            "tokens": 0
        }
        
    except Exception as e:
        print(f"Chat error: {str(e)}")
        return JSONResponse({
            "response": f"❌ Error: {str(e)}\n\nPlease try again with a different question.",
            "error": str(e)
        }, status_code=200)


