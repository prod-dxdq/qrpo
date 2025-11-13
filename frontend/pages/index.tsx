import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import dynamic from 'next/dynamic';

// Dynamically import BlochViewer to avoid SSR issues with Three.js
const BlochViewer = dynamic(() => import('../components/BlochViewer'), { 
  ssr: false,
  loading: () => <div className="h-80 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl shadow-inner p-2 flex items-center justify-center"><div className="text-gray-600">Loading...</div></div>
});

// Dynamically import PortfolioGalaxy to avoid SSR issues with Three.js
const PortfolioGalaxy = dynamic(() => import('../components/PortfolioGalaxy'), { 
  ssr: false,
  loading: () => <div className="h-[500px] bg-gradient-to-br from-indigo-950 to-purple-950 rounded-xl shadow-inner flex items-center justify-center"><div className="text-slate-300">Loading Galaxy...</div></div>
});

// Dynamically import FinanceBot
const FinanceBot = dynamic(() => import('../components/FinanceBot'), { 
  ssr: false
});

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Minimal inline icons to avoid extra deps
const X = () => <span className="ml-2 text-xs px-1 rounded hover:bg-black/10">✕</span>;
const Chevron = ({ open }: { open: boolean }) => (
  <span className="text-gray-500">{open ? '▲' : '▼'}</span>
);

