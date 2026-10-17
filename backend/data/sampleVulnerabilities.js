const sampleVulnerabilities = [
  // ── JAVA / Maven ──────────────────────────────────────────────
  {
    cveId: "CVE-2021-44228", packageName: "log4j-core", ecosystem: "Maven",
    affectedVersions: ["2.0","2.1","2.2","2.3","2.4","2.5","2.6","2.7","2.8","2.9","2.10","2.11","2.12","2.13","2.14","2.14.0","2.14.1"],
    versionRanges: [{ introduced: "2.0", fixed: "2.15.0" }],
    severity: "CRITICAL", cvssScore: 10.0,
    description: "Log4Shell: JNDI injection in log messages allows unauthenticated remote code execution.",
    source: "NVD"
  },
  {
    cveId: "CVE-2021-45046", packageName: "log4j-core", ecosystem: "Maven",
    affectedVersions: ["2.15.0"],
    versionRanges: [{ introduced: "2.0", fixed: "2.16.0" }],
    severity: "CRITICAL", cvssScore: 9.0,
    description: "Log4j2 incomplete fix for CVE-2021-44228 allows context lookup manipulation.",
    source: "NVD"
  },
  {
    cveId: "CVE-2022-42889", packageName: "commons-text", ecosystem: "Maven",
    affectedVersions: ["1.5","1.6","1.7","1.8","1.9"],
    versionRanges: [{ introduced: "1.5", fixed: "1.10.0" }],
    severity: "CRITICAL", cvssScore: 9.8,
    description: "Text4Shell: Arbitrary code execution via string interpolation in StringSubstitutor.",
    source: "NVD"
  },
  {
    cveId: "CVE-2021-42550", packageName: "logback-classic", ecosystem: "Maven",
    affectedVersions: ["1.2.7","1.2.8","1.2.9","1.2.10","1.2.11"],
    versionRanges: [{ introduced: "1.2.7", fixed: "1.2.12" }],
    severity: "HIGH", cvssScore: 8.8,
    description: "JNDI injection via specially crafted logback configuration file.",
    source: "OSV"
  },
  {
    cveId: "CVE-2022-25857", packageName: "snakeyaml", ecosystem: "Maven",
    affectedVersions: ["1.28","1.29","1.30"],
    versionRanges: [{ introduced: "0", fixed: "1.31" }],
    severity: "HIGH", cvssScore: 7.5,
    description: "Denial of service via stack overflow when parsing deeply nested YAML.",
    source: "OSV"
  },
  {
    cveId: "CVE-2022-1471", packageName: "snakeyaml", ecosystem: "Maven",
    affectedVersions: ["1.31","1.32","1.33"],
    versionRanges: [{ introduced: "0", fixed: "2.0" }],
    severity: "CRITICAL", cvssScore: 9.8,
    description: "SnakeYaml Constructor deserialization leads to arbitrary code execution.",
    source: "OSV"
  },
  {
    cveId: "CVE-2023-20883", packageName: "spring-boot", ecosystem: "Maven",
    affectedVersions: ["3.0.0","3.0.1","3.0.2","3.0.3","3.0.4","3.0.5","3.0.6"],
    versionRanges: [{ introduced: "3.0.0", fixed: "3.0.7" }],
    severity: "HIGH", cvssScore: 7.5,
    description: "Spring Boot actuator endpoint exposes sensitive environment data.",
    source: "NVD"
  },
  {
    cveId: "CVE-2022-22965", packageName: "spring-webmvc", ecosystem: "Maven",
    affectedVersions: ["5.3.0","5.3.1","5.3.2","5.3.3","5.3.4","5.3.5","5.3.6","5.3.7","5.3.8","5.3.9","5.3.10","5.3.11","5.3.12","5.3.13","5.3.14","5.3.15","5.3.16","5.3.17"],
    versionRanges: [{ introduced: "5.3.0", fixed: "5.3.18" }],
    severity: "CRITICAL", cvssScore: 9.8,
    description: "Spring4Shell: RCE via data binding on JDK9+ with Tomcat.",
    source: "NVD"
  },
  {
    cveId: "CVE-2022-31690", packageName: "spring-security-oauth2-client", ecosystem: "Maven",
    affectedVersions: ["5.6.0","5.6.1","5.6.2","5.6.3","5.6.4"],
    versionRanges: [{ introduced: "5.6.0", fixed: "5.6.5" }],
    severity: "HIGH", cvssScore: 8.1,
    description: "Privilege escalation via crafted OAuth2 authorization code request.",
    source: "NVD"
  },
  {
    cveId: "CVE-2021-21344", packageName: "xstream", ecosystem: "Maven",
    affectedVersions: ["1.4.14","1.4.15"],
    versionRanges: [{ introduced: "0", fixed: "1.4.16" }],
    severity: "CRITICAL", cvssScore: 9.8,
    description: "XStream deserialization allows arbitrary code execution via crafted XML.",
    source: "NVD"
  },
  {
    cveId: "CVE-2022-40152", packageName: "woodstox-core", ecosystem: "Maven",
    affectedVersions: ["6.4.0","6.3.0","5.0.3"],
    versionRanges: [{ introduced: "6.0.0", fixed: "6.4.1" }],
    severity: "HIGH", cvssScore: 7.5,
    description: "Denial of service via stack overflow in XML parsing with Woodstox.",
    source: "OSV"
  },
  {
    cveId: "CVE-2020-11979", packageName: "ant", ecosystem: "Maven",
    affectedVersions: ["1.10.7","1.10.8"],
    versionRanges: [{ introduced: "1.10.7", fixed: "1.10.9" }],
    severity: "HIGH", cvssScore: 7.5,
    description: "Path traversal vulnerability in Apache Ant file operations.",
    source: "NVD"
  },
  {
    cveId: "CVE-2022-22970", packageName: "spring-beans", ecosystem: "Maven",
    affectedVersions: ["5.3.0","5.3.1","5.3.2","5.3.3","5.3.4","5.3.5","5.3.6","5.3.7","5.3.8","5.3.9","5.3.10","5.3.11","5.3.12","5.3.13","5.3.14","5.3.15","5.3.16","5.3.17"],
    versionRanges: [{ introduced: "5.3.0", fixed: "5.3.18" }],
    severity: "MEDIUM", cvssScore: 5.3,
    description: "DoS via specially crafted SpEL expression in Spring Data binding.",
    source: "NVD"
  },
  // ── JavaScript / npm ──────────────────────────────────────────
  {
    cveId: "CVE-2021-3749", packageName: "axios", ecosystem: "npm",
    affectedVersions: ["0.21.0","0.21.1"],
    versionRanges: [{ introduced: "0.21.0", fixed: "0.21.2" }],
    severity: "HIGH", cvssScore: 7.5,
    description: "Axios ReDoS via crafted request data using exponential regex.",
    source: "OSV"
  },
  {
    cveId: "CVE-2022-24785", packageName: "moment", ecosystem: "npm",
    affectedVersions: ["2.18.0","2.19.0","2.20.0","2.29.0","2.29.1"],
    versionRanges: [{ introduced: "0", fixed: "2.29.2" }],
    severity: "HIGH", cvssScore: 7.5,
    description: "Path traversal in moment.js locale file loading.",
    source: "NVD"
  },
  {
    cveId: "CVE-2022-0686", packageName: "follow-redirects", ecosystem: "npm",
    affectedVersions: ["1.14.7"],
    versionRanges: [{ introduced: "0", fixed: "1.14.8" }],
    severity: "MEDIUM", cvssScore: 6.5,
    description: "Authorization header leaked on cross-protocol redirect.",
    source: "OSV"
  },
  {
    cveId: "CVE-2022-3517", packageName: "minimatch", ecosystem: "npm",
    affectedVersions: ["3.0.4","3.0.5"],
    versionRanges: [{ introduced: "3.0.4", fixed: "3.0.6" }],
    severity: "HIGH", cvssScore: 7.5,
    description: "ReDoS via backtracking in glob pattern matching.",
    source: "NVD"
  },
  {
    cveId: "CVE-2022-37599", packageName: "loader-utils", ecosystem: "npm",
    affectedVersions: ["2.0.0","2.0.1","2.0.2","2.0.3"],
    versionRanges: [{ introduced: "2.0.0", fixed: "2.0.4" }],
    severity: "CRITICAL", cvssScore: 9.8,
    description: "Prototype pollution in loader-utils getOptions function.",
    source: "NVD"
  },
  {
    cveId: "CVE-2023-28155", packageName: "request", ecosystem: "npm",
    affectedVersions: ["2.87.0","2.88.0","2.88.2"],
    versionRanges: [{ introduced: "0", fixed: "3.0.0" }],
    severity: "MEDIUM", cvssScore: 6.1,
    description: "SSRF vulnerability via redirect following in request package.",
    source: "OSV"
  },
  {
    cveId: "CVE-2021-23337", packageName: "lodash", ecosystem: "npm",
    affectedVersions: ["4.17.20"],
    versionRanges: [{ introduced: "0", fixed: "4.17.21" }],
    severity: "HIGH", cvssScore: 7.2,
    description: "Command injection via lodash template function.",
    source: "NVD"
  },
  {
    cveId: "CVE-2019-10744", packageName: "lodash", ecosystem: "npm",
    affectedVersions: ["4.17.11","4.17.12","4.17.13","4.17.14"],
    versionRanges: [{ introduced: "0", fixed: "4.17.15" }],
    severity: "CRITICAL", cvssScore: 9.1,
    description: "Prototype pollution via defaultsDeep in lodash.",
    source: "NVD"
  },
  {
    cveId: "CVE-2022-46175", packageName: "json5", ecosystem: "npm",
    affectedVersions: ["1.0.1","2.2.0","2.2.1"],
    versionRanges: [{ introduced: "2.0.0", fixed: "2.2.2" }],
    severity: "HIGH", cvssScore: 7.1,
    description: "Prototype pollution in JSON5 parse function.",
    source: "OSV"
  },
  {
    cveId: "CVE-2021-23343", packageName: "path-parse", ecosystem: "npm",
    affectedVersions: ["1.0.6"],
    versionRanges: [{ introduced: "0", fixed: "1.0.7" }],
    severity: "MEDIUM", cvssScore: 5.3,
    description: "ReDoS via crafted path string in path-parse.",
    source: "OSV"
  },
  {
    cveId: "CVE-2022-25883", packageName: "semver", ecosystem: "npm",
    affectedVersions: ["5.7.0","5.7.1","6.3.0","7.3.0","7.3.1","7.3.2","7.3.3","7.3.4","7.3.5","7.3.6","7.3.7","7.3.8"],
    versionRanges: [{ introduced: "7.0.0", fixed: "7.5.2" }],
    severity: "MEDIUM", cvssScore: 5.3,
    description: "ReDoS via crafted semver version string.",
    source: "OSV"
  },
  {
    cveId: "CVE-2023-44270", packageName: "postcss", ecosystem: "npm",
    affectedVersions: ["8.4.28","8.4.27","8.4.26","8.4.25"],
    versionRanges: [{ introduced: "8.4.0", fixed: "8.4.31" }],
    severity: "MEDIUM", cvssScore: 5.3,
    description: "Line return parsing issue in PostCSS.",
    source: "OSV"
  },
  // ── Python / PyPI ─────────────────────────────────────────────
  {
    cveId: "CVE-2022-42969", packageName: "py", ecosystem: "PyPI",
    affectedVersions: ["1.11.0"],
    versionRanges: [{ introduced: "0", fixed: "1.11.1" }],
    severity: "HIGH", cvssScore: 7.5,
    description: "ReDoS via crafted svn URL in py library.",
    source: "OSV"
  },
  {
    cveId: "CVE-2023-32681", packageName: "requests", ecosystem: "PyPI",
    affectedVersions: ["2.28.0","2.28.1","2.28.2"],
    versionRanges: [{ introduced: "2.1.0", fixed: "2.31.0" }],
    severity: "MEDIUM", cvssScore: 6.1,
    description: "Proxy-Authorization header leaked to redirect destination.",
    source: "OSV"
  },
  {
    cveId: "CVE-2022-40897", packageName: "setuptools", ecosystem: "PyPI",
    affectedVersions: ["65.0.0","65.0.1","65.0.2","65.1.0","65.1.1","65.2.0","65.3.0","65.4.0","65.4.1","65.5.0","65.5.1"],
    versionRanges: [{ introduced: "0", fixed: "65.5.1" }],
    severity: "HIGH", cvssScore: 7.5,
    description: "ReDoS via crafted HTML package index page in setuptools.",
    source: "OSV"
  },
  {
    cveId: "CVE-2023-43804", packageName: "urllib3", ecosystem: "PyPI",
    affectedVersions: ["2.0.0","2.0.1","2.0.2","2.0.3","2.0.4","2.0.5","2.0.6"],
    versionRanges: [{ introduced: "2.0.0", fixed: "2.0.7" }],
    severity: "HIGH", cvssScore: 8.8,
    description: "Cookie header not stripped on redirect to different host.",
    source: "OSV"
  },
  {
    cveId: "CVE-2023-37276", packageName: "aiohttp", ecosystem: "PyPI",
    affectedVersions: ["3.8.3","3.8.4"],
    versionRanges: [{ introduced: "3.8.0", fixed: "3.8.5" }],
    severity: "HIGH", cvssScore: 7.5,
    description: "HTTP request smuggling via crafted chunked encoding in aiohttp.",
    source: "OSV"
  },
  {
    cveId: "CVE-2023-45803", packageName: "urllib3", ecosystem: "PyPI",
    affectedVersions: ["1.26.0","1.26.1","1.26.2","1.26.3","1.26.4","1.26.5","1.26.6","1.26.7","1.26.8","1.26.9","1.26.10","1.26.11","1.26.12","1.26.13","1.26.14","1.26.15","1.26.16","1.26.17","1.26.18"],
    versionRanges: [{ introduced: "1.26.0", fixed: "1.26.19" }],
    severity: "MEDIUM", cvssScore: 4.2,
    description: "Request body not stripped for 303 redirect with non-idempotent method.",
    source: "OSV"
  }
];

module.exports = sampleVulnerabilities;
