const mongoose = require('mongoose');

const RiskAssessmentSchema = new mongoose.Schema({
  projectId:               { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  calculatedAt:            { type: Date, default: Date.now },
  riskScore:               Number,
  riskLevel:               String,
  directVulnerabilities:   Number,
  transitiveVulnerabilities: Number,
  criticalCount:           Number,
  highCount:               Number,
  mediumCount:             Number,
  lowCount:                Number,
  totalComponents:         Number,
  vulnerableComponents:    Number,
  osvLookupUsed:           { type: Boolean, default: false },
  affectedComponents: [{
    componentName: String,
    version:       String,
    cveId:         String,
    severity:      String,
    cvssScore:     Number,
    isDirect:      Boolean,
    depth:         Number,
    fixedIn:       String
  }]
});

module.exports = mongoose.model('RiskAssessment', RiskAssessmentSchema);
