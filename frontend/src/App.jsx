import { useState, useEffect } from 'react';
import { getProjects, createProject, getComponents, getRisk, uploadSBOM, deleteProject } from './api';
import './App.css';

// ─── constants ────────────────────────────────────────────────────────────────

const RISK_COLORS = {
  LOW:      '#22c55e',
  MEDIUM:   '#f59e0b',
  HIGH:     '#f97316',
  CRITICAL: '#ef4444',
  Unknown:  '#6b7280'
};

const SAMPLE_SBOM = {
  "bomFormat": "CycloneDX",
  "specVersion": "1.4",
  "serialNumber": "urn:uuid:demo-sbom-001",
  "version": 1,
  "metadata": {
    "timestamp": "2024-01-15T10:00:00Z",
    "component": {
      "type": "application",
      "name": "sample-java-app",
      "version": "1.0.0"
    }
  },
  "components": [
    {
      "type": "library",
      "name": "log4j-core",
      "version": "2.14",
      "purl": "pkg:maven/org.apache.logging.log4j/log4j-core@2.14",
      "bom-ref": "log4j-core-2.14"
    },
    {
      "type": "library",
      "name": "commons-text",
      "version": "1.9",
      "purl": "pkg:maven/org.apache.commons/commons-text@1.9",
      "bom-ref": "commons-text-1.9"
    },
    {
      "type": "library",
      "name": "snakeyaml",
      "version": "1.30",
      "purl": "pkg:maven/org.yaml/snakeyaml@1.30",
      "bom-ref": "snakeyaml-1.30"
    },
    {
      "type": "library",
      "name": "spring-boot",
      "version": "3.0.5",
      "purl": "pkg:maven/org.springframework.boot/spring-boot@3.0.5",
      "bom-ref": "spring-boot-3.0.5"
    },
    {
      "type": "library",
      "name": "logback-classic",
      "version": "1.2.11",
      "purl": "pkg:maven/ch.qos.logback/logback-classic@1.2.11",
      "bom-ref": "logback-classic-1.2.11"
    },
    {
      "type": "library",
      "name": "woodstox-core",
      "version": "6.4.0",
      "purl": "pkg:maven/com.fasterxml.woodstox/woodstox-core@6.4.0",
      "bom-ref": "woodstox-core-6.4.0"
    },
    {
      "type": "library",
      "name": "xstream",
      "version": "1.4.15",
      "purl": "pkg:maven/com.thoughtworks.xstream/xstream@1.4.15",
      "bom-ref": "xstream-1.4.15"
    },
    {
      "type": "library",
      "name": "jackson-databind",
      "version": "2.15.0",
      "purl": "pkg:maven/com.fasterxml.jackson.core/jackson-databind@2.15.0",
      "bom-ref": "jackson-databind-2.15.0"
    },
    {
      "type": "library",
      "name": "guava",
      "version": "31.1-jre",
      "purl": "pkg:maven/com.google.guava/guava@31.1-jre",
      "bom-ref": "guava-31.1"
    },
    {
      "type": "library",
      "name": "slf4j-api",
      "version": "2.0.7",
      "purl": "pkg:maven/org.slf4j/slf4j-api@2.0.7",
      "bom-ref": "slf4j-api-2.0.7"
    }
  ],
  "dependencies": [
    {
      "ref": "sample-java-app@1.0.0",
      "dependsOn": [
        "log4j-core-2.14",
        "commons-text-1.9",
        "spring-boot-3.0.5",
        "jackson-databind-2.15.0"
      ]
    },
    {
      "ref": "log4j-core-2.14",
      "dependsOn": ["slf4j-api-2.0.7"]
    },
    {
      "ref": "spring-boot-3.0.5",
      "dependsOn": ["snakeyaml-1.30", "logback-classic-1.2.11"]
    },
    {
      "ref": "logback-classic-1.2.11",
      "dependsOn": ["woodstox-core-6.4.0"]
    },
    {
      "ref": "commons-text-1.9",
      "dependsOn": ["xstream-1.4.15"]
    },
    {
      "ref": "jackson-databind-2.15.0",
      "dependsOn": ["guava-31.1"]
    }
  ]
};

