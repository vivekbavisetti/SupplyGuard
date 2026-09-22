const mongoose = require('mongoose');

const RiskAssessmentSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  calculatedAt: { type: Date, default: Date.now },
  riskScore: Number,
  riskLevel: String,
  directVulnerabilities: Number,
  transitiveVulnerabilities: Number,
  criticalCount: Number,
  highCount: Number,
  mediumCount: Number,
  lowCount: Number,
  affectedComponents: [
    {
      componentName: String,
      cveId: String,
      severity: String,
      isDirect: Boolean
    }
  ]
});

module.exports = mongoose.model('RiskAssessment', RiskAssessmentSchema);
