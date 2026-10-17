const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  name:           { type: String, required: true },
  description:    String,
  language:       String,
  sbomFormat:     String,
  sbomVersion:    String,
  serialNumber:   String,
  createdAt:      { type: Date, default: Date.now },
  updatedAt:      { type: Date, default: Date.now },
  componentCount: { type: Number, default: 0 },
  riskScore:      { type: Number, default: 0 },
  riskLevel:      { type: String, default: 'Unknown' },
  osvLookupDone:  { type: Boolean, default: false }
});

module.exports = mongoose.model('Project', ProjectSchema);
