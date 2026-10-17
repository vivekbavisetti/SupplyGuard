# 🛡️ SupplyGuard v2.0 — Full Implementation

**A NoSQL-Based Software Supply Chain Risk Analysis and Dependency Intelligence Platform**

> Course: BCSE406L — NoSQL Databases | VIT Chennai
> Faculty: Dr. V Manjula | Fall Semester 2026–2027
> **Bavisetti Vivek (24BCE1104)** · Kaustubh Prasad Nair (24BCE1076)

---

## What is SupplyGuard?

SupplyGuard ingests Software Bills of Materials (SBOMs) in **CycloneDX 1.4** and **SPDX 2.3** formats, parses and normalises dependency graphs, matches components against a vulnerability database (local + live OSV API), and computes a weighted project-level risk score accounting for direct and transitive exposure. Results are presented through a React dashboard with 6 tabs including a D3.js dependency graph, cross-project comparison, and performance benchmarking.

**Pipeline:**
```
SBOM (CycloneDX / SPDX JSON / YAML)
  → Parse + Normalise (BFS depth detection)
  → MongoDB (5 collections)
  → Vulnerability Match (local 32 CVEs + live OSV API)
  → Risk Score (CVSS × depth weight, 0–100)
  → React Dashboard (6 tabs)
```

---

## Prerequisites

| Tool | Version | Download |
|------|---------|----------|
| Node.js | 18+ | https://nodejs.org |
| MongoDB Community | 7.x | https://www.mongodb.com/try/download/community |
| Git | Any | https://git-scm.com |

> MongoDB must be **running** before you start the backend.

---

## Quick Start (Windows — 3 steps only)

### Step 1 — Start MongoDB

If installed as a Windows Service (recommended):
```cmd
net start MongoDB
```

Or run manually (replace 7.0 with your installed version):
```cmd
mkdir C:\data\db
"C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --dbpath "C:\data\db"
```

---

### Step 2 — Backend (open a new CMD window)

```cmd
cd backend
npm install
npm start
```

Expected output:
```
✅ Connected to MongoDB
✅ SupplyGuard API v2.0 running at http://localhost:5000
```

**Optional — seed the vulnerability collection into MongoDB:**
```cmd
npm run seed
```
This loads all 32 CVEs from the local dataset into the MongoDB `vulnerabilities` collection.

---

### Step 3 — Frontend (open another new CMD window)

```cmd
cd frontend
npm install
npm run dev
```

Expected output:
```
  VITE v5.x  ready
  ➜  Local:   http://localhost:5173/
```

---

### Step 4 — Open the App

Go to: **http://localhost:5173**

1. Create a project in the sidebar
2. Click **"Load Sample SBOM"** — loads a pre-built CycloneDX SBOM with 10 vulnerable Java components
3. Or click **"Upload File"** / drag-and-drop your own `.json` or `.yaml` SBOM file
4. Toggle **"Use live OSV API"** to fetch real-time vulnerability data from https://api.osv.dev

---

## What's Implemented (100%)

| Feature | Status |
|---------|--------|
| Node.js + Express backend | ✅ |
| MongoDB with 5 collections | ✅ |
| CycloneDX 1.4 JSON SBOM parsing | ✅ |
| SPDX 2.3 JSON SBOM parsing | ✅ |
| SPDX 2.3 YAML SBOM parsing | ✅ |
| BFS transitive dependency depth detection | ✅ |
| SBOM file upload (drag & drop + file picker) | ✅ |
| Local vulnerability dataset (32 real CVEs) | ✅ |
| Live OSV API integration | ✅ |
| Semantic version range matching | ✅ |
| CVSS × depth-weight risk formula | ✅ |
| Risk level classification (LOW/MEDIUM/HIGH/CRITICAL) | ✅ |
| Fixed version extraction per CVE | ✅ |
| REST API (11 endpoints) | ✅ |
| React dashboard — Components tab | ✅ |
| React dashboard — Vulnerabilities tab (with CVSS score + fixed version) | ✅ |
| React dashboard — D3.js Dependency Graph | ✅ |
| React dashboard — Dependencies tab | ✅ |
| React dashboard — Cross-Project Comparison | ✅ |
| React dashboard — Performance Benchmarking | ✅ |
| MongoDB Benchmark collection (auto-records latency) | ✅ |
| Vulnerability seeder script | ✅ |

---

## Project Structure

