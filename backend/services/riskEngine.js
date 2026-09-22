const Component = require('../models/Component');
const RiskAssessment = require('../models/RiskAssessment');
const Project = require('../models/Project');
const sampleVulnerabilities = require('../data/sampleVulnerabilities');

// Depth weight: direct = 1.0, transitive depth 1 = 0.5, deeper = 0.25
function getDepthWeight(isDirect, depth) {
  if (isDirect) return 1.0;
  if (depth <= 1) return 0.5;
  return 0.25;
}

function getRiskLevel(score) {
  if (score >= 76) return 'CRITICAL';
  if (score >= 51) return 'HIGH';
  if (score >= 26) return 'MEDIUM';
  return 'LOW';
}

async function calculateRisk(projectId) {
  const components = await Component.find({ projectId });

  if (components.length === 0) {
    return { riskScore: 0, riskLevel: 'LOW', message: 'No components found' };
  }

  let totalRisk = 0;
  let directVulnCount = 0;
  let transitiveVulnCount = 0;
  let criticalCount = 0, highCount = 0, mediumCount = 0, lowCount = 0;
  const affectedComponents = [];

  for (const component of components) {
    // Match against sample vulnerability database (name + version)
    const matches = sampleVulnerabilities.filter(v =>
      v.packageName.toLowerCase() === component.name.toLowerCase() &&
      (v.affectedVersions.includes(component.version) || v.affectedVersions.length === 0)
    );

    for (const vuln of matches) {
      const weight = getDepthWeight(component.isDirect, component.depth);
      const contribution = vuln.cvssScore * weight;
      totalRisk += contribution;

      if (component.isDirect) directVulnCount++;
      else transitiveVulnCount++;

      if (vuln.severity === 'CRITICAL') criticalCount++;
      else if (vuln.severity === 'HIGH') highCount++;
      else if (vuln.severity === 'MEDIUM') mediumCount++;
      else lowCount++;

      affectedComponents.push({
        componentName: component.name,
        cveId: vuln.cveId,
        severity: vuln.severity,
        isDirect: component.isDirect
      });
    }
  }

  // Normalize to 0-100
  const rawScore = (totalRisk / components.length) * 10;
  const riskScore = Math.min(100, Math.round(rawScore * 10) / 10);
  const riskLevel = getRiskLevel(riskScore);

  // Upsert risk assessment in MongoDB
  const assessment = await RiskAssessment.findOneAndUpdate(
    { projectId },
    {
      projectId,
      calculatedAt: new Date(),
      riskScore,
      riskLevel,
      directVulnerabilities: directVulnCount,
      transitiveVulnerabilities: transitiveVulnCount,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      affectedComponents
    },
    { upsert: true, new: true }
  );

  // Update project record with latest risk
  await Project.findByIdAndUpdate(projectId, { riskScore, riskLevel });

  return assessment;
}

module.exports = { calculateRisk };