// ─── small reusable components ────────────────────────────────────────────────

function RiskBadge({ level }) {
  return (
    <span style={{
      background: RISK_COLORS[level] || '#6b7280',
      color: 'white',
      padding: '2px 10px',
      borderRadius: '12px',
      fontSize: '11px',
      fontWeight: 'bold',
      letterSpacing: '0.3px'
    }}>
      {level}
    </span>
  );
}

function SeverityBar({ label, count, color }) {
  const pct = Math.min(count * 12, 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
      <span style={{ width: '72px', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>{label}</span>
      <div style={{ flex: 1, background: '#f1f5f9', borderRadius: '4px', height: '16px', overflow: 'hidden' }}>
        <div style={{
          width: count > 0 ? `${Math.max(pct, 8)}%` : '0%',
          background: color,
          height: '100%',
          borderRadius: '4px',
          transition: 'width 0.4s ease'
        }} />
      </div>
      <span style={{ fontSize: '13px', fontWeight: 'bold', width: '20px', color: '#1e293b' }}>{count}</span>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={{
      background: 'white',
      borderRadius: '10px',
      padding: '18px 16px',
      border: '1px solid #e2e8f0',
      textAlign: 'center',
      flex: 1
    }}>
      <div style={{ fontSize: '26px', fontWeight: 'bold', color: color || '#1e293b' }}>{value}</div>
      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', fontWeight: '500' }}>{label}</div>
    </div>
  );
}

// ─── main app ─────────────────────────────────────────────────────────────────

export default function App() {
  const [projects, setProjects]   = useState([]);
  const [selected, setSelected]   = useState(null);
  const [components, setComponents] = useState([]);
  const [risk, setRisk]           = useState(null);
  const [newProject, setNewProject] = useState({ name: '', description: '', language: 'Java' });
  const [loading, setLoading]     = useState(false);
  const [tab, setTab]             = useState('components');
  const [msg, setMsg]             = useState('');
  const [search, setSearch]       = useState('');

  useEffect(() => { loadProjects(); }, []);

  async function loadProjects() {
    try {
      const res = await getProjects();
      setProjects(res.data);
    } catch {
      // backend not yet started — silent fail
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!newProject.name.trim()) return;
    await createProject(newProject);
    setNewProject({ name: '', description: '', language: 'Java' });
    loadProjects();
  }

  async function selectProject(p) {
    setSelected(p);
    setComponents([]);
    setRisk(null);
    setMsg('');
    setSearch('');
    const [compRes, riskRes] = await Promise.allSettled([
      getComponents(p._id),
      getRisk(p._id)
    ]);
    if (compRes.status === 'fulfilled') setComponents(compRes.value.data);
    if (riskRes.status === 'fulfilled') setRisk(riskRes.value.data);
  }

  async function handleUploadSBOM() {
    if (!selected) return;
    setLoading(true);
    setMsg('');
    try {
      const res = await uploadSBOM(selected._id, SAMPLE_SBOM);
      setMsg(`✅ SBOM parsed: ${res.data.componentCount} components extracted | Risk Level: ${res.data.riskLevel} (Score: ${res.data.riskScore}/100)`);
      await selectProject(selected);
      loadProjects();
    } catch (err) {
      setMsg('❌ Error: ' + (err.response?.data?.error || err.message));
    }
    setLoading(false);
  }

  async function handleDelete(id, e) {
    e.stopPropagation();
    if (!window.confirm('Delete this project and all its data?')) return;
    await deleteProject(id);
    if (selected?._id === id) {
      setSelected(null);
      setComponents([]);
      setRisk(null);
    }
    loadProjects();
  }

  const directComps     = components.filter(c => c.isDirect);
  const transitiveComps = components.filter(c => !c.isDirect);

  const filteredComponents = components.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.version.toLowerCase().includes(search.toLowerCase())
  );

  const filteredVulns = risk?.affectedComponents?.filter(v =>
    v.componentName.toLowerCase().includes(search.toLowerCase()) ||
    v.cveId.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', minHeight: '100vh', background: '#f8fafc' }}>

      {/* ── Header ── */}
      <div style={{
        background: '#0f172a',
        color: 'white',
        padding: '14px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #1e293b'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '26px' }}>🛡️</span>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '18px', letterSpacing: '-0.3px' }}>SupplyGuard</div>
            <div style={{ fontSize: '11px', opacity: 0.5 }}>NoSQL-Based Software Supply Chain Risk Analysis · BCSE406L</div>
          </div>
        </div>
        <div style={{ fontSize: '11px', opacity: 0.5 }}>
          Bavisetti Vivek (24BCE1104) &nbsp;·&nbsp; Kaustubh Prasad Nair (24BCE1076)
        </div>
      </div>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 57px)' }}>

        {/* ── Sidebar ── */}
        <div style={{
          width: '288px',
          minWidth: '288px',
          background: 'white',
          borderRight: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ fontWeight: '700', fontSize: '13px', color: '#475569', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Projects
            </div>

            {/* Create form */}
            <form onSubmit={handleCreate}>
              <input
                placeholder="Project name *"
                value={newProject.name}
                onChange={e => setNewProject({ ...newProject, name: e.target.value })}
                style={{ width: '100%', padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', marginBottom: '6px', fontSize: '13px', boxSizing: 'border-box' }}
              />
              <input
                placeholder="Description (optional)"
                value={newProject.description}
                onChange={e => setNewProject({ ...newProject, description: e.target.value })}
                style={{ width: '100%', padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', marginBottom: '6px', fontSize: '13px', boxSizing: 'border-box' }}
              />
              <select
                value={newProject.language}
                onChange={e => setNewProject({ ...newProject, language: e.target.value })}
                style={{ width: '100%', padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', marginBottom: '8px', fontSize: '13px', boxSizing: 'border-box' }}
              >
                <option>Java</option>
                <option>JavaScript</option>
                <option>Python</option>
                <option>Go</option>
                <option>Rust</option>
              </select>
              <button
                type="submit"
                style={{ width: '100%', padding: '8px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
              >
                + Create Project
              </button>
            </form>
          </div>

          {/* Project list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
            {projects.length === 0 && (
              <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '12px', padding: '20px' }}>
                No projects yet. Create one above.
              </div>
            )}
            {projects.map(p => (
              <div
                key={p._id}
                onClick={() => selectProject(p)}
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  marginBottom: '4px',
                  cursor: 'pointer',
                  background: selected?._id === p._id ? '#eff6ff' : 'transparent',
                  border: selected?._id === p._id ? '1px solid #bfdbfe' : '1px solid transparent',
                  transition: 'all 0.15s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '600', fontSize: '13px', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.name}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                      {p.language} · {p.componentCount || 0} components
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '8px' }}>
                    <RiskBadge level={p.riskLevel || 'Unknown'} />
                    <button
                      onClick={(e) => handleDelete(p._id, e)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', fontSize: '18px', lineHeight: 1, padding: '0 2px' }}
                      title="Delete project"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Main Panel ── */}
        <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          {!selected ? (
            <div style={{ textAlign: 'center', marginTop: '100px', color: '#94a3b8' }}>
              <div style={{ fontSize: '56px', marginBottom: '16px' }}>🛡️</div>
              <div style={{ fontSize: '22px', fontWeight: '600', color: '#475569' }}>Welcome to SupplyGuard</div>
              <div style={{ fontSize: '14px', marginTop: '8px', lineHeight: '1.6' }}>
                Create a project in the sidebar, then click<br />
                <strong style={{ color: '#6366f1' }}>Load Sample SBOM</strong> to analyse dependencies and risk.
              </div>
              <div style={{ fontSize: '12px', marginTop: '20px', color: '#cbd5e1' }}>
                BCSE406L · Bavisetti Vivek 24BCE1104 · Kaustubh Prasad Nair 24BCE1076
              </div>
            </div>
          ) : (
            <>
              {/* Project header */}
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '18px 22px',
                marginBottom: '18px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '20px', color: '#0f172a' }}>{selected.name}</div>
                  <div style={{ color: '#64748b', fontSize: '13px', marginTop: '2px' }}>
                    {selected.description || 'No description'} &nbsp;·&nbsp; {selected.language} &nbsp;·&nbsp;
                    SBOM: {selected.sbomFormat || 'Not uploaded yet'}
                  </div>
                </div>
                <button
                  onClick={handleUploadSBOM}
                  disabled={loading}
                  style={{
                    padding: '10px 20px',
                    background: loading ? '#94a3b8' : '#6366f1',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontWeight: '600',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {loading ? '⏳ Parsing SBOM...' : '📄 Load Sample SBOM'}
                </button>
              </div>

              {/* Message banner */}
              {msg && (
                <div style={{
                  background: msg.startsWith('✅') ? '#f0fdf4' : '#fef2f2',
                  border: `1px solid ${msg.startsWith('✅') ? '#bbf7d0' : '#fecaca'}`,
                  borderRadius: '8px',
                  padding: '10px 16px',
                  marginBottom: '16px',
                  fontSize: '13px',
                  color: msg.startsWith('✅') ? '#166534' : '#991b1b',
                  fontWeight: '500'
                }}>
                  {msg}
                </div>
              )}

              {/* Risk stat cards */}
              {risk && (
                <>
                  <div style={{ display: 'flex', gap: '14px', marginBottom: '18px' }}>
                    <StatCard label="Risk Score" value={`${risk.riskScore}/100`} color={RISK_COLORS[risk.riskLevel]} />
                    <StatCard label="Risk Level" value={risk.riskLevel} color={RISK_COLORS[risk.riskLevel]} />
                    <StatCard label="Direct Vulns" value={risk.directVulnerabilities} color="#f97316" />
                    <StatCard label="Transitive Vulns" value={risk.transitiveVulnerabilities} color="#f59e0b" />
                    <StatCard label="Total Components" value={components.length} color="#3b82f6" />
                  </div>

                  {/* Severity breakdown */}
                  <div style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '18px 22px',
                    marginBottom: '18px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '14px', color: '#1e293b' }}>
                      Vulnerability Severity Breakdown
                    </div>
                    <SeverityBar label="CRITICAL" count={risk.criticalCount}  color="#ef4444" />
                    <SeverityBar label="HIGH"     count={risk.highCount}      color="#f97316" />
                    <SeverityBar label="MEDIUM"   count={risk.mediumCount}    color="#f59e0b" />
                    <SeverityBar label="LOW"      count={risk.lowCount}       color="#22c55e" />
                  </div>
                </>
              )}

              {/* Tabs */}
              <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                {/* Tab bar */}
                <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', padding: '0 8px' }}>
                  {[
                    { key: 'components',    label: `Components (${components.length})` },
                    { key: 'vulnerabilities', label: `Vulnerabilities (${risk?.affectedComponents?.length || 0})` },
                    { key: 'dependencies',  label: `Dependencies` },
                  ].map(t => (
                    <button
                      key={t.key}
                      onClick={() => { setTab(t.key); setSearch(''); }}
                      style={{
                        padding: '12px 18px',
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        fontWeight: tab === t.key ? '700' : '400',
                        color: tab === t.key ? '#3b82f6' : '#64748b',
                        borderBottom: tab === t.key ? '2px solid #3b82f6' : '2px solid transparent',
                        fontSize: '13px',
                        marginBottom: '-1px'
                      }}
                    >
                      {t.label}
                    </button>
                  ))}

                  {/* Search bar */}
                  {(tab === 'components' || tab === 'vulnerabilities') && (
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', padding: '8px 0' }}>
                      <input
                        placeholder="Search..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{
                          padding: '5px 10px',
                          border: '1px solid #e2e8f0',
                          borderRadius: '6px',
                          fontSize: '12px',
                          width: '160px'
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Tab content */}
                <div style={{ padding: '0' }}>

                  {/* ── Components tab ── */}
                  {tab === 'components' && (
                    <div style={{ overflowX: 'auto' }}>
                      {components.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '14px' }}>
                          No components yet. Click <strong>Load Sample SBOM</strong> to parse and extract components.
                        </div>
                      ) : (
                        <table style={{ width: '100%', fontSize: '13px' }}>
                          <thead>
                            <tr style={{ background: '#f8fafc' }}>
                              {['#', 'Name', 'Version', 'Type', 'Direct/Transitive', 'Depth', 'PURL', 'Licenses'].map(h => (
                                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#475569', fontWeight: '600', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {filteredComponents.map((c, i) => (
                              <tr key={c._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '9px 14px', color: '#94a3b8', fontSize: '12px' }}>{i + 1}</td>
                                <td style={{ padding: '9px 14px', fontWeight: '600', color: '#1e293b' }}>{c.name}</td>
                                <td style={{ padding: '9px 14px', fontFamily: 'monospace', color: '#475569', fontSize: '12px' }}>{c.version}</td>
                                <td style={{ padding: '9px 14px', color: '#64748b' }}>{c.type}</td>
                                <td style={{ padding: '9px 14px' }}>
                                  <span style={{
                                    background: c.isDirect ? '#dbeafe' : '#fef9c3',
                                    color: c.isDirect ? '#1d4ed8' : '#92400e',
                                    padding: '2px 9px',
                                    borderRadius: '10px',
                                    fontSize: '11px',
                                    fontWeight: '700'
                                  }}>
                                    {c.isDirect ? 'Direct' : 'Transitive'}
                                  </span>
                                </td>
                                <td style={{ padding: '9px 14px', color: '#64748b', textAlign: 'center' }}>{c.depth}</td>
                                <td style={{ padding: '9px 14px', fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {c.purl || '—'}
                                </td>
                                <td style={{ padding: '9px 14px', color: '#64748b', fontSize: '12px' }}>
                                  {c.licenses.length > 0 ? c.licenses.join(', ') : '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}

                  {/* ── Vulnerabilities tab ── */}
                  {tab === 'vulnerabilities' && (
                    <div style={{ overflowX: 'auto' }}>
                      {!risk || !risk.affectedComponents || risk.affectedComponents.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '14px' }}>
                          No vulnerabilities found. Upload an SBOM to run vulnerability matching.
                        </div>
                      ) : (
                        <table style={{ width: '100%', fontSize: '13px' }}>
                          <thead>
                            <tr style={{ background: '#f8fafc' }}>
                              {['#', 'CVE ID', 'Affected Component', 'Severity', 'Exposure Type'].map(h => (
                                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#475569', fontWeight: '600', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {filteredVulns.map((v, i) => (
                              <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '9px 14px', color: '#94a3b8', fontSize: '12px' }}>{i + 1}</td>
                                <td style={{ padding: '9px 14px', fontFamily: 'monospace', color: '#7c3aed', fontWeight: '600', fontSize: '12px' }}>{v.cveId}</td>
                                <td style={{ padding: '9px 14px', color: '#1e293b', fontWeight: '500' }}>{v.componentName}</td>
                                <td style={{ padding: '9px 14px' }}><RiskBadge level={v.severity} /></td>
                                <td style={{ padding: '9px 14px' }}>
                                  <span style={{
                                    background: v.isDirect ? '#fee2e2' : '#fef9c3',
                                    color: v.isDirect ? '#991b1b' : '#92400e',
                                    padding: '2px 9px',
                                    borderRadius: '10px',
                                    fontSize: '11px',
                                    fontWeight: '700'
                                  }}>
                                    {v.isDirect ? '⚡ Direct' : '↪ Transitive'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}

                  {/* ── Dependencies tab ── */}
                  {tab === 'dependencies' && (
                    <div style={{ padding: '22px' }}>
                      {components.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '14px' }}>
                          Upload an SBOM to see dependency breakdown.
                        </div>
                      ) : (
                        <>
                          {/* Summary stats */}
                          <div style={{ display: 'flex', gap: '14px', marginBottom: '24px' }}>
                            <div style={{ background: '#eff6ff', borderRadius: '10px', padding: '14px 20px', textAlign: 'center', flex: 1 }}>
                              <div style={{ fontWeight: '800', fontSize: '28px', color: '#1d4ed8' }}>{directComps.length}</div>
                              <div style={{ fontSize: '12px', color: '#3b82f6', fontWeight: '600', marginTop: '2px' }}>Direct Dependencies</div>
                              <div style={{ fontSize: '11px', color: '#93c5fd', marginTop: '2px' }}>depth = 0 · weight = 1.0</div>
                            </div>
                            <div style={{ background: '#fefce8', borderRadius: '10px', padding: '14px 20px', textAlign: 'center', flex: 1 }}>
                              <div style={{ fontWeight: '800', fontSize: '28px', color: '#92400e' }}>{transitiveComps.length}</div>
                              <div style={{ fontSize: '12px', color: '#d97706', fontWeight: '600', marginTop: '2px' }}>Transitive Dependencies</div>
                              <div style={{ fontSize: '11px', color: '#fcd34d', marginTop: '2px' }}>depth ≥ 1 · weight = 0.5 / 0.25</div>
                            </div>
                            <div style={{ background: '#f0fdf4', borderRadius: '10px', padding: '14px 20px', textAlign: 'center', flex: 1 }}>
                              <div style={{ fontWeight: '800', fontSize: '28px', color: '#166534' }}>{components.length}</div>
                              <div style={{ fontSize: '12px', color: '#22c55e', fontWeight: '600', marginTop: '2px' }}>Total Components</div>
                              <div style={{ fontSize: '11px', color: '#86efac', marginTop: '2px' }}>across all levels</div>
                            </div>
                          </div>

                          {/* Direct */}
                          <div style={{ marginBottom: '20px' }}>
                            <div style={{ fontWeight: '700', fontSize: '13px', color: '#1d4ed8', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              Direct Dependencies ({directComps.length})
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                              {directComps.map(c => (
                                <span key={c._id} style={{
                                  background: '#dbeafe',
                                  color: '#1d4ed8',
                                  padding: '5px 12px',
                                  borderRadius: '20px',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  border: '1px solid #bfdbfe'
                                }}>
                                  {c.name}@{c.version}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Transitive */}
                          <div>
                            <div style={{ fontWeight: '700', fontSize: '13px', color: '#92400e', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              Transitive Dependencies ({transitiveComps.length})
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                              {transitiveComps.map(c => (
                                <span key={c._id} style={{
                                  background: '#fef9c3',
                                  color: '#92400e',
                                  padding: '5px 12px',
                                  borderRadius: '20px',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  border: '1px solid #fde68a'
                                }}>
                                  {c.name}@{c.version} <span style={{ opacity: 0.6 }}>depth {c.depth}</span>
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Risk weight note */}
                          <div style={{
                            marginTop: '24px',
                            padding: '14px 18px',
                            background: '#f8fafc',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            fontSize: '12px',
                            color: '#64748b',
                            lineHeight: '1.6'
                          }}>
                            <strong style={{ color: '#1e293b' }}>Risk Weight Model:</strong> Direct dependencies (depth 0) have weight <strong>1.0</strong>.
                            Transitive at depth 1 have weight <strong>0.5</strong>. Deeper transitive have weight <strong>0.25</strong>.
                            Risk score = min(100, Σ(CVSS × weight) / total components × 10)
                          </div>
                        </>
                      )}
                    </div>
                  )}

                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