```
SupplyGuard/
├── README.md
├── .gitignore
│
├── backend/
│   ├── server.js                        ← Express entry point
│   ├── .env                             ← MongoDB URI, port, OSV API URL
│   ├── package.json
│   ├── .gitignore
│   │
│   ├── models/
│   │   ├── Project.js                   ← Project schema
│   │   ├── Component.js                 ← Component schema (purl, isDirect, depth, dependsOn)
│   │   ├── Vulnerability.js             ← Vulnerability schema (versionRanges, CVSS)
│   │   ├── RiskAssessment.js            ← Risk assessment (score, CVE list, fixedIn)
│   │   └── Benchmark.js                 ← Performance benchmark records
│   │
│   ├── routes/
│   │   ├── projects.js                  ← CRUD + /graph + /compare/all
│   │   ├── sbom.js                      ← JSON body upload + file upload (multer)
│   │   ├── risk.js                      ← Risk calculation + all assessments
│   │   └── benchmark.js                 ← Benchmark run + summary
│   │
│   ├── services/
│   │   ├── sbomParser.js                ← CycloneDX + SPDX JSON + SPDX YAML parsers
│   │   ├── riskEngine.js                ← CVSS×depth formula + semver range matching
│   │   └── osvService.js                ← Live OSV API batch query
│   │
│   └── data/
│       ├── sampleVulnerabilities.js     ← 32 real CVEs (Java + JS + Python)
│       └── seedVulnerabilities.js       ← Seeds CVEs into MongoDB
│
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── package.json
    ├── .gitignore
    └── src/
        ├── main.jsx                     ← React entry point
        ├── App.jsx                      ← Full dashboard (6 tabs)
        ├── index.css                    ← Global styles
        ├── api.js                       ← All Axios API helpers
        └── components/
            ├── DependencyGraph.jsx      ← D3.js force-directed graph
            ├── ComparisonView.jsx       ← Cross-project comparison + Recharts
            └── BenchmarkView.jsx        ← Performance benchmark UI + Recharts
```

---

## API Endpoints (11 total)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check — server + MongoDB status |
| GET | `/api/projects` | List all projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/:id` | Get project by ID |
| PUT | `/api/projects/:id` | Update project metadata |
| DELETE | `/api/projects/:id` | Delete project and all data |
| GET | `/api/projects/:id/components` | Get components (auto-benchmarks) |
| GET | `/api/projects/:id/risk` | Get latest risk assessment |
| GET | `/api/projects/:id/graph` | Get graph nodes + links for D3 |
| GET | `/api/projects/compare/all` | Cross-project comparison data |
| POST | `/api/sbom/upload/:id` | Upload SBOM as JSON body |
| POST | `/api/sbom/upload-file/:id` | Upload SBOM as file (multipart) |
| POST | `/api/risk/calculate/:id` | Trigger risk recalculation |
| GET | `/api/risk/all` | All risk assessments |
| GET | `/api/benchmark` | All benchmark records |
| GET | `/api/benchmark/summary` | Aggregated benchmark stats |
| POST | `/api/benchmark/run/:id` | Run timed benchmark (N runs) |

> Append `?osv=true` to `/api/sbom/upload/:id`, `/api/sbom/upload-file/:id`, or `/api/risk/calculate/:id` to enable live OSV API lookup.

---

## Risk Score Formula

```
depthWeight(c):
  isDirect = true              → 1.0
  isDirect = false, depth = 1  → 0.5
  isDirect = false, depth ≥ 2  → 0.25

riskScore = min(100, (Σ cvssScore(v) × depthWeight(c)) / totalComponents × 10)

Classification:
  0  – 25  → LOW
  26 – 50  → MEDIUM
  51 – 75  → HIGH
  76 – 100 → CRITICAL
```

Vulnerability matching uses:
1. **Exact version match** in `affectedVersions[]`
2. **Semantic version range** using `versionRanges[{introduced, fixed}]` via the `semver` package
3. **Live OSV API** (optional) via batch query to `https://api.osv.dev/v1/querybatch`

---

## Supported SBOM Formats

| Format | Version | Input Type | Status |
|--------|---------|-----------|--------|
| CycloneDX | 1.4 | JSON | ✅ Full |
| SPDX | 2.3 | JSON | ✅ Full |
| SPDX | 2.3 | YAML | ✅ Full |

---

## MongoDB Collections

| Collection | Purpose |
|------------|---------|
| `projects` | Project metadata, risk score summary |
| `components` | Normalised components with isDirect, depth, dependsOn, ecosystem |
| `vulnerabilities` | Seeded CVE records with versionRanges and CVSS |
| `riskassessments` | Computed risk scores, CVE matches, fixedIn versions |
| `benchmarks` | Auto-recorded API latency and risk calculation duration |

---

## GitHub Repository

https://github.com/vivekbavisetti/SupplyGuard
