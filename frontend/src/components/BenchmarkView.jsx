import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { getBenchSummary, runBenchmark } from '../api';

export default function BenchmarkView({ projectId, componentCount }) {
  const [summary, setSummary]   = useState(null);
  const [result, setResult]     = useState(null);
  const [loading, setLoading]   = useState(false);
  const [runs, setRuns]         = useState(3);

  async function loadSummary() {
    const res = await getBenchSummary();
    setSummary(res.data);
  }

  async function handleRun() {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await runBenchmark(projectId, runs);
      setResult(res.data);
      loadSummary();
    } catch (err) {
      alert('Benchmark error: ' + (err.response?.data?.error || err.message));
    }
    setLoading(false);
  }

  const chartData = result?.runs?.map(r => ({ name: `Run ${r.run}`, 'Duration (ms)': r.durationMs })) || [];

  return (
    <div style={{ padding: 20 }}>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16, color: '#1e293b' }}>
        Performance Benchmarking
      </div>

      {/* Run controls */}
      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', padding: 16, marginBottom: 20 }}>
        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12, color: '#475569' }}>Run Risk Calculation Benchmark</div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ fontSize: 13, color: '#64748b' }}>
            Project: {componentCount} components
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <label style={{ fontSize: 13, color: '#64748b' }}>Runs:</label>
            <select
              value={runs}
              onChange={e => setRuns(Number(e.target.value))}
              style={{ padding: '5px 8px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13 }}
            >
              {[1, 3, 5, 10].map(n => <option key={n}>{n}</option>)}
            </select>
          </div>
          <button
            onClick={handleRun}
            disabled={loading || !projectId}
            style={{ padding: '7px 16px', background: loading ? '#94a3b8' : '#6366f1', color: '#fff', border: 'none', borderRadius: 6, cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: 13 }}
          >
            {loading ? '⏳ Running…' : '▶ Run Benchmark'}
          </button>
        </div>

        {result && (
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', gap: 16, marginBottom: 14, flexWrap: 'wrap' }}>
              {[
                { label: 'Component Count', value: result.componentCount },
                { label: 'Avg Duration', value: `${result.averageDurationMs} ms` },
                { label: 'Min Duration', value: `${Math.min(...result.runs.map(r => r.durationMs))} ms` },
                { label: 'Max Duration', value: `${Math.max(...result.runs.map(r => r.durationMs))} ms` },
              ].map(card => (
                <div key={card.label} style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 16px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontWeight: 700, fontSize: 18, color: '#1e293b' }}>{card.value}</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>{card.label}</div>
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit=" ms" />
                <Tooltip />
                <Line type="monotone" dataKey="Duration (ms)" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Summary table */}
      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontWeight: 600, fontSize: 13, color: '#475569' }}>All-Time Benchmark Summary</div>
          <button
            onClick={loadSummary}
            style={{ padding: '5px 12px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}
          >
            Refresh
          </button>
        </div>
        {!summary ? (
          <div style={{ color: '#94a3b8', fontSize: 13 }}>Click Refresh to load benchmark summary.</div>
        ) : (
          <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Operation', 'Runs', 'Avg (ms)', 'Min (ms)', 'Max (ms)'].map(h => (
                  <th key={h} style={{ padding: '7px 10px', textAlign: 'left', color: '#475569', fontWeight: 600, borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {summary.map(s => (
                <tr key={s._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '7px 10px', fontWeight: 500 }}>{s._id}</td>
                  <td style={{ padding: '7px 10px', color: '#64748b' }}>{s.count}</td>
                  <td style={{ padding: '7px 10px', color: '#6366f1', fontWeight: 600 }}>{Math.round(s.avgDurationMs)}</td>
                  <td style={{ padding: '7px 10px', color: '#22c55e' }}>{s.minDurationMs}</td>
                  <td style={{ padding: '7px 10px', color: '#f97316' }}>{s.maxDurationMs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
