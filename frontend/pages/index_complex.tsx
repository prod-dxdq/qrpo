import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { MdClose, MdExpandMore, MdExpandLess } from 'react-icons/md';

// Dynamic imports to avoid SSR issues with Recharts
const BarChart = dynamic(() => import('recharts').then(mod => ({ default: mod.BarChart })), { ssr: false });
const Bar = dynamic(() => import('recharts').then(mod => ({ default: mod.Bar })), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(mod => ({ default: mod.XAxis })), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(mod => ({ default: mod.YAxis })), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then(mod => ({ default: mod.CartesianGrid })), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(mod => ({ default: mod.Tooltip })), { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => ({ default: mod.ResponsiveContainer })), { ssr: false });
const PieChart = dynamic(() => import('recharts').then(mod => ({ default: mod.PieChart })), { ssr: false });
const Pie = dynamic(() => import('recharts').then(mod => ({ default: mod.Pie })), { ssr: false });
const Cell = dynamic(() => import('recharts').then(mod => ({ default: mod.Cell })), { ssr: false });

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

  // Debug log to check if component is mounting
  console.log('Component is rendering, health status:', health);

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

  // Simple error check
  if (typeof window === 'undefined') {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Debug info */}
      <div className="p-4 bg-yellow-100 text-black">
        <p>Debug: Component loaded, Health: {health}</p>
      </div>
      
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
          {/* Welcome Screen */}
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

          {/* Market Signals Tab */}
          {activeTab === 'signals' && fftStats?.stats && (
            <div className="p-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                  📊 Market Signal Analysis
                </h2>
                
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg">
                    <div className="text-3xl font-bold">{fftStats.stats.n}</div>
                    <div className="text-blue-100">Data Points Analyzed</div>
                  </div>
                  <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg">
                    <div className="text-3xl font-bold">{fftStats.stats.total_energy.toFixed(3)}</div>
                    <div className="text-green-100">Market Energy Level</div>
                  </div>
                  <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-lg">
                    <div className="text-3xl font-bold">
                      {(fftStats.stats.band_energy.high > 0.05 ? 'High' : 'Low')}
                    </div>
                    <div className="text-purple-100">Volatility Signal</div>
                  </div>
                </div>
                
                {/* PowerBI-style Chart */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Market Frequency Analysis</h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                      data={[
                        { 
                          name: 'Long-term Trends', 
                          value: fftStats.stats.band_energy.low,
                          description: 'Fundamental market direction'
                        },
                        { 
                          name: 'Medium-term Cycles', 
                          value: fftStats.stats.band_energy.mid,
                          description: 'Seasonal patterns'
                        },
                        { 
                          name: 'Short-term Noise', 
                          value: fftStats.stats.band_energy.high,
                          description: 'Daily volatility'
                        }
                      ]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 12 }}
                        interval={0}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        label={{ value: 'Signal Strength', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #ccc',
                          borderRadius: '8px',
                          fontSize: '14px'
                        }}
                        formatter={(value: any, name: any, props: any) => [
                          `${value.toFixed(4)}`,
                          props.payload.description
                        ]}
                      />
                      <Bar 
                        dataKey="value" 
                        fill="#118DFF"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                  
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>💡 Insight:</strong> Higher bars indicate stronger market patterns. 
                      Long-term trends show fundamental direction, while short-term noise indicates daily volatility levels.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Classical Strategy Tab */}
          {activeTab === 'classical' && classical?.weights && (
            <div className="p-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                  🏛️ Traditional Investment Strategy
                </h2>
                
                {/* Performance Status */}
                <div className={`p-6 rounded-lg mb-6 ${getPerformanceStatus(classical.objective).bg}`}>
                  <div className="flex justify-between items-center">
                    <span className={`text-2xl font-semibold ${getPerformanceStatus(classical.objective).color}`}>
                      {getPerformanceStatus(classical.objective).text}
                    </span>
                    <span className="text-3xl font-bold text-gray-800">
                      {(classical.objective * 100).toFixed(2)}%
                    </span>
                  </div>
                </div>

                {/* Portfolio Allocation Chart */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">Portfolio Allocation</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Tech Stocks', value: classical.weights[0], color: powerBIColors[0] },
                            { name: 'Blue Chips', value: classical.weights[1], color: powerBIColors[1] },
                            { name: 'Growth Stocks', value: classical.weights[2], color: powerBIColors[2] },
                            { name: 'Bonds', value: classical.weights[3], color: powerBIColors[3] }
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(1)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {classical.weights.map((_: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={powerBIColors[index]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: any) => [`${(value * 100).toFixed(1)}%`, 'Allocation']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">Investment Breakdown</h3>
                    <div className="space-y-4">
                      {['Tech Stocks', 'Blue Chips', 'Growth Stocks', 'Bonds'].map((asset, idx) => (
                        <div key={asset} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                          <span className="font-medium">{asset}</span>
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-4 h-4 rounded"
                              style={{ backgroundColor: powerBIColors[idx] }}
                            ></div>
                            <span className="font-bold">{(classical.weights[idx] * 100).toFixed(1)}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-6 p-4 bg-gray-50 rounded">
                      <strong>💰 Investment Advice:</strong>
                      <p className="text-sm text-gray-600 mt-1">
                        {classical.objective < 0 
                          ? 'Conservative approach recommended. Focus on stable assets to minimize risk.' 
                          : 'Aggressive growth strategy. Higher risk but potential for better returns.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quantum Strategy Tab */}
          {activeTab === 'quantum' && quantum?.selection_bits && (
            <div className="p-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                  ⚛️ Quantum Investment Strategy
                </h2>
                
                {/* Performance Status */}
                <div className={`p-6 rounded-lg mb-6 ${getPerformanceStatus(quantum.objective).bg}`}>
                  <div className="flex justify-between items-center">
                    <span className={`text-2xl font-semibold ${getPerformanceStatus(quantum.objective).color}`}>
                      {getPerformanceStatus(quantum.objective).text}
                    </span>
                    <span className="text-3xl font-bold text-gray-800">
                      {(quantum.objective * 100).toFixed(2)}%
                    </span>
                  </div>
                </div>

                {/* Quantum Recommendations */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {['Tech Stocks', 'Blue Chips', 'Growth Stocks', 'Bonds'].map((asset, idx) => (
                    <div 
                      key={asset} 
                      className={`p-6 rounded-lg border-2 transition-all ${
                        quantum.selection_bits[idx] 
                          ? 'border-green-400 bg-green-50' 
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-3xl mb-2">
                          {quantum.selection_bits[idx] ? '✅' : '❌'}
                        </div>
                        <h3 className="font-semibold text-sm mb-1">{asset}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          quantum.selection_bits[idx] 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {quantum.selection_bits[idx] ? 'BUY' : 'SKIP'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-purple-50 p-6 rounded-lg">
                  <h3 className="font-semibold text-purple-800 mb-2">🔬 Quantum AI Insight</h3>
                  <p className="text-purple-700">
                    {quantum.selection_bits.filter(Boolean).length === 1 
                      ? 'Quantum algorithm recommends focusing on a single high-performance asset for maximum efficiency.'
                      : quantum.selection_bits.filter(Boolean).length === 0
                      ? 'Market conditions suggest holding cash or waiting for better opportunities.'
                      : 'Quantum optimization found an optimal multi-asset combination for balanced growth.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Strategy Comparison Tab */}
          {activeTab === 'comparison' && classical?.objective && quantum?.objective && (
            <div className="p-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-6">🏆 Strategy Performance Comparison</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white p-8 rounded-lg text-center">
                    <h3 className="text-xl font-semibold mb-4">🏛️ Traditional Strategy</h3>
                    <div className="text-4xl font-bold mb-2">{(classical.objective * 100).toFixed(2)}%</div>
                    <p className="text-indigo-100">Expected Annual Return</p>
                  </div>
                  
                  <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-8 rounded-lg text-center">
                    <h3 className="text-xl font-semibold mb-4">⚛️ Quantum Strategy</h3>
                    <div className="text-4xl font-bold mb-2">{(quantum.objective * 100).toFixed(2)}%</div>
                    <p className="text-purple-100">Expected Annual Return</p>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Performance Comparison</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={[
                        { 
                          strategy: 'Traditional', 
                          performance: classical.objective * 100,
                          color: '#6366F1'
                        },
                        { 
                          strategy: 'Quantum', 
                          performance: quantum.objective * 100,
                          color: '#8B5CF6'
                        }
                      ]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="strategy" />
                      <YAxis label={{ value: 'Expected Return (%)', angle: -90, position: 'insideLeft' }} />
                      <Tooltip 
                        formatter={(value: any) => [`${value.toFixed(2)}%`, 'Expected Return']}
                      />
                      <Bar dataKey="performance" fill="#118DFF" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-6 p-6 bg-yellow-50 rounded-lg">
                  <h3 className="font-semibold text-yellow-800 mb-2">📊 Analysis Result</h3>
                  <p className="text-yellow-700">
                    {Math.abs(classical.objective - quantum.objective) < 0.001 
                      ? '🤝 Both strategies show very similar performance. Consider diversifying with both approaches.'
                      : classical.objective < quantum.objective
                      ? '⚛️ Quantum strategy shows superior performance potential. The AI has identified better optimization patterns.'
                      : '🏛️ Traditional strategy appears more favorable. Conservative approach may be better in current market conditions.'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}