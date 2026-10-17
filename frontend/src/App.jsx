import { useState, useEffect, useRef } from 'react';
import {
  getProjects, createProject, deleteProject,
  getComponents, getRisk, getGraph, getComparison,
  uploadSBOM, uploadSBOMFile, calcRisk
} from './api';
import DependencyGraph from './components/DependencyGraph.jsx';
import ComparisonView  from './components/ComparisonView.jsx';
import BenchmarkView   from './components/BenchmarkView.jsx';

// ── constants ─────────────────────────────────────────────────────────────────
const RC = { LOW:'#22c55e', MEDIUM:'#f59e0b', HIGH:'#f97316', CRITICAL:'#ef4444', Unknown:'#6b7280' };

const SAMPLE_SBOM = {
  bomFormat:'CycloneDX', specVersion:'1.4',
  serialNumber:'urn:uuid:supplyguard-demo-001', version:1,
  metadata:{ timestamp:'2024-01-15T10:00:00Z', component:{ type:'application', name:'sample-java-app', version:'1.0.0' } },
  components:[
    { type:'library', name:'log4j-core',      version:'2.14',    purl:'pkg:maven/org.apache.logging.log4j/log4j-core@2.14',    'bom-ref':'log4j-core-2.14' },
    { type:'library', name:'commons-text',    version:'1.9',     purl:'pkg:maven/org.apache.commons/commons-text@1.9',         'bom-ref':'commons-text-1.9' },
    { type:'library', name:'snakeyaml',       version:'1.30',    purl:'pkg:maven/org.yaml/snakeyaml@1.30',                    'bom-ref':'snakeyaml-1.30' },
    { type:'library', name:'spring-boot',     version:'3.0.5',   purl:'pkg:maven/org.springframework.boot/spring-boot@3.0.5', 'bom-ref':'spring-boot-3.0.5' },
    { type:'library', name:'logback-classic', version:'1.2.11',  purl:'pkg:maven/ch.qos.logback/logback-classic@1.2.11',      'bom-ref':'logback-classic-1.2.11' },
    { type:'library', name:'woodstox-core',   version:'6.4.0',   purl:'pkg:maven/com.fasterxml.woodstox/woodstox-core@6.4.0', 'bom-ref':'woodstox-core-6.4.0' },
    { type:'library', name:'xstream',         version:'1.4.15',  purl:'pkg:maven/com.thoughtworks.xstream/xstream@1.4.15',    'bom-ref':'xstream-1.4.15' },
    { type:'library', name:'jackson-databind',version:'2.15.0',  purl:'pkg:maven/com.fasterxml.jackson.core/jackson-databind@2.15.0','bom-ref':'jackson-databind-2.15.0' },
    { type:'library', name:'guava',           version:'31.1-jre', purl:'pkg:maven/com.google.guava/guava@31.1-jre',           'bom-ref':'guava-31.1' },
    { type:'library', name:'slf4j-api',       version:'2.0.7',   purl:'pkg:maven/org.slf4j/slf4j-api@2.0.7',                 'bom-ref':'slf4j-api-2.0.7' }
  ],
  dependencies:[
    { ref:'sample-java-app@1.0.0',    dependsOn:['log4j-core-2.14','commons-text-1.9','spring-boot-3.0.5','jackson-databind-2.15.0'] },
    { ref:'log4j-core-2.14',          dependsOn:['slf4j-api-2.0.7'] },
    { ref:'spring-boot-3.0.5',        dependsOn:['snakeyaml-1.30','logback-classic-1.2.11'] },
    { ref:'logback-classic-1.2.11',   dependsOn:['woodstox-core-6.4.0'] },
    { ref:'commons-text-1.9',         dependsOn:['xstream-1.4.15'] },
    { ref:'jackson-databind-2.15.0',  dependsOn:['guava-31.1'] }
  ]
};

// ── small helpers ─────────────────────────────────────────────────────────────
function RiskBadge({ level }) {
  return <span style={{ background: RC[level]||'#6b7280', color:'#fff', padding:'2px 10px', borderRadius:12, fontSize:11, fontWeight:700 }}>{level}</span>;
}

