require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Vulnerability = require('../models/Vulnerability');
const sampleVulnerabilities = require('./sampleVulnerabilities');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/supplyguard');
    console.log('Connected to MongoDB');

    await Vulnerability.deleteMany({});
    console.log('Cleared existing vulnerabilities');

    await Vulnerability.insertMany(sampleVulnerabilities);
    console.log(`✅ Seeded ${sampleVulnerabilities.length} vulnerabilities into MongoDB`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
}

seed();
