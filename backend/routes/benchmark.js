const express   = require('express');
const router    = express.Router();
const Benchmark = require('../models/Benchmark');
const Component = require('../models/Component');
const { calculateRisk } = require('../services/riskEngine');

// GET all benchmark records
router.get('/', async (req, res) => {
  try {
    const records = await Benchmark.find().sort({ timestamp: -1 }).limit(200);
    res.json(records);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET benchmark summary stats grouped by componentCount
router.get('/summary', async (req, res) => {
  try {
    const summary = await Benchmark.aggregate([
      { $group: {
        _id:          '$operation',
        avgDurationMs: { $avg: '$durationMs' },
        minDurationMs: { $min: '$durationMs' },
        maxDurationMs: { $max: '$durationMs' },
        count:         { $sum: 1 }
      }}
    ]);
    res.json(summary);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST run a timed risk calculation benchmark for a project
router.post('/run/:projectId', async (req, res) => {
  try {
    const runs    = parseInt(req.query.runs) || 3;
    const results = [];

    for (let i = 0; i < runs; i++) {
      const t0     = Date.now();
      await calculateRisk(req.params.projectId);
      const durationMs = Date.now() - t0;
      results.push({ run: i + 1, durationMs });
    }

    const avg = Math.round(results.reduce((s, r) => s + r.durationMs, 0) / results.length);
    const components = await Component.find({ projectId: req.params.projectId });

    res.json({
      projectId:      req.params.projectId,
      componentCount: components.length,
      runs:           results,
      averageDurationMs: avg
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
