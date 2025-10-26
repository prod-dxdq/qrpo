import { useEffect, useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { MdClose, MdExpandMore, MdExpandLess } from 'react-icons/md';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function Home() {
  const [health, setHealth] = useState<string>('checking...');
  const [fftStats, setFftStats] = useState<any>(null);
  const [classical, setClassical] = useState<any>(null);
  const [quantum, setQuantum] = useState<any>(null);
  const [loading, setLoading] = useState<string>('');
  
  // Tab management state
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>('');
  const [expandedSections, setExpandedSections] = useState<string[]>(['signals', 'strategies']);

  // PowerBI color scheme
  const powerBIColors = ['#118DFF', '#12239E', '#E66C37', '#6B007B', '#E044A7', '#744EC2', '#D9B300', '#D64550'];

  // Helper function to format money
  const formatMoney = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  // Helper function to get performance status
  const getPerformanceStatus = (objective: number) => {
    if (objective > 0) return { text: "📈 Potential Profit!", color: "text-green-600", bg: "bg-green-50" };
    if (objective < -0.01) return { text: "📉 High Risk", color: "text-red-600", bg: "bg-red-50" };
    return { text: "⚖️ Balanced", color: "text-yellow-600", bg: "bg-yellow-50" };
  };

  // Tab management functions
  const openTab = (tabId: string, tabName: string) => {
    if (!openTabs.includes(tabId)) {
      setOpenTabs([...openTabs, tabId]);
    }
    setActiveTab(tabId);
  };

  const closeTab = (tabId: string) => {
    const newTabs = openTabs.filter(tab => tab !== tabId);
    setOpenTabs(newTabs);
    if (activeTab === tabId) {
      setActiveTab(newTabs.length > 0 ? newTabs[newTabs.length - 1] : '');
    }
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  useEffect(() => {
    fetch(`${API}/health`)
      .then(r => {
        if (!r.ok) {
          throw new Error(`HTTP error! status: ${r.status}`);
        }
        return r.json();
      })
      .then(j => setHealth(j.status))
      .catch((error) => {
        console.error('Health check failed:', error);
        setHealth('error');
      });
  }, []);

  const runFFT = async () => {
    try {
      setLoading('fft');
      const n = 256;
      const series = Array.from({length: n}, (_, i) => {
        const t = i / n;
        return Math.sin(2 * Math.PI * 4 * t) + 0.3 * Math.sin(2 * Math.PI * 15 * t) + (Math.random()-0.5)*0.1;
      });
      const res = await fetch(`${API}/features/fft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ series })
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      setFftStats(await res.json());
    } catch (error) {
      console.error('FFT Error:', error);
      setFftStats({ error: error.message });
    } finally {
      setLoading('');
    }
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
      const res = await fetch(`${API}/optimize/classical`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mu, cov, lam })
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      setClassical(await res.json());
    } catch (error) {
      console.error('Classical optimization error:', error);
      setClassical({ error: error.message });
    } finally {
      setLoading('');
    }
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
      const res = await fetch(`${API}/optimize/quantum`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mu, cov, lam, reps: 1 })
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      setQuantum(await res.json());
    } catch (error) {
      console.error('Quantum optimization error:', error);
      setQuantum({ error: error.message });
    } finally {
      setLoading('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* PowerBI-style Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">Smart Investment Dashboard</h1>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              health === 'ok' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {health === 'ok' ? '● Connected' : '● Offline'}
            </span>
          </div>
          
          {/* Tab Bar */}
          <div className="flex items-center space-x-1">
            {openTabs.map(tabId => {
              const tabNames = {
                'signals': 'Market Signals',
                'classical': 'Traditional Portfolio',
                'quantum': 'Quantum Strategy',
                'comparison': 'Strategy Comparison'
              };
              return (
                <div 
                  key={tabId}
                  className={`flex items-center px-4 py-2 rounded-t-lg border-b-2 cursor-pointer ${
                    activeTab === tabId 
                      ? 'bg-blue-50 border-blue-500 text-blue-700' 
                      : 'bg-gray-100 border-transparent text-gray-600 hover:bg-gray-200'
                  }`}
                  onClick={() => setActiveTab(tabId)}
                >
                  <span className="text-sm font-medium">{tabNames[tabId as keyof typeof tabNames]}</span>
                  <MdClose 
                    className="ml-2 w-4 h-4 hover:bg-gray-300 rounded"
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(tabId);
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex h-screen">
        {/* PowerBI-style Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Analytics Menu</h2>
            
            {/* Market Signals Section */}
            <div className="mb-4">
              <div 
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                onClick={() => toggleSection('signals')}
              >
                <span className="font-medium text-gray-700">📊 Market Analysis</span>
                {expandedSections.includes('signals') ? <MdExpandLess /> : <MdExpandMore />}
              </div>
              
              {expandedSections.includes('signals') && (
                <div className="mt-2 ml-4 space-y-2">
                  <button 
                    className="w-full text-left p-2 text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-700 rounded"
                    onClick={() => {
                      runFFT();
                      openTab('signals', 'Market Signals');
                    }}
                    disabled={loading === 'fft'}
                  >
                    {loading === 'fft' ? '🔄 Analyzing...' : '🔍 Run Signal Analysis'}
                  </button>
                </div>
              )}
            </div>

            {/* Investment Strategies Section */}
            <div className="mb-4">
              <div 
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                onClick={() => toggleSection('strategies')}
              >
                <span className="font-medium text-gray-700">💼 Investment Strategies</span>
                {expandedSections.includes('strategies') ? <MdExpandLess /> : <MdExpandMore />}
              </div>
              
              {expandedSections.includes('strategies') && (
                <div className="mt-2 ml-4 space-y-2">
                  <button 
                    className="w-full text-left p-2 text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-700 rounded"
                    onClick={() => {
                      runClassical();
                      openTab('classical', 'Traditional Portfolio');
                    }}
                    disabled={loading === 'classical'}
                  >
                    {loading === 'classical' ? '⏳ Computing...' : '🏛️ Traditional Strategy'}
                  </button>
                  
                  <button 
                    className="w-full text-left p-2 text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-700 rounded"
                    onClick={() => {
                      runQuantum();
                      openTab('quantum', 'Quantum Strategy');
                    }}
                    disabled={loading === 'quantum'}
                  >
                    {loading === 'quantum' ? '🔬 Processing...' : '⚛️ Quantum Strategy'}
                  </button>
                  
                  {classical && quantum && (
                    <button 
                      className="w-full text-left p-2 text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-700 rounded"
                      onClick={() => openTab('comparison', 'Strategy Comparison')}
                    >
                      🏆 Compare Strategies
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === '' && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Welcome to Your Investment Dashboard</h3>
                <p className="text-gray-500 mb-6">Select an analysis from the menu to get started</p>
                <div className="space-y-2">
                  <div className="text-sm text-gray-400">• Analyze market signals and trends</div>
                  <div className="text-sm text-gray-400">• Compare traditional vs quantum strategies</div>
                  <div className="text-sm text-gray-400">• Get AI-powered investment recommendations</div>
                </div>
              </div>
            </div>
          )}

        {/* Market Signal Analysis */}
        <section className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center mb-4">
            <span className="text-2xl mr-3">📊</span>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Market Signal Analysis</h2>
              <p className="text-gray-600">Analyze market patterns and trends using advanced signal processing</p>
            </div>
          </div>
          
          <button 
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              loading === 'fft' 
                ? 'bg-blue-300 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
            onClick={runFFT}
            disabled={loading === 'fft'}
          >
            {loading === 'fft' ? '🔄 Analyzing...' : '🔍 Analyze Market Signals'}
          </button>

          {fftStats?.stats && (
            <div className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">{fftStats.stats.n}</div>
                  <div className="text-sm text-blue-800">Data Points Analyzed</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">{fftStats.stats.total_energy.toFixed(3)}</div>
                  <div className="text-sm text-green-800">Market Energy Level</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {(fftStats.stats.band_energy.high > 0.05 ? 'High' : 'Low')}
                  </div>
                  <div className="text-sm text-purple-800">Volatility Signal</div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">📈 Market Frequency Analysis</h3>
                <div className="h-64">
                  <Bar 
                    data={{
                      labels: ['Low Frequency\n(Long-term trends)', 'Mid Frequency\n(Medium-term cycles)', 'High Frequency\n(Short-term noise)'],
                      datasets: [{
                        label: 'Signal Strength',
                        data: [
                          fftStats.stats.band_energy.low,
                          fftStats.stats.band_energy.mid,
                          fftStats.stats.band_energy.high
                        ],
                        backgroundColor: ['#3B82F6', '#10B981', '#F59E0B'],
                        borderRadius: 8,
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          callbacks: {
                            label: (context) => {
                              const value = context.parsed.y.toFixed(4);
                              const interpretations = [
                                `Strong long-term trend (${value})`,
                                `Moderate cyclical pattern (${value})`,
                                `High market noise (${value})`
                              ];
                              return interpretations[context.dataIndex];
                            }
                          }
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          title: { display: true, text: 'Signal Strength' }
                        }
                      }
                    }}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  💡 <strong>What this means:</strong> Higher bars indicate stronger patterns. 
                  Low frequency = long-term trends, High frequency = short-term volatility.
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Investment Strategies Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Classical Strategy */}
          <section className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <span className="text-2xl mr-3">🏛️</span>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Traditional Strategy</h2>
                <p className="text-gray-600 text-sm">Time-tested portfolio optimization</p>
              </div>
            </div>
            
            <button 
              className={`w-full px-4 py-3 rounded-lg font-semibold transition-all mb-4 ${
                loading === 'classical' 
                  ? 'bg-indigo-300 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
              onClick={runClassical}
              disabled={loading === 'classical'}
            >
              {loading === 'classical' ? '⏳ Calculating...' : '📊 Run Traditional Analysis'}
            </button>

            {classical?.weights && (
              <div className="space-y-4">
                <div className={`p-4 rounded-lg ${getPerformanceStatus(classical.objective).bg}`}>
                  <div className="flex justify-between items-center">
                    <span className={`font-semibold ${getPerformanceStatus(classical.objective).color}`}>
                      {getPerformanceStatus(classical.objective).text}
                    </span>
                    <span className="font-bold text-lg">
                      Score: {(classical.objective * 100).toFixed(2)}%
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">💼 Recommended Portfolio Mix</h3>
                  <div className="h-48">
                    <Doughnut 
                      data={{
                        labels: ['Tech Stocks', 'Blue Chips', 'Growth Stocks', 'Bonds'],
                        datasets: [{
                          data: classical.weights,
                          backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'],
                          borderWidth: 0,
                        }]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          tooltip: {
                            callbacks: {
                              label: (context) => {
                                const percentage = (context.parsed * 100).toFixed(1);
                                return `${context.label}: ${percentage}%`;
                              }
                            }
                          }
                        }
                      }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
                    {['Tech Stocks', 'Blue Chips', 'Growth Stocks', 'Bonds'].map((asset, idx) => (
                      <div key={asset} className="flex justify-between">
                        <span>{asset}:</span>
                        <span className="font-semibold">{(classical.weights[idx] * 100).toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="bg-gray-50 p-3 rounded text-sm">
                  <strong>💡 Strategy:</strong> Balanced approach focusing on risk-adjusted returns. 
                  {classical.objective < 0 ? ' Conservative allocation to minimize losses.' : ' Aggressive allocation for growth.'}
                </div>
              </div>
            )}
          </section>

          {/* Quantum Strategy */}
          <section className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <span className="text-2xl mr-3">⚛️</span>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Quantum Strategy</h2>
                <p className="text-gray-600 text-sm">Next-generation AI optimization</p>
              </div>
            </div>
            
            <button 
              className={`w-full px-4 py-3 rounded-lg font-semibold transition-all mb-4 ${
                loading === 'quantum' 
                  ? 'bg-purple-300 cursor-not-allowed' 
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
              onClick={runQuantum}
              disabled={loading === 'quantum'}
            >
              {loading === 'quantum' ? '🔬 Computing...' : '⚛️ Run Quantum Analysis'}
            </button>

            {quantum?.selection_bits && (
              <div className="space-y-4">
                <div className={`p-4 rounded-lg ${getPerformanceStatus(quantum.objective).bg}`}>
                  <div className="flex justify-between items-center">
                    <span className={`font-semibold ${getPerformanceStatus(quantum.objective).color}`}>
                      {getPerformanceStatus(quantum.objective).text}
                    </span>
                    <span className="font-bold text-lg">
                      Score: {(quantum.objective * 100).toFixed(2)}%
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">🎯 Quantum Recommendations</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {['Tech Stocks', 'Blue Chips', 'Growth Stocks', 'Bonds'].map((asset, idx) => (
                      <div key={asset} className={`p-3 rounded-lg border-2 transition-all ${
                        quantum.selection_bits[idx] 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-gray-200 bg-gray-50'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{asset}</span>
                          <span className="text-2xl">
                            {quantum.selection_bits[idx] ? '✅' : '❌'}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {quantum.selection_bits[idx] ? 'Recommended' : 'Skip'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded text-sm">
                  <strong>🔬 Quantum Insight:</strong> 
                  {quantum.selection_bits.filter(Boolean).length === 1 
                    ? ' Focused strategy - concentrate on the best performing asset.'
                    : quantum.selection_bits.filter(Boolean).length === 0
                    ? ' Market conditions suggest holding cash or waiting.'
                    : ' Diversified quantum-optimized selection for maximum efficiency.'}
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Comparison */}
        {classical?.objective && quantum?.objective && (
          <section className="bg-white rounded-xl shadow-lg p-6 mt-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">🏆 Strategy Comparison</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-center p-4 bg-indigo-50 rounded-lg">
                <h3 className="font-semibold text-indigo-800">Traditional Strategy</h3>
                <div className="text-2xl font-bold text-indigo-600 mt-2">
                  {(classical.objective * 100).toFixed(2)}%
                </div>
                <p className="text-sm text-indigo-700 mt-1">Expected Performance</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <h3 className="font-semibold text-purple-800">Quantum Strategy</h3>
                <div className="text-2xl font-bold text-purple-600 mt-2">
                  {(quantum.objective * 100).toFixed(2)}%
                </div>
                <p className="text-sm text-purple-700 mt-1">Expected Performance</p>
              </div>
            </div>
            <div className="mt-4 text-center">
              {Math.abs(classical.objective - quantum.objective) < 0.001 
                ? '🤝 Both strategies show similar performance'
                : classical.objective < quantum.objective
                ? '⚛️ Quantum strategy shows better potential'
                : '🏛️ Traditional strategy appears more favorable'
              }
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
