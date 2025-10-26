import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Simple icons as text since react-icons might be causing issues
const CloseIcon = () => <span style={{ cursor: 'pointer', fontWeight: 'bold' }}>✕</span>;
const ExpandMore = () => <span>▼</span>;
const ExpandLess = () => <span>▲</span>;

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

  // Helper function to get performance status
  const getPerformanceStatus = (objective: number) => {
    if (objective > 0) return { text: "📈 Potential Profit!", color: "#16a34a", bg: "#f0fdf4" };
    if (objective < -0.01) return { text: "📉 High Risk", color: "#dc2626", bg: "#fef2f2" };
    return { text: "⚖️ Balanced", color: "#ca8a04", bg: "#fffbeb" };
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
      setFftStats({ error: (error as Error).message });
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
      setClassical({ error: (error as Error).message });
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
      setQuantum({ error: (error as Error).message });
    } finally {
      setLoading('');
    }
  };

  // CSS styles as objects to avoid Tailwind dependency issues
  const styles = {
    container: { minHeight: '100vh', backgroundColor: '#f9fafb', fontFamily: 'Arial, sans-serif' },
    header: { backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', padding: '24px' },
    headerFlex: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    title: { fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: 0 },
    status: { padding: '8px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: '500', marginLeft: '16px' },
    statusOnline: { backgroundColor: '#dcfce7', color: '#166534' },
    statusOffline: { backgroundColor: '#fee2e2', color: '#991b1b' },
    tabBar: { display: 'flex', alignItems: 'center', gap: '4px' },
    tab: { display: 'flex', alignItems: 'center', padding: '8px 16px', borderRadius: '8px 8px 0 0', borderBottom: '2px solid', cursor: 'pointer', fontSize: '14px', fontWeight: '500' },
    tabActive: { backgroundColor: '#eff6ff', borderBottomColor: '#3b82f6', color: '#1d4ed8' },
    tabInactive: { backgroundColor: '#f3f4f6', borderBottomColor: 'transparent', color: '#6b7280' },
    mainContent: { display: 'flex', height: '100vh' },
    sidebar: { width: '320px', backgroundColor: 'white', borderRight: '1px solid #e5e7eb', overflowY: 'auto' },
    sidebarContent: { padding: '16px' },
    sidebarTitle: { fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' },
    section: { marginBottom: '16px' },
    sectionHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px', cursor: 'pointer' },
    sectionTitle: { fontWeight: '500', color: '#374151' },
    button: { width: '100%', textAlign: 'left', padding: '8px', fontSize: '14px', color: '#6b7280', backgroundColor: 'transparent', border: 'none', borderRadius: '4px', cursor: 'pointer' },
    buttonHover: { backgroundColor: '#eff6ff', color: '#1d4ed8' },
    contentArea: { flex: 1, overflowY: 'auto' },
    welcome: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' },
    welcomeContent: { textAlign: 'center' },
    card: { backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', padding: '24px', margin: '24px' },
    cardTitle: { fontSize: '20px', fontWeight: 'bold', color: '#1f2937', marginBottom: '24px' },
    kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '32px' },
    kpiCard: { padding: '24px', borderRadius: '8px', color: 'white' },
    kpiValue: { fontSize: '32px', fontWeight: 'bold' },
    kpiLabel: { fontSize: '14px', opacity: 0.8 },
    dataRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '4px', marginBottom: '8px' },
    insight: { padding: '16px', backgroundColor: '#eff6ff', borderRadius: '8px', marginTop: '16px' }
  };

  return (
    <div style={styles.container}>
      {/* PowerBI-style Header */}
      <div style={styles.header}>
        <div style={styles.headerFlex}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <h1 style={styles.title}>Smart Investment Dashboard</h1>
            <span style={{
              ...styles.status,
              ...(health === 'ok' ? styles.statusOnline : styles.statusOffline)
            }}>
              {health === 'ok' ? '● Connected' : '● Offline'}
            </span>
          </div>
          
          {/* Tab Bar */}
          <div style={styles.tabBar}>
            {openTabs.map(tabId => {
              const tabNames = {
                'signals': 'Market Signals',
                'classical': 'Traditional Portfolio',
                'quantum': 'Quantum Strategy',
                'comparison': 'Strategy Comparison'
              } as const;
              return (
                <div 
                  key={tabId}
                  style={{
                    ...styles.tab,
                    ...(activeTab === tabId ? styles.tabActive : styles.tabInactive)
                  }}
                  onClick={() => setActiveTab(tabId)}
                >
                  <span>{tabNames[tabId as keyof typeof tabNames]}</span>
                  <span 
                    style={{ marginLeft: '8px', padding: '2px 4px', borderRadius: '2px' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(tabId);
                    }}
                  >
                    <CloseIcon />
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={styles.mainContent}>
        {/* PowerBI-style Sidebar */}
        <div style={styles.sidebar}>
          <div style={styles.sidebarContent}>
            <h2 style={styles.sidebarTitle}>Analytics Menu</h2>
            
            {/* Market Signals Section */}
            <div style={styles.section}>
              <div 
                style={styles.sectionHeader}
                onClick={() => toggleSection('signals')}
              >
                <span style={styles.sectionTitle}>📊 Market Analysis</span>
                {expandedSections.includes('signals') ? <ExpandLess /> : <ExpandMore />}
              </div>
              
              {expandedSections.includes('signals') && (
                <div style={{ marginTop: '8px', marginLeft: '16px' }}>
                  <button 
                    style={styles.button}
                    onClick={() => {
                      runFFT();
                      openTab('signals', 'Market Signals');
                    }}
                    disabled={loading === 'fft'}
                    onMouseEnter={(e) => Object.assign(e.target.style, styles.buttonHover)}
                    onMouseLeave={(e) => Object.assign(e.target.style, styles.button)}
                  >
                    {loading === 'fft' ? '🔄 Analyzing...' : '🔍 Run Signal Analysis'}
                  </button>
                </div>
              )}
            </div>

            {/* Investment Strategies Section */}
            <div style={styles.section}>
              <div 
                style={styles.sectionHeader}
                onClick={() => toggleSection('strategies')}
              >
                <span style={styles.sectionTitle}>💼 Investment Strategies</span>
                {expandedSections.includes('strategies') ? <ExpandLess /> : <ExpandMore />}
              </div>
              
              {expandedSections.includes('strategies') && (
                <div style={{ marginTop: '8px', marginLeft: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button 
                    style={styles.button}
                    onClick={() => {
                      runClassical();
                      openTab('classical', 'Traditional Portfolio');
                    }}
                    disabled={loading === 'classical'}
                    onMouseEnter={(e) => Object.assign(e.target.style, styles.buttonHover)}
                    onMouseLeave={(e) => Object.assign(e.target.style, styles.button)}
                  >
                    {loading === 'classical' ? '⏳ Computing...' : '🏛️ Traditional Strategy'}
                  </button>
                  
                  <button 
                    style={styles.button}
                    onClick={() => {
                      runQuantum();
                      openTab('quantum', 'Quantum Strategy');
                    }}
                    disabled={loading === 'quantum'}
                    onMouseEnter={(e) => Object.assign(e.target.style, styles.buttonHover)}
                    onMouseLeave={(e) => Object.assign(e.target.style, styles.button)}
                  >
                    {loading === 'quantum' ? '🔬 Processing...' : '⚛️ Quantum Strategy'}
                  </button>
                  
                  {classical && quantum && (
                    <button 
                      style={styles.button}
                      onClick={() => openTab('comparison', 'Strategy Comparison')}
                      onMouseEnter={(e) => Object.assign(e.target.style, styles.buttonHover)}
                      onMouseLeave={(e) => Object.assign(e.target.style, styles.button)}
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
        <div style={styles.contentArea}>
          {/* Welcome Screen */}
          {activeTab === '' && (
            <div style={styles.welcome}>
              <div style={styles.welcomeContent}>
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>📊</div>
                <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Welcome to Your Investment Dashboard</h3>
                <p style={{ color: '#6b7280', marginBottom: '24px' }}>Select an analysis from the menu to get started</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '14px', color: '#9ca3af' }}>• Analyze market signals and trends</div>
                  <div style={{ fontSize: '14px', color: '#9ca3af' }}>• Compare traditional vs quantum strategies</div>
                  <div style={{ fontSize: '14px', color: '#9ca3af' }}>• Get AI-powered investment recommendations</div>
                </div>
              </div>
            </div>
          )}

          {/* Market Signals Tab */}
          {activeTab === 'signals' && fftStats?.stats && (
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>📊 Market Signal Analysis</h2>
              
              {/* KPI Cards */}
              <div style={styles.kpiGrid}>
                <div style={{ ...styles.kpiCard, background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}>
                  <div style={styles.kpiValue}>{fftStats.stats.n}</div>
                  <div style={styles.kpiLabel}>Data Points Analyzed</div>
                </div>
                <div style={{ ...styles.kpiCard, background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                  <div style={styles.kpiValue}>{fftStats.stats.total_energy.toFixed(3)}</div>
                  <div style={styles.kpiLabel}>Market Energy Level</div>
                </div>
                <div style={{ ...styles.kpiCard, background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
                  <div style={styles.kpiValue}>
                    {(fftStats.stats.band_energy.high > 0.05 ? 'High' : 'Low')}
                  </div>
                  <div style={styles.kpiLabel}>Volatility Signal</div>
                </div>
              </div>
              
              {/* Data Display */}
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Market Frequency Analysis</h3>
                <div style={styles.dataRow}>
                  <span style={{ fontWeight: '500' }}>Long-term Trends:</span>
                  <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#3b82f6' }}>{fftStats.stats.band_energy.low.toFixed(4)}</span>
                </div>
                <div style={styles.dataRow}>
                  <span style={{ fontWeight: '500' }}>Medium-term Cycles:</span>
                  <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981' }}>{fftStats.stats.band_energy.mid.toFixed(4)}</span>
                </div>
                <div style={styles.dataRow}>
                  <span style={{ fontWeight: '500' }}>Short-term Noise:</span>
                  <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#ef4444' }}>{fftStats.stats.band_energy.high.toFixed(4)}</span>
                </div>
                
                <div style={styles.insight}>
                  <p style={{ margin: 0, fontSize: '14px', color: '#1e40af' }}>
                    <strong>💡 Insight:</strong> Higher values indicate stronger market patterns. 
                    Long-term trends show fundamental direction, while short-term noise indicates daily volatility levels.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Classical Strategy Tab */}
          {activeTab === 'classical' && classical?.weights && (
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>🏛️ Traditional Investment Strategy</h2>
              
              {/* Performance Status */}
              <div style={{
                padding: '24px',
                borderRadius: '8px',
                marginBottom: '24px',
                backgroundColor: getPerformanceStatus(classical.objective).bg
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    fontSize: '24px',
                    fontWeight: '600',
                    color: getPerformanceStatus(classical.objective).color
                  }}>
                    {getPerformanceStatus(classical.objective).text}
                  </span>
                  <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937' }}>
                    {(classical.objective * 100).toFixed(2)}%
                  </span>
                </div>
              </div>

              {/* Portfolio Allocation */}
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Investment Breakdown</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {['Tech Stocks', 'Blue Chips', 'Growth Stocks', 'Bonds'].map((asset, idx) => (
                    <div key={asset} style={styles.dataRow}>
                      <span style={{ fontWeight: '500' }}>{asset}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div 
                          style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '2px',
                            backgroundColor: powerBIColors[idx]
                          }}
                        ></div>
                        <span style={{ fontWeight: 'bold' }}>{(classical.weights[idx] * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div style={styles.insight}>
                  <strong>💰 Investment Advice:</strong>
                  <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
                    {classical.objective < 0 
                      ? 'Conservative approach recommended. Focus on stable assets to minimize risk.' 
                      : 'Aggressive growth strategy. Higher risk but potential for better returns.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Quantum Strategy Tab */}
          {activeTab === 'quantum' && quantum?.selection_bits && (
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>⚛️ Quantum Investment Strategy</h2>
              
              {/* Performance Status */}
              <div style={{
                padding: '24px',
                borderRadius: '8px',
                marginBottom: '24px',
                backgroundColor: getPerformanceStatus(quantum.objective).bg
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    fontSize: '24px',
                    fontWeight: '600',
                    color: getPerformanceStatus(quantum.objective).color
                  }}>
                    {getPerformanceStatus(quantum.objective).text}
                  </span>
                  <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937' }}>
                    {(quantum.objective * 100).toFixed(2)}%
                  </span>
                </div>
              </div>

              {/* Quantum Recommendations */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                {['Tech Stocks', 'Blue Chips', 'Growth Stocks', 'Bonds'].map((asset, idx) => (
                  <div 
                    key={asset} 
                    style={{
                      padding: '24px',
                      borderRadius: '8px',
                      border: `2px solid ${quantum.selection_bits[idx] ? '#4ade80' : '#e5e7eb'}`,
                      backgroundColor: quantum.selection_bits[idx] ? '#f0fdf4' : '#f9fafb',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>
                      {quantum.selection_bits[idx] ? '✅' : '❌'}
                    </div>
                    <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>{asset}</h3>
                    <span style={{
                      fontSize: '12px',
                      padding: '4px 8px',
                      borderRadius: '9999px',
                      backgroundColor: quantum.selection_bits[idx] ? '#dcfce7' : '#f3f4f6',
                      color: quantum.selection_bits[idx] ? '#166534' : '#6b7280'
                    }}>
                      {quantum.selection_bits[idx] ? 'BUY' : 'SKIP'}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ padding: '24px', backgroundColor: '#faf5ff', borderRadius: '8px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#7c2d92', marginBottom: '8px' }}>🔬 Quantum AI Insight</h3>
                <p style={{ margin: 0, color: '#86198f' }}>
                  {quantum.selection_bits.filter(Boolean).length === 1 
                    ? 'Quantum algorithm recommends focusing on a single high-performance asset for maximum efficiency.'
                    : quantum.selection_bits.filter(Boolean).length === 0
                    ? 'Market conditions suggest holding cash or waiting for better opportunities.'
                    : 'Quantum optimization found an optimal multi-asset combination for balanced growth.'}
                </p>
              </div>
            </div>
          )}

          {/* Strategy Comparison Tab */}
          {activeTab === 'comparison' && classical?.objective && quantum?.objective && (
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>🏆 Strategy Performance Comparison</h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
                <div style={{
                  ...styles.kpiCard,
                  background: 'linear-gradient(135deg, #6366f1, #4338ca)',
                  textAlign: 'center'
                }}>
                  <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>🏛️ Traditional Strategy</h3>
                  <div style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '8px' }}>{(classical.objective * 100).toFixed(2)}%</div>
                  <p style={{ fontSize: '14px', opacity: 0.8 }}>Expected Annual Return</p>
                </div>
                
                <div style={{
                  ...styles.kpiCard,
                  background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                  textAlign: 'center'
                }}>
                  <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>⚛️ Quantum Strategy</h3>
                  <div style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '8px' }}>{(quantum.objective * 100).toFixed(2)}%</div>
                  <p style={{ fontSize: '14px', opacity: 0.8 }}>Expected Annual Return</p>
                </div>
              </div>

              <div style={{ padding: '24px', backgroundColor: '#fffbeb', borderRadius: '8px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#92400e', marginBottom: '8px' }}>📊 Analysis Result</h3>
                <p style={{ margin: 0, color: '#a16207' }}>
                  {Math.abs(classical.objective - quantum.objective) < 0.001 
                    ? '🤝 Both strategies show very similar performance. Consider diversifying with both approaches.'
                    : classical.objective < quantum.objective
                    ? '⚛️ Quantum strategy shows superior performance potential. The AI has identified better optimization patterns.'
                    : '🏛️ Traditional strategy appears more favorable. Conservative approach may be better in current market conditions.'
                  }
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}