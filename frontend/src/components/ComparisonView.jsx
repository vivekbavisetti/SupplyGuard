import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const RISK_COLORS = { LOW: '#22c55e', MEDIUM: '#f59e0b', HIGH: '#f97316', CRITICAL: '#ef4444', Unknown: '#6b7280' };

function RiskBadge({ level }) {
  return (
    <span style={{ background: RISK_COLORS[level] || '#6b7280', color: '#fff', padding: '1px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700 }}>
      {level}
    </span>
  );
}

export default function ComparisonView({ data }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8', fontSize: 14 }}>
        Create multiple projects and upload SBOMs to see cross-project comparison.
      </div>
    );
  }

  const chartData = data.map(p => ({
    name:     p.name.length > 12 ? p.name.slice(0, 11) + '…' : p.name,
    Critical: p.criticalCount,
    High:     p.highCount,
    Medium:   p.mediumCount,
    Low:      p.lowCount,
    Score:    p.riskScore
  }));

  return (
    <div style={{ padding: 20 }}>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16, color: '#1e293b' }}>
        Cross-Project Risk Comparison ({data.length} projects)
      </div>

      {/* Risk score bar chart */}
      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', padding: '16px 8px', marginBottom: 20 }}>
        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12, paddingLeft: 8, color: '#475569' }}>Risk Score by Project (0–100)</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="Score" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Severity stacked chart */}
      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', padding: '16px 8px', marginBottom: 20 }}>
        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12, paddingLeft: 8, color: '#475569' }}>Vulnerability Severity Distribution</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="Critical" stackId="a" fill="#ef4444" />
            <Bar dataKey="High"     stackId="a" fill="#f97316" />
            <Bar dataKey="Medium"   stackId="a" fill="#f59e0b" />
            <Bar dataKey="Low"      stackId="a" fill="#22c55e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Comparison table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              {['Project', 'Language', 'SBOM', 'Components', 'Risk Score', 'Level', 'Critical', 'High', 'Medium', 'Vuln Components'].map(h => (
                <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: '#475569', fontWeight: 600, borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.sort((a, b) => b.riskScore - a.riskScore).map(p => (
              <tr key={p._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '8px 10px', fontWeight: 600, color: '#1e293b' }}>{p.name}</td>
                <td style={{ padding: '8px 10px', color: '#64748b' }}>{p.language || '—'}</td>
                <td style={{ padding: '8px 10px', color: '#64748b' }}>{p.sbomFormat || '—'}</td>
                <td style={{ padding: '8px 10px', color: '#1e293b', textAlign: 'center' }}>{p.componentCount}</td>
                <td style={{ padding: '8px 10px', fontWeight: 700, color: RISK_COLORS[p.riskLevel] || '#1e293b' }}>{p.riskScore}</td>
                <td style={{ padding: '8px 10px' }}><RiskBadge level={p.riskLevel || 'Unknown'} /></td>
                <td style={{ padding: '8px 10px', color: '#ef4444', fontWeight: 600, textAlign: 'center' }}>{p.criticalCount}</td>
                <td style={{ padding: '8px 10px', color: '#f97316', fontWeight: 600, textAlign: 'center' }}>{p.highCount}</td>
                <td style={{ padding: '8px 10px', color: '#f59e0b', fontWeight: 600, textAlign: 'center' }}>{p.mediumCount}</td>
                <td style={{ padding: '8px 10px', color: '#64748b', textAlign: 'center' }}>{p.vulnerableComponents}/{p.totalComponents}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
