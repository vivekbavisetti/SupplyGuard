const Component = require('../models/Component');

async function parseCycloneDX(sbomJson, projectId) {
  const data = typeof sbomJson === 'string' ? JSON.parse(sbomJson) : sbomJson;

  const results = {
    format: data.bomFormat || 'CycloneDX',
    specVersion: data.specVersion || 'unknown',
    serialNumber: data.serialNumber || '',
    componentCount: 0,
    components: []
  };

  const rawComponents = data.components || [];
  const dependencies = data.dependencies || [];

  // Build sets for direct and depth mapping
  const depthMap = {};
  const directSet = new Set();

  // First entry in dependencies is the root project
  if (dependencies.length > 0) {
    const root = dependencies[0];
    const directDeps = root.dependsOn || [];
    directDeps.forEach(ref => directSet.add(ref));
  }

  // BFS to compute depth of each component
  function computeDepths() {
    const visited = new Set();
    const queue = [];

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

  // Delete existing components for this project (fresh re-upload)
  await Component.deleteMany({ projectId });

  const componentDocs = [];

  for (const comp of rawComponents) {
    const purl = comp.purl || '';
    const ref = comp['bom-ref'] || purl || comp.name;
    const isDirect = directSet.has(ref);
    const depth = depthMap[ref] !== undefined ? depthMap[ref] : (isDirect ? 0 : 1);

    const licenses = [];
    if (comp.licenses) {
      for (const l of comp.licenses) {
        if (l.license && l.license.id) licenses.push(l.license.id);
        else if (l.license && l.license.name) licenses.push(l.license.name);
      }
    }

    componentDocs.push({
      projectId,
      name: comp.name,
      version: comp.version || 'unknown',
      type: comp.type || 'library',
      purl,
      licenses,
      isDirect,
      depth
    });
  }

  const saved = await Component.insertMany(componentDocs);
  results.componentCount = saved.length;
  results.components = saved;

  return results;
}

module.exports = { parseCycloneDX };
