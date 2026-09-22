const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  language: String,
  sbomFormat: String,
  createdAt: { type: Date, default: Date.now },
  componentCount: { type: Number, default: 0 },
  riskScore: { type: Number, default: 0 },
  riskLevel: { type: String, default: 'Unknown' }
});

module.exports = mongoose.model('Project', ProjectSchema);
