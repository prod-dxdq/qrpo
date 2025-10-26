import { useState } from 'react';

export default function Home() {
  const [message, setMessage] = useState('Dashboard Loading...');

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial', backgroundColor: '#f0f0f0', minHeight: '100vh' }}>
      <h1 style={{ color: '#333', marginBottom: '20px' }}>🚀 QRPO Investment Dashboard</h1>
      
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <p style={{ fontSize: '18px', color: '#666' }}>{message}</p>
        <button 
          onClick={() => setMessage('✅ React is working! Dashboard loaded successfully.')}
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Test React
        </button>
      </div>

      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px' }}>
        <h2 style={{ color: '#333', marginBottom: '15px' }}>Quick Status Check</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div style={{ backgroundColor: '#e3f2fd', padding: '15px', borderRadius: '4px' }}>
            <h3 style={{ margin: '0 0 5px 0', color: '#1976d2' }}>Frontend</h3>
            <p style={{ margin: 0, color: '#666' }}>✅ Next.js Running</p>
          </div>
          <div style={{ backgroundColor: '#f3e5f5', padding: '15px', borderRadius: '4px' }}>
            <h3 style={{ margin: '0 0 5px 0', color: '#7b1fa2' }}>Backend</h3>
            <p style={{ margin: 0, color: '#666' }}>🔄 Checking connection...</p>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '4px', border: '1px solid #ffeaa7' }}>
        <p style={{ margin: 0, color: '#856404' }}>
          <strong>Note:</strong> This is a simplified test version to verify React functionality. 
          Full PowerBI-style dashboard with charts and closable tabs will be restored once basic functionality is confirmed.
        </p>
      </div>
    </div>
  );
}