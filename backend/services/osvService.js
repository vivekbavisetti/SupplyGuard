const axios = require('axios');

const OSV_API      = process.env.OSV_API_URL  || 'https://api.osv.dev/v1';
const OSV_BATCH    = process.env.OSV_BATCH_URL || 'https://api.osv.dev/v1/querybatch';
const BATCH_SIZE   = 20; // OSV allows up to 1000 but we batch by 20 to be safe
const TIMEOUT_MS   = 12000;

// Map purl ecosystem to OSV ecosystem name
function purlToOSVEcosystem(purl = '', ecosystem = '') {
  if (purl.startsWith('pkg:maven')  || ecosystem === 'Maven')   return 'Maven';
  if (purl.startsWith('pkg:npm')    || ecosystem === 'npm')     return 'npm';
  if (purl.startsWith('pkg:pypi')   || ecosystem === 'PyPI')    return 'PyPI';
  if (purl.startsWith('pkg:cargo')  || ecosystem === 'crates.io') return 'crates.io';
  if (purl.startsWith('pkg:gem')    || ecosystem === 'RubyGems') return 'RubyGems';
  if (purl.startsWith('pkg:golang') || ecosystem === 'Go')      return 'Go';
  if (purl.startsWith('pkg:nuget')  || ecosystem === 'NuGet')   return 'NuGet';
  return null;
}

// Convert OSV severity to our enum
function toSeverity(cvssScore) {
  if (!cvssScore) return 'MEDIUM';
  if (cvssScore >= 9.0) return 'CRITICAL';
  if (cvssScore >= 7.0) return 'HIGH';
  if (cvssScore >= 4.0) return 'MEDIUM';
  return 'LOW';
}

// Extract CVSS score from OSV severity array
function extractCVSS(severities = []) {
  for (const s of severities) {
    if (s.type === 'CVSS_V3' && s.score) {
      // score is a vector string like CVSS:3.1/AV:N/...
      // OSV also provides the base score numerically in some records
      if (typeof s.score === 'number') return s.score;
    }
  }
  // Try database_specific scores
  return null;
}

// Extract numeric base score from OSV record
function extractBaseScore(vuln) {
  // Try severity array first
  if (vuln.severity) {
    for (const s of vuln.severity) {
      if (s.score && typeof s.score === 'number') return s.score;
    }
  }
  // Try database_specific.severity (NVD style)
  if (vuln.database_specific?.severity) {
    const map = { LOW: 2.5, MEDIUM: 5.5, HIGH: 8.0, CRITICAL: 9.5 };
    return map[vuln.database_specific.severity] || 5.0;
  }
  return 5.0; // fallback
}

// Query OSV for a single package
async function queryOSV(packageName, version, ecosystem) {
  try {
    const body = {
      version,
      package: { name: packageName, ecosystem }
    };
    const res = await axios.post(`${OSV_API}/query`, body, {
      timeout: TIMEOUT_MS,
      headers: { 'Content-Type': 'application/json' }
    });
    return res.data.vulns || [];
  } catch {
    return [];
  }
}

// Batch query OSV for multiple components at once
async function batchQueryOSV(components) {
  const results = {};

  // Split into batches
  for (let i = 0; i < components.length; i += BATCH_SIZE) {
    const batch = components.slice(i, i + BATCH_SIZE);

    const queries = batch.map(comp => {
      const eco = purlToOSVEcosystem(comp.purl, comp.ecosystem);
      if (!eco) return null;
      return {
        version: comp.version,
        package: { name: comp.name, ecosystem: eco }
      };
    }).filter(Boolean);

    if (queries.length === 0) continue;

    try {
      const res = await axios.post(OSV_BATCH, { queries }, {
        timeout: TIMEOUT_MS,
        headers: { 'Content-Type': 'application/json' }
      });

      const batchResults = res.data.results || [];
      batchResults.forEach((result, idx) => {
        const comp = batch[idx];
        const key  = `${comp.name}@${comp.version}`;
        results[key] = (result.vulns || []).map(v => ({
          cveId:       v.id || v.aliases?.[0] || 'UNKNOWN',
          aliases:     v.aliases || [],
          severity:    v.database_specific?.severity
                         ? v.database_specific.severity
                         : toSeverity(extractBaseScore(v)),
          cvssScore:   extractBaseScore(v),
          description: v.summary || v.details || 'No description available',
          fixedIn:     extractFixedVersion(v, comp.version),
          source:      'OSV'
        }));
      });
    } catch (err) {
      // OSV batch failed — skip this batch silently
      console.warn(`OSV batch query failed: ${err.message}`);
    }
  }

  return results;
}

// Extract the fixed version for a component's version from OSV affected ranges
function extractFixedVersion(vuln, currentVersion) {
  try {
    for (const affected of (vuln.affected || [])) {
      for (const range of (affected.ranges || [])) {
        if (range.type === 'SEMVER' || range.type === 'ECOSYSTEM') {
          for (const event of (range.events || [])) {
            if (event.fixed) return event.fixed;
          }
        }
      }
    }
  } catch { /* ignore */ }
  return null;
}

module.exports = { batchQueryOSV, queryOSV, purlToOSVEcosystem };
