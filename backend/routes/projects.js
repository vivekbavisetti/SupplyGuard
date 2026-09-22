const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Component = require('../models/Component');
const RiskAssessment = require('../models/RiskAssessment');

// GET all projects
router.get('/', async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single project by ID
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create a new project
router.post('/', async (req, res) => {
  try {
    const { name, description, language } = req.body;
    const project = new Project({ name, description, language });
    await project.save();
    res.status(201).json(project);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET all components for a project
router.get('/:id/components', async (req, res) => {
  try {
    const components = await Component.find({ projectId: req.params.id });
    res.json(components);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET latest risk assessment for a project
router.get('/:id/risk', async (req, res) => {
  try {
    const assessment = await RiskAssessment.findOne({ projectId: req.params.id }).sort({ calculatedAt: -1 });
    if (!assessment) return res.status(404).json({ error: 'No risk assessment found. Please upload an SBOM first.' });
    res.json(assessment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE project and all related data
router.delete('/:id', async (req, res) => {
  try {
    await Project.findByIdAndDelete(req.params.id);
    await Component.deleteMany({ projectId: req.params.id });
    await RiskAssessment.deleteMany({ projectId: req.params.id });
    res.json({ message: 'Project and all related data deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
