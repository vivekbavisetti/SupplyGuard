const express        = require('express');
const router         = express.Router();
const { calculateRisk } = require('../services/riskEngine');
const RiskAssessment = require('../models/RiskAssessment');

// POST trigger risk calculation (optionally with live OSV lookup)
router.post('/calculate/:projectId', async (req, res) => {
  try {
    const useOSV = req.query.osv === 'true';
    const result = await calculateRisk(req.params.projectId, useOSV);
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET all risk assessments across all projects
router.get('/all', async (req, res) => {
  try {
    const assessments = await RiskAssessment.find()
      .sort({ calculatedAt: -1 })
      .populate('projectId', 'name language');
    res.json(assessments);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
