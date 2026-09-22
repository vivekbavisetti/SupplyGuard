# 🛡️ SupplyGuard

**A NoSQL-Based Software Supply Chain Risk Analysis and Dependency Intelligence Platform**

> Course: BCSE406L — NoSQL Databases | VIT Chennai  
> Faculty: Dr. V Manjula | Fall Semester 2026–2027  
> **Bavisetti Vivek (24BCE1104)** · Kaustubh Prasad Nair (24BCE1076)

---

## What is SupplyGuard?

SupplyGuard ingests Software Bills of Materials (SBOMs), parses component dependency graphs, matches components against a vulnerability database, and computes a project-level risk score that accounts for both **direct** and **transitive** dependency exposure.

**Pipeline:**
```
SBOM (CycloneDX JSON) → Parse → Normalize → MongoDB → Vulnerability Match → Risk Score → Dashboard
```

---

## Prerequisites

Make sure the following are installed before running:

| Tool | Version | Download |
|------|---------|----------|
| Node.js | 18+ | https://nodejs.org |
| MongoDB Community | 7.x | https://www.mongodb.com/try/download/community |
| Git | Any | https://git-scm.com |

MongoDB must be **running locally** on `mongodb://127.0.0.1:27017` before you start the backend.

---

## Quick Start (Windows)

### Step 1 — Start MongoDB

Open a terminal and run:
```cmd
mongod
```
Or start it from Windows Services if installed as a service.

---

### Step 2 — Install and run the Backend

Open a **new** terminal window:
```cmd
cd backend
npm install
npm start
```

You should see:
```
✅ Connected to MongoDB
✅ SupplyGuard API running at http://localhost:5000
```

---

### Step 3 — Install and run the Frontend

Open **another** terminal window:
```cmd
cd frontend
npm install
npm run dev
```

You should see:
```
  VITE v5.x  ready in Xms
  ➜  Local:   http://localhost:5173/
```

---

### Step 4 — Open the App

Go to: **http://localhost:5173**

1. Create a project using the sidebar form
2. Click **"Load Sample SBOM"**
3. View components, vulnerabilities, and risk score

---

## Project Structure

```
SupplyGuard/
├── backend/
│   ├── server.js               ← Express entry point
│   ├── .env                    ← MongoDB URI and port config
│   ├── package.json
│   ├── routes/
│   │   ├── projects.js         ← Project CRUD endpoints
│   │   ├── sbom.js             ← SBOM upload and parsing endpoint
│   │   └── risk.js             ← Risk calculation endpoints
│   ├── models/
│   │   ├── Project.js          ← Mongoose schema
│   │   ├── Component.js        ← Mongoose schema
│   │   ├── Vulnerability.js    ← Mongoose schema
│   │   └── RiskAssessment.js   ← Mongoose schema
│   ├── services/
│   │   ├── sbomParser.js       ← CycloneDX JSON parser with BFS depth detection
│   │   └── riskEngine.js       ← CVSS × depth-weight risk formula
│   └── data/
│       └── sampleVulnerabilities.js  ← 20 real CVEs from OSV/NVD
│
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── src/
│       ├── main.jsx            ← React entry point
│       ├── App.jsx             ← Full dashboard UI
│       ├── App.css             ← Global styles
│       └── api.js              ← Axios API helpers
│
├── .gitignore
└── README.md
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/projects` | List all projects |
| POST | `/api/projects` | Create a new project |
| GET | `/api/projects/:id` | Get project by ID |
| DELETE | `/api/projects/:id` | Delete project and all data |
| GET | `/api/projects/:id/components` | Get all components for a project |
| GET | `/api/projects/:id/risk` | Get latest risk assessment |
| POST | `/api/sbom/upload/:projectId` | Upload and parse a CycloneDX SBOM |
| POST | `/api/risk/calculate/:projectId` | Manually recalculate risk |

---

## Risk Score Formula

```
depthWeight:
  isDirect = true  → 1.0
  isDirect = false, depth ≤ 1 → 0.5
  isDirect = false, depth ≥ 2 → 0.25

riskScore = min(100, (Σ (cvssScore × depthWeight) / totalComponents) × 10)

Classification:
  0–25   → LOW
  26–50  → MEDIUM
  51–75  → HIGH
  76–100 → CRITICAL
```

---

## MongoDB Collections

| Collection | Purpose |
|------------|---------|
| `projects` | Project metadata, risk level summary |
| `components` | Normalized components from parsed SBOMs |
| `vulnerabilities` | Vulnerability schema (sample data in JS file) |
| `riskassessments` | Computed risk scores and CVE matches |

---

## Technology Stack

- **Frontend:** React 18 + Vite + Axios
- **Backend:** Node.js + Express
- **Database:** MongoDB + Mongoose
- **SBOM Format:** CycloneDX 1.4 JSON (SPDX planned)
- **Vulnerability Data:** 20 real CVEs from OSV and NVD (local sample)

---

## GitHub Repository

https://github.com/vivekbavisetti/SupplyGuard
