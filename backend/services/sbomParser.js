const Component = require('../models/Component');
const YAML = require('yaml');

// ── CycloneDX 1.4 JSON parser ─────────────────────────────────────────────────
async function parseCycloneDX(sbomJson, projectId) {
  const data = typeof sbomJson === 'string' ? JSON.parse(sbomJson) : sbomJson;

  const rawComponents = data.components || [];
  const dependencies  = data.dependencies || [];

  const directSet = new Set();
  const depthMap  = {};

  // First entry in dependencies array is the root application
  if (dependencies.length > 0) {
    const root = dependencies[0];
    (root.dependsOn || []).forEach(ref => directSet.add(ref));
  }

  // BFS to calculate depth of every component
  function computeDepths() {
    const visited = new Set();
    const queue   = [];

    if (dependencies.length > 0) {
      const root = dependencies[0];
      (root.dependsOn || []).forEach(ref => {
        queue.push({ ref, depth: 0 });
        depthMap[ref] = 0;
      });
    }

    while (queue.length > 0) {
      const { ref, depth } = queue.shift();
      if (visited.has(ref)) continue;
      visited.add(ref);

      const node = dependencies.find(d => d.ref === ref);
      if (node && node.dependsOn) {
        node.dependsOn.forEach(childRef => {
          if (!(childRef in depthMap)) {
            depthMap[childRef] = depth + 1;
            queue.push({ ref: childRef, depth: depth + 1 });
          }
        });
      }
    }
  }

  computeDepths();
  await Component.deleteMany({ projectId });

  const componentDocs = [];

  for (const comp of rawComponents) {
    const purl     = comp.purl || '';
    const bomRef   = comp['bom-ref'] || purl || comp.name;
    const isDirect = directSet.has(bomRef);
    const depth    = depthMap[bomRef] !== undefined ? depthMap[bomRef] : (isDirect ? 0 : 1);

    // Extract dependsOn refs for this component (for graph)
    const depNode   = dependencies.find(d => d.ref === bomRef);
    const dependsOn = depNode ? (depNode.dependsOn || []) : [];

    const licenses = [];
    if (comp.licenses) {
      for (const l of comp.licenses) {
        if (l.license?.id)   licenses.push(l.license.id);
        else if (l.license?.name) licenses.push(l.license.name);
      }
    }

    // Detect ecosystem from purl
    let ecosystem = 'Unknown';
    if (purl.startsWith('pkg:maven'))  ecosystem = 'Maven';
    else if (purl.startsWith('pkg:npm')) ecosystem = 'npm';
    else if (purl.startsWith('pkg:pypi')) ecosystem = 'PyPI';
    else if (purl.startsWith('pkg:cargo')) ecosystem = 'crates.io';
    else if (purl.startsWith('pkg:gem')) ecosystem = 'RubyGems';
    else if (purl.startsWith('pkg:golang')) ecosystem = 'Go';

    componentDocs.push({
      projectId, name: comp.name,
      version: comp.version || 'unknown',
      type: comp.type || 'library',
      purl, bomRef, ecosystem, licenses,
      isDirect, depth, dependsOn
    });
  }

  const saved = await Component.insertMany(componentDocs);
  return {
    format: data.bomFormat || 'CycloneDX',
    specVersion: data.specVersion || 'unknown',
    serialNumber: data.serialNumber || '',
    componentCount: saved.length,
    components: saved
  };
}

