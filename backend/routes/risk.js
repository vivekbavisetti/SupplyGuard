const express = require('express');
const router = express.Router();
const { calculateRisk } = require('../services/riskEngine');
const RiskAssessment = require('../models/RiskAssessment');

// POST manually trigger risk recalculation for a project
router.post('/calculate/:projectId', async (req, res) => {
  try {
    const result = await calculateRisk(req.params.projectId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all risk assessments across all projects
router.get('/all', async (req, res) => {
  try {
    const assessments = await RiskAssessment.find().sort({ calculatedAt: -1 });
    res.json(assessments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
