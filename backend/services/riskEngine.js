const semver = require('semver');
const Component      = require('../models/Component');
const RiskAssessment = require('../models/RiskAssessment');
const Project        = require('../models/Project');
const Benchmark      = require('../models/Benchmark');
const sampleVulns    = require('../data/sampleVulnerabilities');
const { batchQueryOSV } = require('./osvService');

// ── Depth weight ──────────────────────────────────────────────────────────────
function depthWeight(isDirect, depth) {
  if (isDirect)   return 1.0;
  if (depth <= 1) return 0.5;
  return 0.25;
}

// ── Risk level classification ─────────────────────────────────────────────────
function getRiskLevel(score) {
  if (score >= 76) return 'CRITICAL';
  if (score >= 51) return 'HIGH';
  if (score >= 26) return 'MEDIUM';
  return 'LOW';
}

// ── Semantic version range matching ──────────────────────────────────────────
function matchesVersionRange(version, vuln) {
  const cleanVersion = semver.valid(semver.coerce(version));

  // 1. Exact match in affectedVersions array
  if (vuln.affectedVersions && vuln.affectedVersions.includes(version)) return true;

  // 2. Semver range matching using versionRanges [{introduced, fixed}]
  if (vuln.versionRanges && cleanVersion) {
    for (const range of vuln.versionRanges) {
      try {
        const introduced = range.introduced
          ? semver.valid(semver.coerce(range.introduced))
          : '0.0.0';
        const fixed = range.fixed
          ? semver.valid(semver.coerce(range.fixed))
          : null;

        if (introduced && semver.gte(cleanVersion, introduced)) {
          if (!fixed) return true;                        // no fix yet
          if (semver.lt(cleanVersion, fixed)) return true; // before fix
        }
      } catch { /* invalid semver — skip range */ }
    }
  }

  return false;
}

// ── Match component against local vulnerability dataset ───────────────────────
function matchLocal(component) {
  return sampleVulns
    .filter(v =>
      v.packageName.toLowerCase() === component.name.toLowerCase() &&
      matchesVersionRange(component.version, v)
    )
    .map(v => ({
      cveId:       v.cveId,
      severity:    v.severity,
      cvssScore:   v.cvssScore,
      description: v.description,
      fixedIn:     v.versionRanges?.[0]?.fixed || null,
      source:      v.source
    }));
}

// ── Main risk calculation ─────────────────────────────────────────────────────
async function calculateRisk(projectId, useOSV = false) {
  const startTime  = Date.now();
  const components = await Component.find({ projectId });

  if (components.length === 0) {
    return { riskScore: 0, riskLevel: 'LOW', message: 'No components found' };
  }

  // Optionally fetch live vulnerabilities from OSV
  let osvResults = {};
  if (useOSV) {
    try {
      osvResults = await batchQueryOSV(components);
    } catch (err) {
      console.warn('OSV lookup failed, falling back to local data:', err.message);
    }
  }

  let totalRisk = 0;
  let directVulnCount = 0, transitiveVulnCount = 0;
  let criticalCount = 0, highCount = 0, mediumCount = 0, lowCount = 0;
  let vulnerableComponentSet = new Set();
  const affectedComponents = [];

  for (const comp of components) {
    // Merge local + OSV matches (deduplicated by CVE ID)
    const localMatches = matchLocal(comp);
    const key          = `${comp.name}@${comp.version}`;
    const osvMatches   = osvResults[key] || [];

    // Merge, prefer OSV if same CVE
    const allVulns = [...localMatches];
    for (const ov of osvMatches) {
      if (!allVulns.find(lv => lv.cveId === ov.cveId)) {
        allVulns.push(ov);
      }
    }

    if (allVulns.length > 0) vulnerableComponentSet.add(comp._id.toString());

    for (const vuln of allVulns) {
      const w    = depthWeight(comp.isDirect, comp.depth);
      const cvss = vuln.cvssScore || 5.0;
      totalRisk += cvss * w;

      if (comp.isDirect) directVulnCount++;
      else               transitiveVulnCount++;

      if (vuln.severity === 'CRITICAL')     criticalCount++;
      else if (vuln.severity === 'HIGH')    highCount++;
      else if (vuln.severity === 'MEDIUM')  mediumCount++;
      else                                  lowCount++;

      affectedComponents.push({
        componentName: comp.name,
        version:       comp.version,
        cveId:         vuln.cveId,
        severity:      vuln.severity,
        cvssScore:     vuln.cvssScore || 5.0,
        isDirect:      comp.isDirect,
        depth:         comp.depth,
        fixedIn:       vuln.fixedIn || null
      });
    }
  }

  const rawScore  = (totalRisk / components.length) * 10;
  const riskScore = Math.min(100, Math.round(rawScore * 10) / 10);
  const riskLevel = getRiskLevel(riskScore);

  const assessment = await RiskAssessment.findOneAndUpdate(
    { projectId },
    {
      projectId, calculatedAt: new Date(),
      riskScore, riskLevel,
      directVulnerabilities:     directVulnCount,
      transitiveVulnerabilities: transitiveVulnCount,
      criticalCount, highCount, mediumCount, lowCount,
      totalComponents:        components.length,
      vulnerableComponents:   vulnerableComponentSet.size,
      osvLookupUsed:          useOSV && Object.keys(osvResults).length > 0,
      affectedComponents
    },
    { upsert: true, new: true }
  );

  await Project.findByIdAndUpdate(projectId, {
    riskScore, riskLevel, updatedAt: new Date(),
    osvLookupDone: useOSV
  });

  // Save benchmark
  const durationMs = Date.now() - startTime;
  await Benchmark.create({
    projectId,
    operation:      'riskCalculation',
    componentCount: components.length,
    durationMs,
    endpoint:       '/api/risk/calculate'
  });

  return assessment;
}

module.exports = { calculateRisk, getRiskLevel, matchLocal, matchesVersionRange };
