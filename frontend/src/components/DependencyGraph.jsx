import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const SEV_COLOR = { CRITICAL: '#ef4444', HIGH: '#f97316', MEDIUM: '#f59e0b', LOW: '#22c55e' };

export default function DependencyGraph({ nodes, links }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!nodes || nodes.length === 0) return;
    const el = svgRef.current;
    d3.select(el).selectAll('*').remove();

    const W = el.clientWidth  || 700;
    const H = el.clientHeight || 480;

    const svg = d3.select(el)
      .attr('width', W).attr('height', H);

    // Zoom
    const g = svg.append('g');
    svg.call(d3.zoom().scaleExtent([0.3, 3])
      .on('zoom', e => g.attr('transform', e.transform)));

    // Arrow marker
    svg.append('defs').append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 18).attr('refY', 0)
      .attr('markerWidth', 6).attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path').attr('d', 'M0,-5L10,0L0,5').attr('fill', '#94a3b8');

    const sim = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(90).strength(0.6))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(W / 2, H / 2))
      .force('collision', d3.forceCollide(28));

    const link = g.append('g')
      .selectAll('line').data(links).join('line')
      .attr('stroke', '#cbd5e1').attr('stroke-width', 1.2)
      .attr('marker-end', 'url(#arrow)');

    const node = g.append('g')
      .selectAll('g').data(nodes).join('g')
      .call(d3.drag()
        .on('start', (e, d) => { if (!e.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on('drag',  (e, d) => { d.fx = e.x; d.fy = e.y; })
        .on('end',   (e, d) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null; }));

    // Circle
    node.append('circle')
      .attr('r', d => d.isDirect ? 14 : 10)
      .attr('fill', d => {
        if (d.vuln) return SEV_COLOR[d.vuln.severity] || '#94a3b8';
        return d.isDirect ? '#3b82f6' : '#94a3b8';
      })
      .attr('stroke', d => d.isDirect ? '#1d4ed8' : '#64748b')
      .attr('stroke-width', 2)
      .attr('opacity', 0.9);

    // Label
    node.append('text')
      .text(d => d.name.length > 14 ? d.name.slice(0, 12) + '…' : d.name)
      .attr('text-anchor', 'middle').attr('dy', '2.4em')
      .attr('font-size', '10px').attr('fill', '#334155');

    // Tooltip
    node.append('title')
      .text(d => `${d.name}@${d.version}\n${d.isDirect ? 'Direct' : 'Transitive (depth ' + d.depth + ')'}\n${d.vuln ? '⚠ ' + d.vuln.severity + ' (' + d.vuln.count + ' CVEs)' : 'No known vulns'}`);

    sim.on('tick', () => {
      link
        .attr('x1', d => d.source.x).attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x).attr('y2', d => d.target.y);
      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    return () => sim.stop();
  }, [nodes, links]);

  return (
    <div style={{ width: '100%' }}>
      {/* Legend */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', padding: '10px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '12px' }}>
        {[
          { color: '#3b82f6', label: 'Direct (no vuln)' },
          { color: '#94a3b8', label: 'Transitive (no vuln)' },
          { color: '#ef4444', label: 'CRITICAL vuln' },
          { color: '#f97316', label: 'HIGH vuln' },
          { color: '#f59e0b', label: 'MEDIUM vuln' },
          { color: '#22c55e', label: 'LOW vuln' },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: l.color }} />
            <span style={{ color: '#64748b' }}>{l.label}</span>
          </div>
        ))}
        <span style={{ color: '#94a3b8', marginLeft: 'auto' }}>Scroll to zoom · Drag nodes</span>
      </div>
      <svg ref={svgRef} style={{ width: '100%', height: '460px', display: 'block', background: '#fafafa' }} />
    </div>
  );
}
