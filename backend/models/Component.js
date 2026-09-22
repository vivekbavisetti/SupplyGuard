const mongoose = require('mongoose');

const ComponentSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  name: { type: String, required: true },
  version: String,
  type: String,
  purl: String,
  licenses: [String],
  isDirect: { type: Boolean, default: true },
  depth: { type: Number, default: 0 }
});

module.exports = mongoose.model('Component', ComponentSchema);
