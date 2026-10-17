const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
const { parseSBOM } = require('../services/sbomParser');
const { calculateRisk } = require('../services/riskEngine');
const Project  = require('../models/Project');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.json', '.yaml', '.yml'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only .json, .yaml, .yml files are allowed'));
  }
});

// POST upload SBOM as JSON body (CycloneDX or SPDX JSON)
router.post('/upload/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const useOSV = req.query.osv === 'true';
    const sbomData = req.body;

    if (!sbomData || (!sbomData.bomFormat && !sbomData.spdxVersion)) {
      return res.status(400).json({
        error: 'Invalid SBOM: must be CycloneDX JSON (bomFormat field) or SPDX JSON (spdxVersion field)'
      });
    }

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const parseResult = await parseSBOM(sbomData, projectId);

    await Project.findByIdAndUpdate(projectId, {
      sbomFormat:     parseResult.format,
      sbomVersion:    parseResult.specVersion,
      serialNumber:   parseResult.serialNumber,
      componentCount: parseResult.componentCount,
      updatedAt:      new Date()
    });

    const riskResult = await calculateRisk(projectId, useOSV);

    res.json({
      message:          'SBOM parsed and risk calculated successfully.',
      sbomFormat:       parseResult.format,
      specVersion:      parseResult.specVersion,
      componentCount:   parseResult.componentCount,
      riskScore:        riskResult.riskScore,
      riskLevel:        riskResult.riskLevel,
      directVulnerabilities:    riskResult.directVulnerabilities,
      transitiveVulnerabilities: riskResult.transitiveVulnerabilities,
      osvLookupUsed:    riskResult.osvLookupUsed
    });
  } catch (err) {
    console.error('SBOM upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST upload SBOM as file (multipart/form-data)
router.post('/upload-file/:projectId', upload.single('sbom'), async (req, res) => {
  try {
    const { projectId } = req.params;
    const useOSV = req.query.osv === 'true';

    if (!req.file) return res.status(400).json({ error: 'No file uploaded. Field name must be "sbom".' });

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const fileContent = fs.readFileSync(req.file.path, 'utf-8');
    const filename    = req.file.originalname;

    const parseResult = await parseSBOM(fileContent, projectId, filename);

    await Project.findByIdAndUpdate(projectId, {
      sbomFormat:     parseResult.format,
      sbomVersion:    parseResult.specVersion,
      serialNumber:   parseResult.serialNumber,
      componentCount: parseResult.componentCount,
      updatedAt:      new Date()
    });

    const riskResult = await calculateRisk(projectId, useOSV);

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      message:        'SBOM file parsed and risk calculated successfully.',
      filename:       filename,
      sbomFormat:     parseResult.format,
      specVersion:    parseResult.specVersion,
      componentCount: parseResult.componentCount,
      riskScore:      riskResult.riskScore,
      riskLevel:      riskResult.riskLevel,
      osvLookupUsed:  riskResult.osvLookupUsed
    });
  } catch (err) {
    if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
