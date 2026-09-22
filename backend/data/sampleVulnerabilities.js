const sampleVulnerabilities = [
  {
    cveId: "CVE-2021-44228",
    packageName: "log4j-core",
    affectedVersions: ["2.0", "2.1", "2.2", "2.3", "2.4", "2.5", "2.6", "2.7", "2.8", "2.9", "2.10", "2.11", "2.12", "2.13", "2.14"],
    severity: "CRITICAL",
    cvssScore: 10.0,
    description: "Log4Shell: Remote code execution via JNDI lookup in log messages.",
    source: "NVD"
  },
  {
    cveId: "CVE-2022-42889",
    packageName: "commons-text",
    affectedVersions: ["1.5", "1.6", "1.7", "1.8", "1.9"],
    severity: "CRITICAL",
    cvssScore: 9.8,
    description: "Text4Shell: Arbitrary code execution via string interpolation.",
    source: "NVD"
  },
  {
    cveId: "CVE-2021-42550",
    packageName: "logback-classic",
    affectedVersions: ["1.2.7", "1.2.8", "1.2.9", "1.2.10", "1.2.11"],
    severity: "HIGH",
    cvssScore: 8.8,
    description: "Logback JNDI injection vulnerability via specially crafted config.",
    source: "OSV"
  },
  {
    cveId: "CVE-2022-25857",
    packageName: "snakeyaml",
    affectedVersions: ["1.28", "1.29", "1.30"],
    severity: "HIGH",
    cvssScore: 7.5,
    description: "Denial of service via stack overflow in YAML parsing.",
    source: "OSV"
  },
  {
    cveId: "CVE-2023-20883",
    packageName: "spring-boot",
    affectedVersions: ["3.0.0", "3.0.1", "3.0.2", "3.0.3", "3.0.4", "3.0.5", "3.0.6"],
    severity: "HIGH",
    cvssScore: 7.5,
    description: "Spring Boot actuator endpoint exposes sensitive data.",
    source: "NVD"
  },
  {
    cveId: "CVE-2022-31690",
    packageName: "spring-security-oauth2-client",
    affectedVersions: ["5.6.0", "5.6.1", "5.6.2", "5.6.3", "5.6.4"],
    severity: "HIGH",
    cvssScore: 8.1,
    description: "Privilege escalation in OAuth2 authorization flows.",
    source: "NVD"
  },
  {
    cveId: "CVE-2022-1471",
    packageName: "snakeyaml",
    affectedVersions: ["1.31", "1.32", "1.33"],
    severity: "CRITICAL",
    cvssScore: 9.8,
    description: "Constructor deserialization allows arbitrary code execution.",
    source: "OSV"
  },
  {
    cveId: "CVE-2021-21344",
    packageName: "xstream",
    affectedVersions: ["1.4.14", "1.4.15"],
    severity: "CRITICAL",
    cvssScore: 9.8,
    description: "Arbitrary code execution via XStream deserialization.",
    source: "NVD"
  },
  {
    cveId: "CVE-2020-11979",
    packageName: "ant",
    affectedVersions: ["1.10.7", "1.10.8"],
    severity: "HIGH",
    cvssScore: 7.5,
    description: "Path traversal in Ant file operations.",
    source: "NVD"
  },
  {
    cveId: "CVE-2022-40152",
    packageName: "woodstox-core",
    affectedVersions: ["5.0.3", "6.0.3", "6.4.0"],
    severity: "HIGH",
    cvssScore: 7.5,
    description: "Denial of service via XML parsing stack overflow.",
    source: "OSV"
  },
  {
    cveId: "CVE-2021-3749",
    packageName: "axios",
    affectedVersions: ["0.21.0", "0.21.1"],
    severity: "HIGH",
    cvssScore: 7.5,
    description: "ReDoS via crafted request data in axios.",
    source: "OSV"
  },
  {
    cveId: "CVE-2022-24785",
    packageName: "moment",
    affectedVersions: ["2.18.0", "2.19.0", "2.20.0", "2.29.0", "2.29.1"],
    severity: "HIGH",
    cvssScore: 7.5,
    description: "Path traversal in moment locale loading.",
    source: "NVD"
  },
  {
    cveId: "CVE-2022-0686",
    packageName: "follow-redirects",
    affectedVersions: ["1.14.7"],
    severity: "MEDIUM",
    cvssScore: 6.5,
    description: "Authorization header leakage via cross-protocol redirect.",
    source: "OSV"
  },
  {
    cveId: "CVE-2021-23343",
    packageName: "path-parse",
    affectedVersions: ["1.0.6"],
    severity: "MEDIUM",
    cvssScore: 5.3,
    description: "ReDoS via crafted path input.",
    source: "OSV"
  },
  {
    cveId: "CVE-2022-3517",
    packageName: "minimatch",
    affectedVersions: ["3.0.4", "3.0.5"],
    severity: "HIGH",
    cvssScore: 7.5,
    description: "ReDoS via crafted glob pattern.",
    source: "NVD"
  },
  {
    cveId: "CVE-2022-37599",
    packageName: "loader-utils",
    affectedVersions: ["2.0.0", "2.0.1", "2.0.2", "2.0.3"],
    severity: "CRITICAL",
    cvssScore: 9.8,
    description: "Prototype pollution via crafted loader options.",
    source: "NVD"
  },
  {
    cveId: "CVE-2023-28155",
    packageName: "request",
    affectedVersions: ["2.87.0", "2.88.0", "2.88.2"],
    severity: "MEDIUM",
    cvssScore: 6.1,
    description: "SSRF vulnerability via redirect following.",
    source: "OSV"
  },
  {
    cveId: "CVE-2021-23337",
    packageName: "lodash",
    affectedVersions: ["4.17.20"],
    severity: "HIGH",
    cvssScore: 7.2,
    description: "Command injection via template function.",
    source: "NVD"
  },
  {
    cveId: "CVE-2019-10744",
    packageName: "lodash",
    affectedVersions: ["4.17.11", "4.17.12", "4.17.13", "4.17.14"],
    severity: "CRITICAL",
    cvssScore: 9.1,
    description: "Prototype pollution via defaultsDeep.",
    source: "NVD"
  },
  {
    cveId: "CVE-2022-46175",
    packageName: "json5",
    affectedVersions: ["1.0.1", "2.2.0", "2.2.1"],
    severity: "HIGH",
    cvssScore: 7.1,
    description: "Prototype pollution in JSON5 parse.",
    source: "OSV"
  }
];

module.exports = sampleVulnerabilities;
