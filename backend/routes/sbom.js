const express = require('express');
const router = express.Router();
const { parseCycloneDX } = require('../services/sbomParser');
const { calculateRisk } = require('../services/riskEngine');
const Project = require('../models/Project');

// POST upload and parse a CycloneDX SBOM for a project
router.post('/upload/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const sbomData = req.body;

    if (!sbomData || !sbomData.bomFormat) {
      return res.status(400).json({ error: 'Invalid SBOM: missing bomFormat field. Ensure Content-Type is application/json.' });
    }

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    // Step 1: Parse SBOM and store components
    const parseResult = await parseCycloneDX(sbomData, projectId);

    // Step 2: Update project metadata
    await Project.findByIdAndUpdate(projectId, {
      sbomFormat: parseResult.format,
      componentCount: parseResult.componentCount
    });

    // Step 3: Run risk analysis
    const riskResult = await calculateRisk(projectId);

    res.json({
      message: 'SBOM parsed successfully and risk score calculated.',
      sbomFormat: parseResult.format,
      specVersion: parseResult.specVersion,
      componentCount: parseResult.componentCount,
      riskScore: riskResult.riskScore,
      riskLevel: riskResult.riskLevel,
      directVulnerabilities: riskResult.directVulnerabilities,
      transitiveVulnerabilities: riskResult.transitiveVulnerabilities
    });
  } catch (err) {
    console.error('SBOM upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
