import { useEffect, useState } from 'react';

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
  const [loading, setLoading] = useState<string>('');

  // Tabs and sidebar state
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ signals: true, strategies: true });

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-slate-900/60 bg-slate-900/80 border-b border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-400 via-indigo-500 to-violet-600 shadow-lg shadow-violet-500/30" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Smart Investment Dashboard</h1>
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
              const label: Record<string, string> = { signals: 'Market Signals', classical: 'Traditional', quantum: 'Quantum', comparison: 'Comparison' };
              const active = activeTab === id;
              return (
                <button key={id} onClick={() => setActiveTab(id)} className={`group inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all ${active ? 'bg-sky-500/20 text-sky-200 border border-sky-500/30 shadow-sm' : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'}`}>
                  {label[id]}
                  <span onClick={(e) => { e.stopPropagation(); closeTab(id); }} className="ml-2 rounded p-0.5 text-slate-400 hover:text-white hover:bg-white/10">✕</span>
                </button>
              );
            })}
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
        </aside>

        {/* Main Content */}
        <main>
          {/* Empty state */}
          {activeTab === '' && (
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.03] p-8 text-center">
              <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-sky-500/20 blur-3xl" />
              <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl" />
              <div className="relative">
                <div className="text-6xl mb-3">📊</div>
                <h3 className="text-xl font-semibold mb-2">Welcome to your investment cockpit</h3>
                <p className="text-slate-300">Choose an analysis from the left to get started.</p>
              </div>
            </div>
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
        </main>
      </div>
    </div>
  );
}