// ── SPDX 2.3 JSON parser ─────────────────────────────────────────────────────
async function parseSPDX(sbomData, projectId) {
  const data = typeof sbomData === 'string' ? JSON.parse(sbomData) : sbomData;

  await Component.deleteMany({ projectId });

  const packages      = data.packages || [];
  const relationships = data.relationships || [];

  // Build direct dependency set from DESCRIBES + DEPENDS_ON relationships
  const directSet = new Set();
  const depMap    = {};

  relationships.forEach(r => {
    if (r.relationshipType === 'DEPENDS_ON') {
      if (!depMap[r.spdxElementId]) depMap[r.spdxElementId] = [];
      depMap[r.spdxElementId].push(r.relatedSpdxElement);
    }
    if (r.relationshipType === 'DESCRIBES') {
      // root element DESCRIBES direct deps
      (relationships
        .filter(r2 => r2.relationshipType === 'DEPENDS_ON' && r2.spdxElementId === r.relatedSpdxElement)
        .forEach(r2 => directSet.add(r2.relatedSpdxElement)));
    }
  });

  // BFS for depth
  const depthMap = {};
  const visited  = new Set();
  const queue    = [];

  directSet.forEach(ref => {
    queue.push({ ref, depth: 0 });
    depthMap[ref] = 0;
  });

  while (queue.length > 0) {
    const { ref, depth } = queue.shift();
    if (visited.has(ref)) continue;
    visited.add(ref);
    (depMap[ref] || []).forEach(childRef => {
      if (!(childRef in depthMap)) {
        depthMap[childRef] = depth + 1;
        queue.push({ ref: childRef, depth: depth + 1 });
      }
    });
  }

  // Skip the root document package (SPDXID: SPDXRef-DOCUMENT)
  const pkgsToProcess = packages.filter(p =>
    p.SPDXID !== 'SPDXRef-DOCUMENT' && p.name !== data.name
  );

  const componentDocs = pkgsToProcess.map(pkg => {
    const spdxId   = pkg.SPDXID || '';
    const isDirect = directSet.has(spdxId) || (directSet.size === 0);
    const depth    = depthMap[spdxId] !== undefined ? depthMap[spdxId] : (isDirect ? 0 : 1);

    // Extract purl from externalRefs
    let purl = '';
    if (pkg.externalRefs) {
      const purlRef = pkg.externalRefs.find(r => r.referenceType === 'purl');
      if (purlRef) purl = purlRef.referenceLocator;
    }

    let ecosystem = 'Unknown';
    if (purl.startsWith('pkg:maven'))   ecosystem = 'Maven';
    else if (purl.startsWith('pkg:npm')) ecosystem = 'npm';
    else if (purl.startsWith('pkg:pypi')) ecosystem = 'PyPI';

    const licenses = [];
    if (pkg.licenseConcluded && pkg.licenseConcluded !== 'NOASSERTION')
      licenses.push(pkg.licenseConcluded);

    return {
      projectId,
      name: pkg.name,
      version: pkg.versionInfo || 'unknown',
      type: 'library',
      purl, bomRef: spdxId,
      ecosystem, licenses,
      isDirect, depth,
      dependsOn: (depMap[spdxId] || [])
    };
  });

  const saved = await Component.insertMany(componentDocs);
  return {
    format: 'SPDX',
    specVersion: data.spdxVersion || '2.3',
    serialNumber: data.SPDXID || '',
    componentCount: saved.length,
    components: saved
  };
}

// ── SPDX YAML parser ─────────────────────────────────────────────────────────
async function parseSPDXYaml(yamlString, projectId) {
  const data = YAML.parse(yamlString);
  return parseSPDX(data, projectId);
}

// ── Auto-detect format and dispatch ──────────────────────────────────────────
async function parseSBOM(content, projectId, filename = '') {
  let data;
  const isYaml = filename.endsWith('.yaml') || filename.endsWith('.yml');

  if (isYaml) {
    return parseSPDXYaml(content, projectId);
  }

  try {
    data = typeof content === 'string' ? JSON.parse(content) : content;
  } catch {
    throw new Error('Could not parse SBOM: invalid JSON');
  }

  if (data.bomFormat === 'CycloneDX') return parseCycloneDX(data, projectId);
  if (data.spdxVersion)               return parseSPDX(data, projectId);

  throw new Error('Unknown SBOM format. Supported: CycloneDX 1.4 JSON, SPDX 2.3 JSON/YAML');
}

module.exports = { parseCycloneDX, parseSPDX, parseSPDXYaml, parseSBOM };
