export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-2xl">
              ⚛️
            </div>
            <div>
              <h1 className="text-xl font-bold">Quantum RF Portfolio Optimizer</h1>
              <p className="text-xs text-slate-400">Research-Grade Investment Platform</p>
            </div>
          </div>
          <a 
            href="/" 
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition text-sm font-medium"
          >
            ← Back to Dashboard
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-5xl px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sky-500/20 border border-sky-500/30 text-sky-300 text-sm mb-6">
            <span className="animate-pulse">●</span>
            Next-Generation Portfolio Optimization
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-sky-400 via-blue-400 to-violet-400 bg-clip-text text-transparent">
            About QRPO
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            A cutting-edge portfolio optimizer that combines <span className="text-sky-400 font-semibold">RF signal processing</span>, 
            <span className="text-violet-400 font-semibold"> quantum computing</span>, and 
            <span className="text-pink-400 font-semibold"> machine learning</span> to revolutionize investment strategies.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-sky-500/10 to-transparent p-6 hover:border-sky-500/30 transition">
            <div className="text-4xl mb-4">📡</div>
            <h3 className="text-xl font-semibold mb-2 text-sky-300">RF Signal Processing</h3>
            <p className="text-slate-400 text-sm">
              Treats market time series as RF signals, extracting spectral features using FFT analysis 
              to identify hidden patterns and frequencies in price movements.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-violet-500/10 to-transparent p-6 hover:border-violet-500/30 transition">
            <div className="text-4xl mb-4">⚛️</div>
            <h3 className="text-xl font-semibold mb-2 text-violet-300">Quantum Computing</h3>
            <p className="text-slate-400 text-sm">
              Leverages Qiskit and QAOA (Quantum Approximate Optimization Algorithm) to explore 
              exponentially large solution spaces for optimal portfolio allocation.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-pink-500/10 to-transparent p-6 hover:border-pink-500/30 transition">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-xl font-semibold mb-2 text-pink-300">Machine Learning</h3>
            <p className="text-slate-400 text-sm">
              Employs scikit-learn regression models to predict stock returns based on real-time 
              market data, volume patterns, and volatility metrics.
            </p>
          </div>
        </div>

        {/* Technical Stack */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 mb-16">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <span>🛠️</span>
            Technical Stack
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-sky-300 mb-3">Backend</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  FastAPI for high-performance REST APIs
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  Qiskit for quantum optimization algorithms
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  NumPy & SciPy for numerical computing
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  pandas-datareader for real-time market data
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  scikit-learn for ML model training
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-violet-300 mb-3">Frontend</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  Next.js 14 with TypeScript
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  Tailwind CSS for modern styling
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  Recharts for data visualization
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  Real-time API integration
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  Responsive dashboard design
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <span>⚙️</span>
            How It Works
          </h2>
          <div className="space-y-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-start gap-4">
                <div className="h-8 w-8 rounded-full bg-sky-500/20 flex items-center justify-center flex-shrink-0 text-sky-400 font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Market Signal Analysis</h3>
                  <p className="text-sm text-slate-400">
                    Fetches real-time stock data from Stooq and applies FFT (Fast Fourier Transform) 
                    to extract frequency components and identify cyclical patterns in price movements.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-start gap-4">
                <div className="h-8 w-8 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0 text-violet-400 font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Optimization Strategies</h3>
                  <p className="text-sm text-slate-400">
                    Runs both classical (SLSQP) and quantum (QAOA) optimization algorithms to find 
                    optimal portfolio weights that balance expected returns against risk (variance).
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-start gap-4">
                <div className="h-8 w-8 rounded-full bg-pink-500/20 flex items-center justify-center flex-shrink-0 text-pink-400 font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Machine Learning Predictions</h3>
                  <p className="text-sm text-slate-400">
                    Trains linear regression models on volume, price change percentage, and volatility 
                    to predict daily returns and generate actionable investment insights.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-start gap-4">
                <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 text-emerald-400 font-bold">
                  4
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Portfolio Simulation</h3>
                  <p className="text-sm text-slate-400">
                    Simulates multi-asset portfolio performance over time, computing cumulative returns 
                    and visualizing profit/loss trends with interactive charts.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Use Cases */}
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <span>🎯</span>
            Use Cases
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <span className="text-xl">📈</span>
              <div>
                <h4 className="font-semibold text-sm">Quantitative Research</h4>
                <p className="text-xs text-slate-400">Compare classical vs quantum optimization approaches</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xl">🔬</span>
              <div>
                <h4 className="font-semibold text-sm">Academic Studies</h4>
                <p className="text-xs text-slate-400">Research-grade platform for financial modeling</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xl">💼</span>
              <div>
                <h4 className="font-semibold text-sm">Portfolio Management</h4>
                <p className="text-xs text-slate-400">Real-time analysis for investment decision-making</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xl">🚀</span>
              <div>
                <h4 className="font-semibold text-sm">Technology Demo</h4>
                <p className="text-xs text-slate-400">Showcase of quantum computing applications</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="text-center mt-16">
          <a 
            href="/" 
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-violet-500 hover:from-sky-600 hover:to-violet-600 transition font-semibold"
          >
            Start Optimizing →
          </a>
          <p className="text-sm text-slate-400 mt-4">
            Built with ❤️ using FastAPI, Qiskit, and Next.js
          </p>
        </div>
      </main>
    </div>
  );
}
