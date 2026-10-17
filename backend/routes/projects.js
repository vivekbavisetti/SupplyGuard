const express    = require('express');
const router     = express.Router();
const Project    = require('../models/Project');
const Component  = require('../models/Component');
const RiskAssessment = require('../models/RiskAssessment');
const Benchmark  = require('../models/Benchmark');

// GET all projects
router.get('/', async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET single project
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST create project
router.post('/', async (req, res) => {
  try {
    const { name, description, language } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    const project = new Project({ name, description, language });
    await project.save();
    res.status(201).json(project);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// PUT update project metadata
router.put('/:id', async (req, res) => {
  try {
    const { name, description, language } = req.body;
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { name, description, language, updatedAt: new Date() },
      { new: true }
    );
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE project and all related data
router.delete('/:id', async (req, res) => {
  try {
    await Project.findByIdAndDelete(req.params.id);
    await Component.deleteMany({ projectId: req.params.id });
    await RiskAssessment.deleteMany({ projectId: req.params.id });
    await Benchmark.deleteMany({ projectId: req.params.id });
    res.json({ message: 'Project and all associated data deleted.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET components for a project
router.get('/:id/components', async (req, res) => {
  try {
    const start = Date.now();
    const components = await Component.find({ projectId: req.params.id });
    const durationMs = Date.now() - start;

    // Save benchmark
    await Benchmark.create({
      projectId:      req.params.id,
      operation:      'componentQuery',
      componentCount: components.length,
      durationMs,
      endpoint:       '/api/projects/:id/components'
    });

    res.json(components);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET latest risk assessment
router.get('/:id/risk', async (req, res) => {
  try {
    const assessment = await RiskAssessment.findOne({ projectId: req.params.id })
      .sort({ calculatedAt: -1 });
    if (!assessment) return res.status(404).json({
      error: 'No risk assessment found. Upload an SBOM first.'
    });
    res.json(assessment);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET dependency graph data for D3
router.get('/:id/graph', async (req, res) => {
  try {
    const components  = await Component.find({ projectId: req.params.id });
    const assessment  = await RiskAssessment.findOne({ projectId: req.params.id });

    // Build a set of vulnerable component names for quick lookup
    const vulnMap = {};
    if (assessment) {
      assessment.affectedComponents.forEach(a => {
        if (!vulnMap[a.componentName]) vulnMap[a.componentName] = { severity: a.severity, count: 0 };
        vulnMap[a.componentName].count++;
        // upgrade severity if higher
        const order = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };
        if ((order[a.severity] || 0) > (order[vulnMap[a.componentName].severity] || 0)) {
          vulnMap[a.componentName].severity = a.severity;
        }
      });
    }

    const nodes = components.map(c => ({
      id:       c.bomRef || c.name,
      name:     c.name,
      version:  c.version,
      isDirect: c.isDirect,
      depth:    c.depth,
      vuln:     vulnMap[c.name] || null
    }));

    const links = [];
    components.forEach(c => {
      (c.dependsOn || []).forEach(targetRef => {
        const target = components.find(t => t.bomRef === targetRef || t.name === targetRef);
        if (target) {
          links.push({
            source: c.bomRef || c.name,
            target: target.bomRef || target.name
          });
        }
      });
    });

    res.json({ nodes, links });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET cross-project comparison
router.get('/compare/all', async (req, res) => {
  try {
    const projects     = await Project.find().sort({ riskScore: -1 });
    const assessments  = await RiskAssessment.find();

    const comparison = projects.map(p => {
      const a = assessments.find(a => a.projectId.toString() === p._id.toString());
      return {
        _id:          p._id,
        name:         p.name,
        language:     p.language,
        sbomFormat:   p.sbomFormat,
        componentCount: p.componentCount,
        riskScore:    p.riskScore,
        riskLevel:    p.riskLevel,
        criticalCount: a?.criticalCount || 0,
        highCount:    a?.highCount || 0,
        mediumCount:  a?.mediumCount || 0,
        lowCount:     a?.lowCount || 0,
        directVulnerabilities:    a?.directVulnerabilities || 0,
        transitiveVulnerabilities: a?.transitiveVulnerabilities || 0,
        vulnerableComponents: a?.vulnerableComponents || 0,
        totalComponents: a?.totalComponents || 0
      };
    });

    res.json(comparison);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