function StatCard({ label, value, color }) {
  return (
    <div style={{ background:'#fff', borderRadius:10, padding:'16px 14px', border:'1px solid #e2e8f0', textAlign:'center', flex:1, minWidth:100 }}>
      <div style={{ fontSize:24, fontWeight:800, color:color||'#1e293b' }}>{value}</div>
      <div style={{ fontSize:11, color:'#64748b', marginTop:3, fontWeight:500 }}>{label}</div>
    </div>
  );
}

function SeverityBar({ label, count, color }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
      <span style={{ width:72, fontSize:12, color:'#64748b', fontWeight:600 }}>{label}</span>
      <div style={{ flex:1, background:'#f1f5f9', borderRadius:4, height:16, overflow:'hidden' }}>
        <div style={{ width:count>0?`${Math.max(Math.min(count*12,100),6)}%`:'0%', background:color, height:'100%', borderRadius:4, transition:'width .4s' }} />
      </div>
      <span style={{ fontSize:13, fontWeight:700, width:20 }}>{count}</span>
    </div>
  );
}

const TABS = ['components','vulnerabilities','graph','dependencies','comparison','benchmark'];

// ── main app ──────────────────────────────────────────────────────────────────
export default function App() {
  const [projects,    setProjects]    = useState([]);
  const [selected,    setSelected]    = useState(null);
  const [components,  setComponents]  = useState([]);
  const [risk,        setRisk]        = useState(null);
  const [graphData,   setGraphData]   = useState({ nodes:[], links:[] });
  const [comparison,  setComparison]  = useState([]);
  const [newP,        setNewP]        = useState({ name:'', description:'', language:'Java' });
  const [tab,         setTab]         = useState('components');
  const [loading,     setLoading]     = useState(false);
  const [msg,         setMsg]         = useState('');
  const [search,      setSearch]      = useState('');
  const [useOSV,      setUseOSV]      = useState(false);
  const [dragging,    setDragging]    = useState(false);
  const fileRef = useRef(null);

  useEffect(() => { loadProjects(); }, []);

  async function loadProjects() {
    try { const r = await getProjects(); setProjects(r.data); } catch {}
  }

  async function selectProject(p) {
    setSelected(p); setComponents([]); setRisk(null);
    setGraphData({ nodes:[], links:[] }); setMsg(''); setSearch('');
    const [c, r] = await Promise.allSettled([getComponents(p._id), getRisk(p._id)]);
    if (c.status==='fulfilled') setComponents(c.value.data);
    if (r.status==='fulfilled') setRisk(r.value.data);
  }

  async function loadGraph(id) {
    try { const r = await getGraph(id); setGraphData(r.data); } catch {}
  }

  async function loadComparison() {
    try { const r = await getComparison(); setComparison(r.data); } catch {}
  }

  function handleTabChange(t) {
    setTab(t); setSearch('');
    if (t === 'graph' && selected) loadGraph(selected._id);
    if (t === 'comparison')        loadComparison();
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!newP.name.trim()) return;
    await createProject(newP);
    setNewP({ name:'', description:'', language:'Java' });
    loadProjects();
  }

  async function handleDelete(id, e) {
    e.stopPropagation();
    if (!window.confirm('Delete this project and all its data?')) return;
    await deleteProject(id);
    if (selected?._id === id) { setSelected(null); setComponents([]); setRisk(null); }
    loadProjects();
  }

  async function handleSampleSBOM() {
    if (!selected) return;
    setLoading(true); setMsg('');
    try {
      const r = await uploadSBOM(selected._id, SAMPLE_SBOM, useOSV);
      setMsg(`✅ ${r.data.sbomFormat} parsed · ${r.data.componentCount} components · Risk: ${r.data.riskLevel} (${r.data.riskScore}/100)${r.data.osvLookupUsed ? ' · OSV live data used' : ' · local data used'}`);
      await selectProject(selected); loadProjects();
    } catch (err) { setMsg('❌ ' + (err.response?.data?.error || err.message)); }
    setLoading(false);
  }

  // File drop / file picker upload
  async function handleFile(file) {
    if (!selected || !file) return;
    setLoading(true); setMsg('');
    const form = new FormData();
    form.append('sbom', file);
    try {
      const r = await uploadSBOMFile(selected._id, form, useOSV);
      setMsg(`✅ ${r.data.filename} (${r.data.sbomFormat}) · ${r.data.componentCount} components · Risk: ${r.data.riskLevel}`);
      await selectProject(selected); loadProjects();
    } catch (err) { setMsg('❌ ' + (err.response?.data?.error || err.message)); }
    setLoading(false);
  }

  function onDrop(e) {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  const directC     = components.filter(c =>  c.isDirect);
  const transitiveC = components.filter(c => !c.isDirect);
  const filteredC   = components.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || (c.version||'').toLowerCase().includes(search.toLowerCase()));
  const filteredV   = (risk?.affectedComponents||[]).filter(v => v.componentName.toLowerCase().includes(search.toLowerCase()) || v.cveId.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ fontFamily:'Inter,sans-serif', minHeight:'100vh', background:'#f8fafc' }}>

      {/* ── Header ── */}
      <div style={{ background:'#0f172a', color:'#fff', padding:'13px 28px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:24 }}>🛡️</span>
          <div>
            <div style={{ fontWeight:800, fontSize:17, letterSpacing:'-0.3px' }}>SupplyGuard</div>
            <div style={{ fontSize:10, opacity:.5 }}>NoSQL-Based Software Supply Chain Risk Analysis · BCSE406L</div>
          </div>
        </div>
        <div style={{ fontSize:10, opacity:.4 }}>Bavisetti Vivek 24BCE1104 · Kaustubh Prasad Nair 24BCE1076</div>
      </div>

      <div style={{ display:'flex', minHeight:'calc(100vh - 53px)' }}>

        {/* ── Sidebar ── */}
        <div style={{ width:280, minWidth:280, background:'#fff', borderRight:'1px solid #e2e8f0', display:'flex', flexDirection:'column' }}>
          <div style={{ padding:'14px 14px 10px', borderBottom:'1px solid #e2e8f0' }}>
            <div style={{ fontWeight:700, fontSize:11, color:'#475569', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:10 }}>Projects</div>
            <form onSubmit={handleCreate}>
              <input placeholder="Project name *" value={newP.name} onChange={e => setNewP({...newP,name:e.target.value})}
                style={{ width:'100%', padding:'7px 9px', border:'1px solid #e2e8f0', borderRadius:6, marginBottom:5, fontSize:12, boxSizing:'border-box' }} />
              <input placeholder="Description" value={newP.description} onChange={e => setNewP({...newP,description:e.target.value})}
                style={{ width:'100%', padding:'7px 9px', border:'1px solid #e2e8f0', borderRadius:6, marginBottom:5, fontSize:12, boxSizing:'border-box' }} />
              <select value={newP.language} onChange={e => setNewP({...newP,language:e.target.value})}
                style={{ width:'100%', padding:'7px 9px', border:'1px solid #e2e8f0', borderRadius:6, marginBottom:8, fontSize:12, boxSizing:'border-box' }}>
                {['Java','JavaScript','Python','Go','Rust'].map(l => <option key={l}>{l}</option>)}
              </select>
              <button type="submit" style={{ width:'100%', padding:8, background:'#3b82f6', color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontWeight:700, fontSize:12 }}>
                + Create Project
              </button>
            </form>
          </div>
          <div style={{ flex:1, overflowY:'auto', padding:8 }}>
            {projects.length === 0 && <div style={{ color:'#94a3b8', fontSize:12, padding:'18px 8px', textAlign:'center' }}>No projects yet.</div>}
            {projects.map(p => (
              <div key={p._id} onClick={() => selectProject(p)}
                style={{ padding:'9px 11px', borderRadius:8, marginBottom:3, cursor:'pointer',
                  background: selected?._id===p._id ? '#eff6ff' : 'transparent',
                  border: selected?._id===p._id ? '1px solid #bfdbfe' : '1px solid transparent' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:600, fontSize:12, color:'#1e293b', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</div>
                    <div style={{ fontSize:10, color:'#94a3b8', marginTop:2 }}>{p.language} · {p.componentCount||0} components</div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:4, marginLeft:6 }}>
                    <RiskBadge level={p.riskLevel||'Unknown'} />
                    <button onClick={e => handleDelete(p._id,e)}
                      style={{ background:'none', border:'none', cursor:'pointer', color:'#cbd5e1', fontSize:17, lineHeight:1, padding:'0 1px' }} title="Delete">×</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Main ── */}
        <div style={{ flex:1, padding:20, overflowY:'auto' }}>
          {!selected ? (
            <div style={{ textAlign:'center', marginTop:90, color:'#94a3b8' }}>
              <div style={{ fontSize:52, marginBottom:14 }}>🛡️</div>
              <div style={{ fontSize:20, fontWeight:700, color:'#475569' }}>Welcome to SupplyGuard v2.0</div>
              <div style={{ fontSize:13, marginTop:8, lineHeight:1.7 }}>
                Create a project → Upload an SBOM → Analyse risk<br/>
                Supports <strong>CycloneDX 1.4</strong> and <strong>SPDX 2.3</strong> (JSON / YAML)
              </div>
            </div>
          ) : (
            <>
              {/* Project header */}
              <div style={{ background:'#fff', borderRadius:12, padding:'16px 20px', marginBottom:16, border:'1px solid #e2e8f0', display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
                <div>
                  <div style={{ fontWeight:800, fontSize:18, color:'#0f172a' }}>{selected.name}</div>
                  <div style={{ color:'#64748b', fontSize:12, marginTop:2 }}>
                    {selected.description||'No description'} · {selected.language} · SBOM: {selected.sbomFormat||'Not uploaded'}
                    {selected.osvLookupDone && <span style={{ marginLeft:6, background:'#f0fdf4', color:'#166534', padding:'1px 7px', borderRadius:10, fontSize:10, fontWeight:700 }}>OSV Live</span>}
                  </div>
                </div>
                <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                  {/* OSV toggle */}
                  <label style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'#64748b', cursor:'pointer' }}>
                    <input type="checkbox" checked={useOSV} onChange={e => setUseOSV(e.target.checked)} />
                    Use live OSV API
                  </label>
                  <button onClick={handleSampleSBOM} disabled={loading}
                    style={{ padding:'8px 16px', background:loading?'#94a3b8':'#6366f1', color:'#fff', border:'none', borderRadius:8, cursor:loading?'not-allowed':'pointer', fontWeight:700, fontSize:12 }}>
                    {loading ? '⏳ Parsing…' : '📄 Load Sample SBOM'}
                  </button>
                  <button onClick={() => fileRef.current?.click()} disabled={loading}
                    style={{ padding:'8px 16px', background:'#fff', color:'#374151', border:'1px solid #d1d5db', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:12 }}>
                    📁 Upload File
                  </button>
                  <input ref={fileRef} type="file" accept=".json,.yaml,.yml" style={{ display:'none' }}
                    onChange={e => handleFile(e.target.files[0])} />
                </div>
              </div>

              {/* Drag-and-drop zone */}
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                style={{
                  border: `2px dashed ${dragging ? '#6366f1' : '#e2e8f0'}`,
                  background: dragging ? '#eff6ff' : 'transparent',
                  borderRadius:10, padding:'10px 16px', marginBottom:14,
                  textAlign:'center', fontSize:12, color:'#94a3b8',
                  transition:'all .2s'
                }}>
                {dragging ? '📂 Drop your SBOM file here' : 'Or drag & drop a CycloneDX / SPDX JSON / YAML file here'}
              </div>

              {/* Message */}
              {msg && (
                <div style={{ background: msg.startsWith('✅')?'#f0fdf4':'#fef2f2', border:`1px solid ${msg.startsWith('✅')?'#bbf7d0':'#fecaca'}`, borderRadius:8, padding:'9px 14px', marginBottom:14, fontSize:12, color:msg.startsWith('✅')?'#166534':'#991b1b', fontWeight:500 }}>
                  {msg}
                </div>
              )}

              {/* Risk cards */}
              {risk && (
                <>
                  <div style={{ display:'flex', gap:12, marginBottom:14, flexWrap:'wrap' }}>
                    <StatCard label="Risk Score"        value={`${risk.riskScore}/100`}        color={RC[risk.riskLevel]} />
                    <StatCard label="Risk Level"        value={risk.riskLevel}                  color={RC[risk.riskLevel]} />
                    <StatCard label="Direct Vulns"      value={risk.directVulnerabilities}      color="#f97316" />
                    <StatCard label="Transitive Vulns"  value={risk.transitiveVulnerabilities}  color="#f59e0b" />
                    <StatCard label="Vuln Components"   value={`${risk.vulnerableComponents}/${risk.totalComponents}`} color="#6366f1" />
                  </div>
                  <div style={{ background:'#fff', borderRadius:12, padding:'16px 20px', marginBottom:14, border:'1px solid #e2e8f0' }}>
                    <div style={{ fontWeight:700, fontSize:13, marginBottom:12, color:'#1e293b' }}>Vulnerability Severity Breakdown</div>
                    <SeverityBar label="CRITICAL" count={risk.criticalCount} color="#ef4444" />
                    <SeverityBar label="HIGH"     count={risk.highCount}     color="#f97316" />
                    <SeverityBar label="MEDIUM"   count={risk.mediumCount}   color="#f59e0b" />
                    <SeverityBar label="LOW"      count={risk.lowCount}      color="#22c55e" />
                    <div style={{ fontSize:11, color:'#94a3b8', marginTop:10 }}>
                      {risk.osvLookupUsed ? '🟢 Live OSV API data used for this assessment' : '🟡 Local sample vulnerability data used — enable OSV toggle for live data'}
                    </div>
                  </div>
                </>
              )}

              {/* Tabs */}
              <div style={{ background:'#fff', borderRadius:12, border:'1px solid #e2e8f0' }}>
                <div style={{ display:'flex', borderBottom:'1px solid #e2e8f0', padding:'0 8px', flexWrap:'wrap', alignItems:'center' }}>
                  {TABS.map(t => (
                    <button key={t} onClick={() => handleTabChange(t)}
                      style={{ padding:'11px 16px', border:'none', background:'none', cursor:'pointer',
                        fontWeight: tab===t?700:400, color: tab===t?'#3b82f6':'#64748b',
                        borderBottom: tab===t?'2px solid #3b82f6':'2px solid transparent',
                        fontSize:12, marginBottom:-1, textTransform:'capitalize' }}>
                      {t === 'components'     && `Components (${components.length})`}
                      {t === 'vulnerabilities'&& `Vulnerabilities (${risk?.affectedComponents?.length||0})`}
                      {t === 'graph'          && 'Dependency Graph'}
                      {t === 'dependencies'   && 'Dependencies'}
                      {t === 'comparison'     && 'Comparison'}
                      {t === 'benchmark'      && 'Benchmark'}
                    </button>
                  ))}
                  {(tab==='components'||tab==='vulnerabilities') && (
                    <input placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)}
                      style={{ marginLeft:'auto', padding:'5px 9px', border:'1px solid #e2e8f0', borderRadius:6, fontSize:12, width:150 }} />
                  )}
                </div>

                {/* ── Components ── */}
                {tab==='components' && (
                  <div style={{ overflowX:'auto' }}>
                    {components.length === 0
                      ? <div style={{ textAlign:'center', padding:40, color:'#94a3b8', fontSize:13 }}>No components yet. Load a SBOM above.</div>
                      : (
                        <table style={{ width:'100%', fontSize:12, borderCollapse:'collapse' }}>
                          <thead>
                            <tr style={{ background:'#f8fafc' }}>
                              {['#','Name','Version','Ecosystem','Type','Direct/Trans','Depth','Licenses'].map(h => (
                                <th key={h} style={{ padding:'9px 12px', textAlign:'left', color:'#475569', fontWeight:600, borderBottom:'1px solid #e2e8f0', whiteSpace:'nowrap' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {filteredC.map((c,i) => (
                              <tr key={c._id} style={{ borderBottom:'1px solid #f1f5f9' }}>
                                <td style={{ padding:'8px 12px', color:'#94a3b8' }}>{i+1}</td>
                                <td style={{ padding:'8px 12px', fontWeight:600, color:'#1e293b' }}>{c.name}</td>
                                <td style={{ padding:'8px 12px', fontFamily:'monospace', color:'#475569', fontSize:11 }}>{c.version}</td>
                                <td style={{ padding:'8px 12px', color:'#64748b' }}>{c.ecosystem||'—'}</td>
                                <td style={{ padding:'8px 12px', color:'#64748b' }}>{c.type}</td>
                                <td style={{ padding:'8px 12px' }}>
                                  <span style={{ background:c.isDirect?'#dbeafe':'#fef9c3', color:c.isDirect?'#1d4ed8':'#92400e', padding:'2px 8px', borderRadius:10, fontSize:10, fontWeight:700 }}>
                                    {c.isDirect?'Direct':'Transitive'}
                                  </span>
                                </td>
                                <td style={{ padding:'8px 12px', color:'#64748b', textAlign:'center' }}>{c.depth}</td>
                                <td style={{ padding:'8px 12px', color:'#64748b', fontSize:11 }}>{c.licenses?.join(', ')||'—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                  </div>
                )}

                {/* ── Vulnerabilities ── */}
                {tab==='vulnerabilities' && (
                  <div style={{ overflowX:'auto' }}>
                    {!risk || !risk.affectedComponents?.length
                      ? <div style={{ textAlign:'center', padding:40, color:'#94a3b8', fontSize:13 }}>No vulnerabilities found. Upload an SBOM to run vulnerability matching.</div>
                      : (
                        <table style={{ width:'100%', fontSize:12, borderCollapse:'collapse' }}>
                          <thead>
                            <tr style={{ background:'#f8fafc' }}>
                              {['#','CVE ID','Component','Version','Severity','CVSS','Exposure','Depth','Fixed In'].map(h => (
                                <th key={h} style={{ padding:'9px 12px', textAlign:'left', color:'#475569', fontWeight:600, borderBottom:'1px solid #e2e8f0', whiteSpace:'nowrap' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {filteredV.map((v,i) => (
                              <tr key={i} style={{ borderBottom:'1px solid #f1f5f9' }}>
                                <td style={{ padding:'8px 12px', color:'#94a3b8' }}>{i+1}</td>
                                <td style={{ padding:'8px 12px', fontFamily:'monospace', color:'#7c3aed', fontWeight:700, fontSize:11 }}>{v.cveId}</td>
                                <td style={{ padding:'8px 12px', fontWeight:600, color:'#1e293b' }}>{v.componentName}</td>
                                <td style={{ padding:'8px 12px', fontFamily:'monospace', color:'#475569', fontSize:11 }}>{v.version}</td>
                                <td style={{ padding:'8px 12px' }}><RiskBadge level={v.severity} /></td>
                                <td style={{ padding:'8px 12px', fontWeight:700, color:RC[v.severity]||'#1e293b' }}>{v.cvssScore?.toFixed(1)||'—'}</td>
                                <td style={{ padding:'8px 12px' }}>
                                  <span style={{ background:v.isDirect?'#fee2e2':'#fef9c3', color:v.isDirect?'#991b1b':'#92400e', padding:'2px 8px', borderRadius:10, fontSize:10, fontWeight:700 }}>
                                    {v.isDirect?'⚡ Direct':'↪ Transitive'}
                                  </span>
                                </td>
                                <td style={{ padding:'8px 12px', color:'#64748b', textAlign:'center' }}>{v.depth}</td>
                                <td style={{ padding:'8px 12px', color:'#22c55e', fontFamily:'monospace', fontSize:11 }}>{v.fixedIn||'—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                  </div>
                )}

                {/* ── Graph ── */}
                {tab==='graph' && (
                  graphData.nodes.length === 0
                    ? <div style={{ textAlign:'center', padding:40, color:'#94a3b8', fontSize:13 }}>
                        Click the <strong>Dependency Graph</strong> tab after loading an SBOM to visualise the full dependency tree.
                        <br/><button onClick={() => loadGraph(selected._id)} style={{ marginTop:12, padding:'7px 16px', background:'#6366f1', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:600 }}>Load Graph</button>
                      </div>
                    : <DependencyGraph nodes={graphData.nodes} links={graphData.links} />
                )}

                {/* ── Dependencies tab ── */}
                {tab==='dependencies' && (
                  <div style={{ padding:20 }}>
                    {components.length === 0
                      ? <div style={{ textAlign:'center', padding:40, color:'#94a3b8', fontSize:13 }}>Upload an SBOM to see dependency breakdown.</div>
                      : (
                        <>
                          <div style={{ display:'flex', gap:14, marginBottom:20, flexWrap:'wrap' }}>
                            {[
                              { bg:'#eff6ff', n:directC.length,     label:'Direct',     sub:'weight = 1.0', c:'#1d4ed8' },
                              { bg:'#fefce8', n:transitiveC.length,  label:'Transitive',  sub:'weight = 0.5–0.25', c:'#92400e' },
                              { bg:'#f0fdf4', n:components.length,   label:'Total',       sub:'all levels', c:'#166534' },
                            ].map(s => (
                              <div key={s.label} style={{ background:s.bg, borderRadius:10, padding:'12px 18px', textAlign:'center', flex:1, minWidth:120 }}>
                                <div style={{ fontWeight:800, fontSize:26, color:s.c }}>{s.n}</div>
                                <div style={{ fontSize:12, fontWeight:600, color:s.c, marginTop:2 }}>{s.label} Dependencies</div>
                                <div style={{ fontSize:10, color:'#94a3b8', marginTop:2 }}>{s.sub}</div>
                              </div>
                            ))}
                          </div>
                          <div style={{ fontWeight:700, fontSize:12, color:'#1d4ed8', marginBottom:8, textTransform:'uppercase', letterSpacing:'.5px' }}>Direct ({directC.length})</div>
                          <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:18 }}>
                            {directC.map(c => (
                              <span key={c._id} style={{ background:'#dbeafe', color:'#1d4ed8', padding:'4px 11px', borderRadius:20, fontSize:11, fontWeight:700, border:'1px solid #bfdbfe' }}>
                                {c.name}@{c.version}
                              </span>
                            ))}
                          </div>
                          <div style={{ fontWeight:700, fontSize:12, color:'#92400e', marginBottom:8, textTransform:'uppercase', letterSpacing:'.5px' }}>Transitive ({transitiveC.length})</div>
                          <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:18 }}>
                            {transitiveC.map(c => (
                              <span key={c._id} style={{ background:'#fef9c3', color:'#92400e', padding:'4px 11px', borderRadius:20, fontSize:11, fontWeight:700, border:'1px solid #fde68a' }}>
                                {c.name}@{c.version} <span style={{ opacity:.6 }}>d{c.depth}</span>
                              </span>
                            ))}
                          </div>
                          <div style={{ background:'#f8fafc', borderRadius:8, border:'1px solid #e2e8f0', padding:'12px 16px', fontSize:12, color:'#64748b', lineHeight:1.6 }}>
                            <strong style={{ color:'#1e293b' }}>Risk Weight Model: </strong>
                            Direct (depth 0) → weight <strong>1.0</strong> · Transitive depth 1 → weight <strong>0.5</strong> · Depth ≥ 2 → weight <strong>0.25</strong><br/>
                            riskScore = min(100, Σ(CVSS × weight) / totalComponents × 10)
                          </div>
                        </>
                      )}
                  </div>
                )}

                {/* ── Comparison ── */}
                {tab==='comparison' && <ComparisonView data={comparison} />}

                {/* ── Benchmark ── */}
                {tab==='benchmark' && (
                  <BenchmarkView projectId={selected?._id} componentCount={components.length} />
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
