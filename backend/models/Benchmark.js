const mongoose = require('mongoose');

const BenchmarkSchema = new mongoose.Schema({
  projectId:          { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  operation:          String,
  componentCount:     Number,
  durationMs:         Number,
  endpoint:           String,
  timestamp:          { type: Date, default: Date.now }
});

module.exports = mongoose.model('Benchmark', BenchmarkSchema);