export default function Home() {
  const [health, setHealth] = useState<string>('checking...');
  const [fftStats, setFftStats] = useState<any>(null);
  const [classical, setClassical] = useState<any>(null);
  const [quantum, setQuantum] = useState<any>(null);
  const [quantumState, setQuantumState] = useState<any>(null);
  const [rfResult, setRfResult] = useState<any>(null);
  const [stockTicker, setStockTicker] = useState<string>('SPY');
  const [simData, setSimData] = useState<any>(null);
  const [portfolioTickers, setPortfolioTickers] = useState<string>('TSLA,NVDA,SPY,AMD');
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);
  const [loading, setLoading] = useState<string>('');
  const [loadingSim, setLoadingSim] = useState(false);

  // Tabs and sidebar state
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ signals: true, strategies: true, ml: true, visualizations: true });

  // Brand palette
  const colors = ['#118DFF', '#12239E', '#E66C37', '#6B007B'];

  // Stock recommendations by category
  const stockRecommendations = {
    'Tech Stocks': ['AAPL (Apple)', 'MSFT (Microsoft)', 'GOOGL (Alphabet)', 'NVDA (NVIDIA)', 'META (Meta)'],
    'Blue Chips': ['JNJ (Johnson & Johnson)', 'PG (Procter & Gamble)', 'KO (Coca-Cola)', 'WMT (Walmart)', 'JPM (JPMorgan)'],
    'Growth Stocks': ['TSLA (Tesla)', 'AMZN (Amazon)', 'NFLX (Netflix)', 'SHOP (Shopify)', 'SQ (Block)'],
    'Bonds': ['TLT (20+ Year Treasury)', 'AGG (Aggregate Bond)', 'BND (Total Bond)', 'LQD (Investment Grade)', 'VCIT (Intermediate Corp)']
  };

  const perf = (objective: number) => {
    if (objective > 0) return { label: '📈 Potential Profit', pill: 'bg-emerald-100 text-emerald-700', bg: 'bg-emerald-50' };
    if (objective < -0.01) return { label: '📉 High Risk', pill: 'bg-rose-100 text-rose-700', bg: 'bg-rose-50' };
    return { label: '⚖️ Balanced', pill: 'bg-amber-100 text-amber-700', bg: 'bg-amber-50' };
  };

  const openTab = (id: string) => {
    if (!openTabs.includes(id)) setOpenTabs([...openTabs, id]);
    setActiveTab(id);
  };
  const closeTab = (id: string) => {
    const next = openTabs.filter(t => t !== id);
    setOpenTabs(next);
    if (activeTab === id) setActiveTab(next[next.length - 1] || '');
  };
  const toggle = (id: string) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  useEffect(() => {
    fetch(`${API}/health`).then(r => r.json()).then(j => setHealth(j.status)).catch(() => setHealth('error'));
  }, []);

  const runFFT = async () => {
    try {
      setLoading('fft');
      const n = 256;
      const series = Array.from({ length: n }, (_, i) => {
        const t = i / n;
        return Math.sin(2 * Math.PI * 4 * t) + 0.3 * Math.sin(2 * Math.PI * 15 * t) + (Math.random() - 0.5) * 0.1;
      });
      const res = await fetch(`${API}/features/fft`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ series }) });
      setFftStats(await res.json());
      openTab('signals');
    } finally { setLoading(''); }
  };

  const runClassical = async () => {
    try {
      setLoading('classical');
      const mu = [0.12, 0.1, 0.08, 0.06];
      const cov = [
        [0.10, 0.02, 0.01, 0.00],
        [0.02, 0.09, 0.02, 0.01],
        [0.01, 0.02, 0.08, 0.02],
        [0.00, 0.01, 0.02, 0.07],
      ];
      const lam = 0.5;
      const res = await fetch(`${API}/optimize/classical`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mu, cov, lam }) });
      setClassical(await res.json());
      openTab('classical');
    } finally { setLoading(''); }
  };

  const runQuantum = async () => {
    try {
      setLoading('quantum');
      const mu = [0.12, 0.10, 0.08, 0.06];
      const cov = [
        [0.10, 0.02, 0.01, 0.00],
        [0.02, 0.09, 0.02, 0.01],
        [0.01, 0.02, 0.08, 0.02],
        [0.00, 0.01, 0.02, 0.07],
      ];
      const lam = 0.5;
      const res = await fetch(`${API}/optimize/quantum`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mu, cov, lam, reps: 1 }) });
      setQuantum(await res.json());
      openTab('quantum');
    } finally { setLoading(''); }
  };

  const runStockAnalysis = async () => {
    try {
      setLoading('stock');
      const res = await fetch(`${API}/stock/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker: stockTicker, period: '1mo' })
      });
      const data = await res.json();
      
      if (!res.ok || data.error) {
        alert(`Error: ${data.error || data.message || 'Failed to analyze stock'}`);
        return;
      }
      
      setRfResult(data);
      openTab('stock');
    } finally { setLoading(''); }
  };

  const loadQuantumState = async () => {
    try {
      setLoading('quantumState');
      const res = await fetch(`${API}/quantum/state?n=4`);
      const data = await res.json();
      setQuantumState(data);
      openTab('quantumState'); // Open as tab
    } catch (error) {
      console.error('Failed to load quantum state:', error);
      alert('Failed to load quantum state visualization');
    } finally {
      setLoading('');
    }
  };

  const runSimulation = async (customTickers?: string) => {
    try {
      setLoadingSim(true);
      const tickersToUse = customTickers || portfolioTickers;
      const tickerCount = tickersToUse.split(',').length;
      const equalWeight = (1 / tickerCount).toFixed(2);
      const weights = Array(tickerCount).fill(equalWeight).join(',');
      
      const res = await fetch(`${API}/simulate/portfolio?tickers=${encodeURIComponent(tickersToUse)}&weights=${weights}`);
      const data = await res.json();
      
      if (data.error) {
        alert(`Error: ${data.error}`);
        return;
      }
      
      setSimData(data);
    } finally {
      setLoadingSim(false);
    }
  };

  // Auto-refresh effect for real-time updates
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh && simData) {
      interval = setInterval(() => {
        runSimulation(portfolioTickers);
      }, 5000); // Refresh every 5 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, portfolioTickers, simData]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-slate-900/60 bg-slate-900/80 border-b border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-400 via-indigo-500 to-violet-600 shadow-lg shadow-violet-500/30" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Quantum RF Portfolio Optimizer</h1>
              <div className="mt-1">
                <span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium ${health === 'ok' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'}`}>
                  <span className={`inline-block h-2 w-2 rounded-full ${health === 'ok' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                  {health === 'ok' ? 'Connected' : 'Offline'}
                </span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <nav className="hidden md:flex items-center gap-1">
            {openTabs.map((id) => {
              const label: Record<string, string> = { 
                signals: 'Market Signals', 
                classical: 'Traditional', 
                quantum: 'Quantum', 
                comparison: 'Comparison', 
                stock: 'Stock Analysis',
                galaxy: '🌌 Portfolio Galaxy',
                quantumState: '⚛️ Quantum States'
              };
              const active = activeTab === id;
              return (
                <button key={id} onClick={() => setActiveTab(id)} className={`group inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all ${active ? 'bg-sky-500/20 text-sky-200 border border-sky-500/30 shadow-sm' : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'}`}>
                  {label[id]}
                  <span onClick={(e) => { e.stopPropagation(); closeTab(id); }} className="ml-2 rounded p-0.5 text-slate-400 hover:text-white hover:bg-white/10">✕</span>
                </button>
              );
            })}
            <a 
              href="/about" 
              className="ml-2 inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 border border-transparent transition-all"
            >
              About
            </a>
          </nav>
        </div>
      </header>

      {/* Body */}
      <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 px-6 py-6">
        {/* Sidebar */}
        <aside className="rounded-2xl bg-white/5 border border-white/10 p-4 lg:sticky lg:top-20 h-fit">
          <h2 className="text-sm font-semibold text-slate-300 mb-3">Analytics Menu</h2>

          {/* Section: Market Analysis */}
          <div className="mb-3">
            <button onClick={() => toggle('signals')} className="w-full flex items-center justify-between rounded-xl bg-white/5 hover:bg-white/10 transition p-3">
              <span className="font-medium">📊 Market Analysis</span>
              <Chevron open={!!expanded.signals} />
            </button>
            {expanded.signals && (
              <div className="pl-2.5 mt-2 space-y-2">
                <button disabled={loading==='fft'} onClick={runFFT} className="w-full text-left text-sm text-slate-300 hover:text-white hover:bg-sky-500/10 border border-white/10 rounded-lg px-3 py-2 transition">
                  {loading==='fft' ? '🔄 Analyzing…' : '🔍 Run Signal Analysis'}
                </button>
              </div>
            )}
          </div>

          {/* Section: Strategies */}
          <div>
            <button onClick={() => toggle('strategies')} className="w-full flex items-center justify-between rounded-xl bg-white/5 hover:bg-white/10 transition p-3">
              <span className="font-medium">💼 Investment Strategies</span>
              <Chevron open={!!expanded.strategies} />
            </button>
            {expanded.strategies && (
              <div className="pl-2.5 mt-2 space-y-2">
                <button disabled={loading==='classical'} onClick={runClassical} className="w-full text-left text-sm text-slate-300 hover:text-white hover:bg-indigo-500/10 border border-white/10 rounded-lg px-3 py-2 transition">{loading==='classical' ? '⏳ Computing…' : '🏛️ Traditional Strategy'}</button>
                <button disabled={loading==='quantum'} onClick={runQuantum} className="w-full text-left text-sm text-slate-300 hover:text-white hover:bg-violet-500/10 border border-white/10 rounded-lg px-3 py-2 transition">{loading==='quantum' ? '🔬 Processing…' : '⚛️ Quantum Strategy'}</button>
                {(classical && quantum) && (
                  <button onClick={() => openTab('comparison')} className="w-full text-left text-sm text-slate-300 hover:text-white hover:bg-amber-500/10 border border-white/10 rounded-lg px-3 py-2 transition">🏆 Compare Strategies</button>
                )}
              </div>
            )}
          </div>

          {/* Section: Visualizations */}
          <div className="mt-3">
            <button onClick={() => toggle('visualizations')} className="w-full flex items-center justify-between rounded-xl bg-white/5 hover:bg-white/10 transition p-3">
              <span className="font-medium">🌌 Visualizations</span>
              <Chevron open={!!expanded.visualizations} />
            </button>
            {expanded.visualizations && (
              <div className="pl-2.5 mt-2 space-y-2">
                <button 
                  onClick={() => {
                    if (simData && simData.assets) {
                      openTab('galaxy');
                    } else {
                      alert('Please run a Portfolio Simulation first to see the Galaxy view!');
                    }
                  }}
                  className="w-full text-left text-sm text-slate-300 hover:text-white hover:bg-purple-500/10 border border-white/10 rounded-lg px-3 py-2 transition"
                >
                  🌌 Portfolio Galaxy
                </button>
                <button 
                  onClick={loadQuantumState}
                  disabled={loading === 'quantumState'}
                  className="w-full text-left text-sm text-slate-300 hover:text-white hover:bg-violet-500/10 border border-white/10 rounded-lg px-3 py-2 transition"
                >
                  {loading === 'quantumState' ? '⏳ Loading...' : '⚛️ Quantum States'}
                </button>
              </div>
            )}
          </div>

          {/* Section: ML Models */}
          <div className="mt-3">
            <button onClick={() => toggle('ml')} className="w-full flex items-center justify-between rounded-xl bg-white/5 hover:bg-white/10 transition p-3">
              <span className="font-medium">🤖 Machine Learning</span>
              <Chevron open={!!expanded.ml} />
            </button>
            {expanded.ml && (
              <div className="pl-2.5 mt-2 space-y-2">
                <div className="w-full text-left text-sm border border-white/10 rounded-lg px-3 py-2">
                  <label className="text-slate-300 block mb-1.5">Ticker Symbol</label>
                  <input 
                    type="text" 
                    value={stockTicker} 
                    onChange={(e) => setStockTicker(e.target.value.toUpperCase())} 
                    placeholder="SPY"
                    className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-pink-500"
                  />
                  <button 
                    onClick={runStockAnalysis} 
                    disabled={loading==='stock'} 
                    className="w-full mt-2 bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 disabled:opacity-50 text-white rounded-lg px-3 py-1.5 text-sm font-medium transition"
                  >
                    {loading==='stock' ? '📊 Analyzing…' : '📈 Analyze Stock'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main>
          {/* Empty state */}
          {activeTab === '' && (
            <div className="space-y-6">
              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.03] p-8 text-center">
                <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-sky-500/20 blur-3xl" />
                <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl" />
                <div className="relative">
                  <div className="text-6xl mb-3">📊</div>
                  <h3 className="text-xl font-semibold mb-2">Welcome to your investment cockpit</h3>
                  <p className="text-slate-300">Choose an analysis from the left to get started.</p>
                </div>
              </div>

              {/* Real-Time Profit Wave */}
              <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">💸 Real-Time Profit Wave</h2>
                  {simData && (
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={autoRefresh} 
                          onChange={(e) => setAutoRefresh(e.target.checked)}
                          className="w-4 h-4 rounded"
                        />
                        <span>Auto-refresh (5s)</span>
                      </label>
                      {autoRefresh && <span className="text-emerald-400 animate-pulse">●</span>}
                    </div>
                  )}
                </div>

                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <div className="md:col-span-2">
                    <label className="text-sm text-slate-300 block mb-1.5">Portfolio Tickers (comma-separated)</label>
                    <input 
                      type="text" 
                      value={portfolioTickers}
                      onChange={(e) => setPortfolioTickers(e.target.value.toUpperCase())}
                      placeholder="TSLA,NVDA,SPY,AMD"
                      className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="flex items-end">
                    <button 
                      onClick={() => runSimulation()}
                      disabled={loadingSim}
                      className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 text-white rounded-lg px-4 py-2 font-medium transition"
                    >
                      {loadingSim ? '⏳ Loading...' : '📈 Simulate'}
                    </button>
                  </div>
                </div>

                {simData && (
                  <div className="space-y-4">
                    {/* Correlation Heatmap */}
                    {simData.correlation_matrix && (
                      <div className="bg-gradient-to-br from-rose-900/20 to-pink-900/20 border border-rose-700/30 rounded-xl p-4">
                        <h3 className="text-sm font-semibold mb-3 text-rose-300 flex items-center gap-2">
                          <span>🔥</span>
                          Asset Correlation Heatmap
                        </h3>
                        <div className="overflow-x-auto">
                          <div className="inline-block min-w-full">
                            {/* Heatmap Grid */}
                            <div className="grid gap-1" style={{ gridTemplateColumns: `auto repeat(${simData.tickers.length}, 1fr)` }}>
                              {/* Top left corner (empty) */}
                              <div className="w-16"></div>
                              {/* Column headers */}
                              {simData.tickers.map((ticker: string) => (
                                <div key={`header-${ticker}`} className="text-xs font-mono text-slate-300 text-center py-1">
                                  {ticker}
                                </div>
                              ))}
                              
                              {/* Rows */}
                              {simData.tickers.map((ticker1: string, i: number) => (
                                <>
                                  {/* Row header */}
                                  <div key={`row-${ticker1}`} className="text-xs font-mono text-slate-300 text-right pr-2 flex items-center justify-end">
                                    {ticker1}
                                  </div>
                                  {/* Correlation cells */}
                                  {simData.tickers.map((ticker2: string, j: number) => {
                                    const corrValue = simData.correlation_matrix.find(
                                      (c: any) => c.x === ticker1 && c.y === ticker2
                                    )?.value || 0;
                                    
                                    // Color scale: red (-1) -> yellow (0) -> green (1)
                                    const getColor = (val: number) => {
                                      if (val > 0.7) return 'bg-emerald-500';
                                      if (val > 0.4) return 'bg-lime-500';
                                      if (val > 0.1) return 'bg-yellow-500';
                                      if (val > -0.1) return 'bg-amber-500';
                                      if (val > -0.4) return 'bg-orange-500';
                                      return 'bg-red-500';
                                    };
                                    
                                    const getTextColor = (val: number) => {
                                      if (Math.abs(val) > 0.5) return 'text-white';
                                      return 'text-slate-900';
                                    };
                                    
                                    return (
                                      <div
                                        key={`cell-${ticker1}-${ticker2}`}
                                        className={`${getColor(corrValue)} ${getTextColor(corrValue)} rounded aspect-square flex items-center justify-center text-xs font-bold transition-all duration-300 hover:scale-110 hover:shadow-lg cursor-pointer relative group`}
                                        title={`${ticker1} vs ${ticker2}: ${corrValue.toFixed(3)}`}
                                      >
                                        <span className="text-[10px] opacity-90">{corrValue.toFixed(2)}</span>
                                        {/* Tooltip on hover */}
                                        <div className="absolute bottom-full mb-2 hidden group-hover:block bg-slate-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10 shadow-xl border border-slate-600">
                                          {ticker1} ↔ {ticker2}: {corrValue.toFixed(3)}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </>
                              ))}
                            </div>
                            
                            {/* Legend */}
                            <div className="mt-4 flex items-center gap-2 text-xs">
                              <span className="text-slate-400">Correlation:</span>
                              <div className="flex items-center gap-1">
                                <div className="w-4 h-4 bg-red-500 rounded"></div>
                                <span className="text-slate-400">-1.0</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                                <span className="text-slate-400">0.0</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <div className="w-4 h-4 bg-emerald-500 rounded"></div>
                                <span className="text-slate-400">+1.0</span>
                              </div>
                            </div>
                            
                            {/* Educational note */}
                            <div className="mt-3 text-xs text-slate-400 bg-white/5 rounded-lg p-3 border border-white/10">
                              <strong className="text-rose-300">📚 How to read:</strong>
                              <ul className="mt-1 space-y-1 list-disc list-inside">
                                <li><span className="text-emerald-400">Green (0.7-1.0):</span> Assets move together (high correlation risk)</li>
                                <li><span className="text-yellow-400">Yellow (0.0):</span> No correlation (neutral)</li>
                                <li><span className="text-red-400">Red (-1.0 to -0.4):</span> Assets move opposite (diversification benefit!)</li>
                              </ul>
                              <p className="mt-2 text-slate-500">
                                💡 <strong>Tip:</strong> Look for red cells off the diagonal for better diversification.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 3D Portfolio Galaxy */}
                    {simData.assets && simData.assets.length > 0 && (
                      <div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-indigo-700/30 rounded-xl p-4">
                        <div className="flex items-start gap-3 mb-4">
                          <div className="text-3xl">🌌</div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-indigo-300 mb-2">Portfolio Galaxy Visualization</h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                              Your portfolio as a solar system. Each asset is a planet orbiting the center. 
                              <strong className="text-indigo-300"> Size = allocation</strong>, 
                              <strong className="text-purple-300"> speed = volatility</strong>, 
                              <strong className="text-pink-300"> distance = market correlation</strong>.
                            </p>
                          </div>
                        </div>
                        
                        <PortfolioGalaxy 
                          assets={simData.assets}
                          onAssetClick={(asset) => {
                            console.log('Selected asset:', asset);
                          }}
                        />
                        
                        <div className="mt-4 bg-indigo-950/50 rounded-lg p-4 border border-indigo-800/30">
                          <h4 className="text-sm font-semibold text-indigo-300 mb-2">🎓 Understanding the Galaxy</h4>
                          <div className="grid md:grid-cols-2 gap-3 text-xs text-slate-300">
                            <div>
                              <strong className="text-yellow-400">☀️ Central Sun:</strong>
                              <p className="text-slate-400 mt-1">Represents your portfolio's center. All assets orbit around this balanced point.</p>
                            </div>
                            <div>
                              <strong className="text-blue-400">🌍 Planet Size:</strong>
                              <p className="text-slate-400 mt-1">Bigger planets = larger allocation %. Your biggest holdings are most visible.</p>
                            </div>
                            <div>
                              <strong className="text-purple-400">💨 Orbit Speed:</strong>
                              <p className="text-slate-400 mt-1">Fast orbits = high volatility. Watch volatile assets zoom around!</p>
                            </div>
                            <div>
                              <strong className="text-pink-400">📍 Distance from Sun:</strong>
                              <p className="text-slate-400 mt-1">Far planets = low market correlation. These provide diversification benefits.</p>
                            </div>
                          </div>
                          <div className="mt-3 pt-3 border-t border-indigo-800/30 text-xs text-slate-400">
                            <strong className="text-indigo-300">💡 Investment Insight:</strong> Ideally, you want planets at different distances (diversification) with varied orbit speeds (mixed volatility). If all planets are close together and moving at the same speed, your portfolio is concentrated!
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Portfolio Value Chart */}
                    <div className="bg-white/10 rounded-xl p-4">
                      <h3 className="text-sm font-semibold mb-3 text-slate-200">Portfolio Value Over Time</h3>
                      <ResponsiveContainer width="100%" height={250}>
                        <LineChart
                          data={simData.date.map((d: string, i: number) => ({ date: d, value: simData.value[i] }))}
                        >
                          <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                          <YAxis tick={{ fill: '#94a3b8' }} />
                          <Tooltip 
                            formatter={(v: number) => `$${v.toFixed(2)}`}
                            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                            labelStyle={{ color: '#cbd5e1' }}
                          />
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke={simData.value[simData.value.length - 1] > simData.value[0] ? '#10b981' : '#ef4444'}
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    {/* FFT Volatility Spectrum */}
                    {simData.fft_spectrum && (
                      <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4">
                        <h3 className="text-sm font-semibold mb-3 text-violet-300 flex items-center gap-2">
                          <span>📡</span>
                          FFT Volatility Spectrum (Top 5 Frequencies)
                        </h3>
                        <div className="space-y-2">
                          {simData.fft_spectrum.frequencies.map((freq: number, i: number) => (
                            <div key={i} className="flex items-center gap-3">
                              <div className="text-xs text-slate-400 w-20">
                                Freq {i + 1}:
                              </div>
                              <div className="flex-1 bg-white/5 rounded-full h-6 overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-violet-500 to-purple-600 flex items-center justify-end pr-2"
                                  style={{ width: `${(simData.fft_spectrum.magnitudes[i] / Math.max(...simData.fft_spectrum.magnitudes)) * 100}%` }}
                                >
                                  <span className="text-xs font-mono text-white">{simData.fft_spectrum.magnitudes[i].toFixed(4)}</span>
                                </div>
                              </div>
                              <div className="text-xs text-slate-400 w-24 text-right">
                                {freq.toFixed(6)} Hz
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="text-slate-400">Mean Return:</span>
                            <span className="ml-2 font-mono text-emerald-300">{(simData.fft_spectrum.mean * 100).toFixed(4)}%</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Std Dev:</span>
                            <span className="ml-2 font-mono text-amber-300">{(simData.fft_spectrum.std * 100).toFixed(4)}%</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Summary Stats */}
                    <div className="flex items-center justify-between text-sm">
                      <p className="text-slate-300">
                        {simData.value[simData.value.length - 1] > simData.value[0]
                          ? '🟩 Portfolio gained value — positive trend'
                          : '🟥 Portfolio lost value — negative trend'}
                      </p>
                      <p className="text-xs text-slate-400">
                        Tickers: {simData.tickers.join(', ')}
                      </p>
                    </div>
                    {simData.timestamp && (
                      <p className="text-xs text-slate-500 text-right">
                        Updated: {new Date(simData.timestamp).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                )}
              </section>
            </div>
          )}

          {/* Quantum State Visualization Tab */}
          {activeTab === 'quantumState' && quantumState && quantumState.qubits && (
            <section className="space-y-6">
              <div className="rounded-2xl p-6 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 shadow-lg shadow-purple-900/30 text-center">
                <h3 className="text-2xl font-bold mb-2">⚛️ Quantum State Visualization</h3>
                <p className="text-white/80">Bloch sphere representation of quantum qubits</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <div className="flex items-start gap-3 mb-4">
                  <div className="text-3xl">⚛️</div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold mb-2">Quantum Superposition States</h2>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      Visualize quantum superposition states using <strong>Bloch spheres</strong>. 
                      Each sphere represents a qubit (quantum bit) in the portfolio optimization algorithm.
                    </p>
                  </div>
                </div>

                <BlochViewer qubits={quantumState.qubits} />
                
                {/* Detailed explanation */}
                <div className="mt-4 space-y-3">
                  <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                    <h3 className="text-sm font-semibold text-violet-300 mb-2 flex items-center gap-2">
                      <span>🎯</span> Understanding the Visualization
                    </h3>
                    <div className="text-xs text-slate-300 space-y-2">
                      <p>
                        <strong className="text-blue-400">Blue (North):</strong> State |0⟩ — Asset <em>excluded</em> from portfolio
                      </p>
                      <p>
                        <strong className="text-orange-400">Orange (South):</strong> State |1⟩ — Asset <em>included</em> in portfolio
                      </p>
                      <p>
                        <strong className="text-purple-400">Purple (Equator):</strong> Superposition — Asset is simultaneously included AND excluded until measurement
                      </p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-emerald-900/30 to-teal-900/30 rounded-lg p-4 border border-emerald-700/50">
                    <h3 className="text-sm font-semibold text-emerald-300 mb-2 flex items-center gap-2">
                      <span>💰</span> Finance Application: QAOA Portfolio Optimization
                    </h3>
                    <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
                      <p>
                        <strong>The Challenge:</strong> Classical computers must evaluate portfolios one at a time. 
                        For 20 assets, that's over 1 million combinations (2²⁰).
                      </p>
                      <p>
                        <strong>Quantum Advantage:</strong> QAOA uses <em>superposition</em> to explore multiple portfolios simultaneously. 
                        Each qubit represents whether to include/exclude an asset. The quantum circuit evolves these qubits 
                        to constructively interfere toward optimal portfolios while canceling out poor ones.
                      </p>
                      <p>
                        <strong>The Process:</strong>
                      </p>
                      <ol className="list-decimal list-inside space-y-1 ml-2">
                        <li>Initialize qubits in superposition (all portfolios at once)</li>
                        <li>Apply problem-specific gates encoding risk/return trade-offs</li>
                        <li>Apply mixing gates to explore nearby solutions</li>
                        <li>Measure qubits → collapse to a specific portfolio selection</li>
                        <li>Classical optimizer adjusts quantum parameters and repeats</li>
                      </ol>
                      <p className="pt-1 border-t border-emerald-700/30">
                        <strong>Why It Matters:</strong> Quantum algorithms can potentially find better portfolios faster, 
                        especially for large-scale problems with complex constraints (100+ assets, sector limits, ESG requirements).
                      </p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-amber-900/20 to-orange-900/20 rounded-lg p-4 border border-amber-700/50">
                    <h3 className="text-sm font-semibold text-amber-300 mb-2 flex items-center gap-2">
                      <span>🔬</span> Technical Details
                    </h3>
                    <div className="text-xs text-slate-300 space-y-1">
                      <p><strong>Algorithm:</strong> Quantum Approximate Optimization Algorithm (QAOA)</p>
                      <p><strong>Problem Type:</strong> QUBO (Quadratic Unconstrained Binary Optimization)</p>
                      <p><strong>Objective:</strong> Minimize <code className="px-1 py-0.5 bg-slate-700 rounded">risk - λ × return</code></p>
                      <p><strong>Qubits:</strong> {quantumState.qubits.length} (one per asset in simplified demo)</p>
                      <p><strong>State Space:</strong> 2<sup>{quantumState.qubits.length}</sup> = {Math.pow(2, quantumState.qubits.length)} possible portfolios</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Signals */}
          {activeTab === 'signals' && fftStats?.stats && (
            <section className="space-y-6">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="rounded-2xl p-5 bg-gradient-to-br from-sky-600 to-sky-500 shadow-lg shadow-sky-900/30">
                  <div className="text-3xl font-bold">{fftStats.stats.n}</div>
                  <div className="text-sky-100/80">Data Points</div>
                </div>
                <div className="rounded-2xl p-5 bg-gradient-to-br from-emerald-600 to-emerald-500 shadow-lg shadow-emerald-900/30">
                  <div className="text-3xl font-bold">{fftStats.stats.total_energy.toFixed(3)}</div>
                  <div className="text-emerald-100/80">Market Energy</div>
                </div>
                <div className="rounded-2xl p-5 bg-gradient-to-br from-violet-600 to-violet-500 shadow-lg shadow-violet-900/30">
                  <div className="text-3xl font-bold">{fftStats.stats.band_energy.high > 0.05 ? 'High' : 'Low'}</div>
                  <div className="text-violet-100/80">Volatility Signal</div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <h3 className="text-lg font-semibold mb-4">Market Frequency Analysis</h3>
                {[
                  { label: 'Long‑term Trends', value: fftStats.stats.band_energy.low, color: 'bg-sky-500' },
                  { label: 'Medium‑term Cycles', value: fftStats.stats.band_energy.mid, color: 'bg-emerald-500' },
                  { label: 'Short‑term Noise', value: fftStats.stats.band_energy.high, color: 'bg-rose-500' },
                ].map((row) => (
                  <div key={row.label} className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-300">{row.label}</span>
                      <span className="font-semibold">{row.value.toFixed(4)}</span>
                    </div>
                    <div className="h-2 rounded bg-white/10 overflow-hidden">
                      <div className={`h-full ${row.color}`} style={{ width: `${Math.min(100, row.value * 100)}%` }} />
                    </div>
                  </div>
                ))}
                <div className="mt-4 rounded-xl bg-sky-500/10 border border-sky-500/20 p-4 text-sky-200">
                  <b>Insight:</b> Higher bars indicate stronger market patterns. Long‑term trends capture direction; short‑term bars reflect daily noise.
                </div>
              </div>
            </section>
          )}

          {/* Classical */}
          {activeTab === 'classical' && classical?.weights && (
            <section className="space-y-6">
              <div className={`rounded-2xl p-6 ${perf(classical.objective).bg} text-slate-900`}>
                <div className="flex items-center justify-between">
                  <span className={`text-lg font-semibold inline-flex items-center px-2.5 py-1 rounded-full ${perf(classical.objective).pill}`}>{perf(classical.objective).label}</span>
                  <span className="text-3xl font-bold text-slate-800">{(classical.objective * 100).toFixed(2)}%</span>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <h3 className="text-lg font-semibold mb-4">Investment Breakdown</h3>
                <div className="space-y-3">
                  {['Tech Stocks', 'Blue Chips', 'Growth Stocks', 'Bonds'].map((asset, i) => (
                    <div key={asset} className="flex items-center justify-between rounded-lg bg-white/[0.03] p-3">
                      <div className="flex items-center gap-3">
                        <span className="inline-block h-3 w-3 rounded" style={{ backgroundColor: colors[i] }} />
                        <span className="font-medium">{asset}</span>
                      </div>
                      <div className="w-1/2">
                        <div className="h-2 rounded bg-white/10 overflow-hidden">
                          <div className="h-full bg-white/70" style={{ width: `${classical.weights[i] * 100}%` }} />
                        </div>
                      </div>
                      <span className="font-semibold">{(classical.weights[i] * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-xl bg-indigo-500/10 border border-indigo-500/20 p-5">
                  <h4 className="font-semibold text-indigo-200 mb-3 flex items-center gap-2">
                    <span className="text-xl">🎯</span> Recommended Companies to Buy
                  </h4>
                  <div className="space-y-4">
                    {['Tech Stocks', 'Blue Chips', 'Growth Stocks', 'Bonds'].map((asset, i) => {
                      const weight = classical.weights[i];
                      if (weight < 0.05) return null; // Skip assets with less than 5% allocation
                      return (
                        <div key={asset} className="rounded-lg bg-white/5 border border-white/10 p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-white">{asset}</span>
                            <span className="text-sm px-2 py-1 rounded-full bg-indigo-500/20 text-indigo-200">
                              {(weight * 100).toFixed(1)}% allocation
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {stockRecommendations[asset as keyof typeof stockRecommendations].slice(0, 3).map((stock) => (
                              <span key={stock} className="text-xs px-3 py-1.5 rounded-full bg-white/10 text-slate-200 border border-white/20">
                                {stock}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-5 rounded-xl bg-white/5 border border-white/10 p-4">
                  <b>💰 Advice:</b>
                  <p className="text-slate-300 mt-1">
                    {classical.objective < 0 ? 'Conservative approach recommended. Prioritize stability to minimize risk.' : 'Aggressive growth posture suitable; expect higher variance with potential upside.'}
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Quantum */}
          {activeTab === 'quantum' && quantum?.selection_bits && (
            <section className="space-y-6">
              <div className={`rounded-2xl p-6 ${perf(quantum.objective).bg} text-slate-900`}>
                <div className="flex items-center justify-between">
                  <span className={`text-lg font-semibold inline-flex items-center px-2.5 py-1 rounded-full ${perf(quantum.objective).pill}`}>{perf(quantum.objective).label}</span>
                  <span className="text-3xl font-bold text-slate-800">{(quantum.objective * 100).toFixed(2)}%</span>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {['Tech Stocks', 'Blue Chips', 'Growth Stocks', 'Bonds'].map((asset, i) => (
                  <div key={asset} className={`rounded-2xl border p-5 text-center transition ${quantum.selection_bits[i] ? 'border-emerald-400/40 bg-emerald-400/10' : 'border-white/10 bg-white/5'}`}>
                    <div className="text-3xl mb-2">{quantum.selection_bits[i] ? '✅' : '❌'}</div>
                    <div className="font-semibold mb-1">{asset}</div>
                    <span className={`text-xs px-2 py-1 rounded-full ${quantum.selection_bits[i] ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/10 text-slate-300'}`}>{quantum.selection_bits[i] ? 'BUY' : 'SKIP'}</span>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-violet-400/20 bg-violet-500/10 p-6">
                <h3 className="font-semibold text-violet-200 mb-2">🔬 Quantum AI Insight</h3>
                <p className="text-violet-100">
                  {quantum.selection_bits.filter(Boolean).length === 1
                    ? 'Focus capital on a single high‑confidence asset for efficiency.'
                    : quantum.selection_bits.filter(Boolean).length === 0
                    ? 'Signal weak. Consider staying in cash or waiting for clarity.'
                    : 'Balanced multi‑asset combination identified for risk‑adjusted growth.'}
                </p>
              </div>

              <div className="rounded-xl bg-violet-500/10 border border-violet-500/20 p-5">
                <h4 className="font-semibold text-violet-200 mb-3 flex items-center gap-2">
                  <span className="text-xl">🎯</span> Quantum-Selected Companies
                </h4>
                <div className="space-y-4">
                  {['Tech Stocks', 'Blue Chips', 'Growth Stocks', 'Bonds'].map((asset, i) => {
                    if (!quantum.selection_bits[i]) return null; // Only show selected assets
                    return (
                      <div key={asset} className="rounded-lg bg-white/5 border border-emerald-400/30 p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-white flex items-center gap-2">
                            <span className="text-emerald-400">●</span>
                            {asset}
                          </span>
                          <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-200 font-medium">
                            RECOMMENDED
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {stockRecommendations[asset as keyof typeof stockRecommendations].slice(0, 3).map((stock) => (
                            <span key={stock} className="text-xs px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-100 border border-emerald-400/30 font-medium">
                              {stock}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  {quantum.selection_bits.filter(Boolean).length === 0 && (
                    <div className="text-center py-4 text-slate-400">
                      <p>No assets selected by quantum optimization.</p>
                      <p className="text-sm mt-1">Consider waiting for better market conditions.</p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Comparison */}
          {activeTab === 'comparison' && classical?.objective && quantum?.objective && (
            <section className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-2xl p-6 text-center bg-gradient-to-br from-indigo-600 to-indigo-500 shadow-indigo-900/30 shadow">
                  <h3 className="text-lg font-semibold mb-2">🏛️ Traditional Strategy</h3>
                  <div className="text-5xl font-extrabold">{(classical.objective * 100).toFixed(2)}%</div>
                  <p className="text-indigo-100/80">Expected Annual Return</p>
                </div>
                <div className="rounded-2xl p-6 text-center bg-gradient-to-br from-violet-600 to-violet-500 shadow-violet-900/30 shadow">
                  <h3 className="text-lg font-semibold mb-2">⚛️ Quantum Strategy</h3>
                  <div className="text-5xl font-extrabold">{(quantum.objective * 100).toFixed(2)}%</div>
                  <p className="text-violet-100/80">Expected Annual Return</p>
                </div>
              </div>

              <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-6">
                <h3 className="font-semibold text-amber-200 mb-2">📊 Analysis Result</h3>
                <p className="text-amber-100">
                  {Math.abs(classical.objective - quantum.objective) < 0.001
                    ? 'Both strategies perform similarly — consider a diversified blend.'
                    : classical.objective < quantum.objective
                    ? 'Quantum shows superior potential; AI identified stronger patterns.'
                    : 'Traditional appears safer given current conditions.'}
                </p>
              </div>
            </section>
          )}

          {/* Portfolio Galaxy Tab */}
          {activeTab === 'galaxy' && simData && simData.assets && (
            <section className="space-y-6">
              <div className="rounded-2xl p-6 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 shadow-lg shadow-purple-900/30 text-center">
                <h3 className="text-2xl font-bold mb-2">🌌 Portfolio Galaxy</h3>
                <p className="text-white/80">Your portfolio visualized as a solar system</p>
              </div>

              <div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-indigo-700/30 rounded-xl p-6">
                <div className="flex items-start gap-3 mb-4">
                  <div className="text-4xl">🌌</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-indigo-300 mb-2">Interactive 3D Visualization</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      Each asset orbits the central sun. <strong className="text-indigo-300">Click planets</strong> to explore details.
                      Watch how <strong className="text-purple-300">volatility affects orbit speed</strong> and 
                      <strong className="text-pink-300"> correlation determines distance</strong> from the center.
                    </p>
                  </div>
                </div>
                
                <PortfolioGalaxy 
                  assets={simData.assets}
                  onAssetClick={(asset) => {
                    console.log('Selected asset:', asset);
                  }}
                />
                
                <div className="mt-6 bg-indigo-950/50 rounded-lg p-4 border border-indigo-800/30">
                  <h4 className="text-sm font-semibold text-indigo-300 mb-3">🎓 Understanding the Galaxy</h4>
                  <div className="grid md:grid-cols-2 gap-4 text-xs text-slate-300">
                    <div className="bg-white/5 rounded p-3">
                      <strong className="text-yellow-400">☀️ Central Sun:</strong>
                      <p className="text-slate-400 mt-1">Represents your portfolio's center. All assets orbit around this balanced point.</p>
                    </div>
                    <div className="bg-white/5 rounded p-3">
                      <strong className="text-blue-400">🌍 Planet Size:</strong>
                      <p className="text-slate-400 mt-1">Bigger planets = larger allocation %. Your biggest holdings are most visible.</p>
                    </div>
                    <div className="bg-white/5 rounded p-3">
                      <strong className="text-purple-400">💨 Orbit Speed:</strong>
                      <p className="text-slate-400 mt-1">Fast orbits = high volatility. Watch volatile assets zoom around!</p>
                    </div>
                    <div className="bg-white/5 rounded p-3">
                      <strong className="text-pink-400">📍 Distance from Sun:</strong>
                      <p className="text-slate-400 mt-1">Far planets = low market correlation. These provide diversification benefits.</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-indigo-800/30 text-xs text-slate-400">
                    <strong className="text-indigo-300">💡 Investment Insight:</strong> Ideally, you want planets at different distances (diversification) with varied orbit speeds (mixed volatility). If all planets are close together and moving at the same speed, your portfolio is concentrated!
                  </div>
                </div>

                {/* Asset Breakdown Table */}
                <div className="mt-6 bg-slate-900/50 rounded-lg p-4 border border-slate-800">
                  <h4 className="text-sm font-semibold text-slate-300 mb-3">📊 Asset Metrics</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="border-b border-slate-700">
                        <tr className="text-slate-400">
                          <th className="text-left py-2 px-2">Ticker</th>
                          <th className="text-right py-2 px-2">Weight</th>
                          <th className="text-right py-2 px-2">Return</th>
                          <th className="text-right py-2 px-2">Volatility</th>
                          <th className="text-right py-2 px-2">Correlation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {simData.assets.map((asset: any) => (
                          <tr key={asset.ticker} className="hover:bg-white/5">
                            <td className="py-2 px-2 font-mono text-white">{asset.ticker}</td>
                            <td className="text-right py-2 px-2 font-mono text-emerald-300">{(asset.weight * 100).toFixed(1)}%</td>
                            <td className={`text-right py-2 px-2 font-mono ${asset.return >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                              {(asset.return * 100).toFixed(2)}%
                            </td>
                            <td className="text-right py-2 px-2 font-mono text-amber-300">{(asset.volatility * 100).toFixed(2)}%</td>
                            <td className="text-right py-2 px-2 font-mono text-blue-300">{asset.correlation.toFixed(3)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Stock Analysis */}
          {activeTab === 'stock' && rfResult && (
            <section className="space-y-6">
              <div className="rounded-2xl p-6 bg-gradient-to-br from-pink-600 to-pink-500 shadow-lg shadow-pink-900/30 text-center">
                <h3 className="text-lg font-semibold mb-2">📈 Predicted Daily Return</h3>
                <div className="text-5xl font-extrabold">{(rfResult.predicted_return * 100).toFixed(3)}%</div>
                <p className="text-pink-100/80 mt-2">{rfResult.ticker || stockTicker}</p>
              </div>

              {rfResult.statistics && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
                    <div className="text-2xl font-bold text-sky-300">${rfResult.statistics.latest_price?.toFixed(2)}</div>
                    <div className="text-sm text-slate-400 mt-1">Latest Price</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
                    <div className="text-2xl font-bold text-emerald-300">{(rfResult.statistics.total_return * 100)?.toFixed(2)}%</div>
                    <div className="text-sm text-slate-400 mt-1">Total Return</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
                    <div className="text-2xl font-bold text-violet-300">{(rfResult.statistics.avg_daily_return * 100)?.toFixed(3)}%</div>
                    <div className="text-sm text-slate-400 mt-1">Avg Daily Return</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
                    <div className="text-2xl font-bold text-amber-300">{rfResult.statistics.avg_volatility?.toFixed(3)}%</div>
                    <div className="text-sm text-slate-400 mt-1">Avg Volatility</div>
                  </div>
                </div>
              )}

              <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <h3 className="text-lg font-semibold mb-4">📊 Price & Volume Analysis</h3>
                {rfResult.plot_path && (
                  <div className="rounded-xl overflow-hidden border border-white/10">
                    <img src={`${API}${rfResult.plot_path}`} alt="Stock Analysis Plot" className="w-full" />
                  </div>
                )}
              </div>

              {rfResult.model_info && (
                <div className="rounded-2xl border border-pink-400/20 bg-pink-500/10 p-6">
                  <h3 className="font-semibold text-pink-200 mb-3">🔬 Model Parameters</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-300">Volume (millions):</span>
                      <span className="font-semibold">{rfResult.model_info.coefficients?.volume_millions?.toFixed(6)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-300">Price Change %:</span>
                      <span className="font-semibold">{rfResult.model_info.coefficients?.price_change_pct?.toFixed(6)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-300">Volatility:</span>
                      <span className="font-semibold">{rfResult.model_info.coefficients?.volatility?.toFixed(6)}</span>
                    </div>
                    <div className="flex justify-between text-sm border-t border-white/10 pt-2">
                      <span className="text-slate-300">Model Intercept:</span>
                      <span className="font-semibold">{rfResult.model_info.intercept?.toFixed(6)}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                <b>💡 Insight:</b>
                <p className="text-slate-300 mt-1">
                  The model uses linear regression to predict daily returns based on real-time market data from yfinance. 
                  Features include trading volume (millions), intraday price change percentage, and 5-day rolling volatility. 
                  Data spans {rfResult.statistics?.data_points || '~20'} trading days.
                </p>
              </div>
            </section>
          )}
        </main>
      </div>

      {/* AI Finance Bot */}
      <FinanceBot />
    </div>
  );
}