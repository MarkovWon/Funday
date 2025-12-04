import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Asset, Relationship } from '../types';

interface GraphNexusProps {
  assets: Asset[];
  relationships: Relationship[];
}

interface Node extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  type: string;
  value: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  type: string;
  strength: number;
}

const GraphNexus: React.FC<GraphNexusProps> = ({ assets, relationships }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous render

    // Data Preparation
    const nodes: Node[] = assets.map(a => ({ 
      id: a.id, 
      name: a.name, 
      type: a.type, 
      value: a.value 
    }));
    
    const links: Link[] = relationships.map(r => ({
      source: r.source,
      target: r.target,
      type: r.type,
      strength: r.strength
    }));

    // Simulation Setup
    const simulation = d3.forceSimulation<Node>(nodes)
      .force("link", d3.forceLink<Node, Link>(links).id(d => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      // Fix: Added generic <Node> to forceCollide to correctly infer node type with 'value' property
      .force("collide", d3.forceCollide<Node>().radius(d => Math.sqrt(d.value) / 10 + 20));

    // Drawing Elements
    const linkGroup = svg.append("g").attr("class", "links");
    const nodeGroup = svg.append("g").attr("class", "nodes");

    const link = linkGroup.selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", "#475569")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", d => d.strength * 5);

    const node = nodeGroup.selectAll("g")
      .data(nodes)
      .join("g")
      .call(d3.drag<SVGGElement, Node>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    // Node Visuals (Circles)
    node.append("circle")
      .attr("r", d => Math.sqrt(d.value) / 100 + 5) // Size by value
      .attr("fill", d => {
        if (d.type === 'Stock') return '#3b82f6';
        if (d.type === 'Real Estate') return '#f59e0b';
        if (d.type === 'Crypto') return '#a855f7';
        return '#64748b';
      })
      .attr("stroke", "#1e293b")
      .attr("stroke-width", 2);

    // Labels
    node.append("text")
      .text(d => d.name)
      .attr("x", 12)
      .attr("y", 4)
      .attr("fill", "#e2e8f0")
      .style("font-size", "10px")
      .style("font-family", "monospace")
      .style("pointer-events", "none");

    // Interactive Events
    node.on("mouseover", (event, d) => {
      setHoveredNode(d);
      d3.select(event.currentTarget).select("circle").attr("stroke", "#fff").attr("stroke-width", 4);
    })
    .on("mouseout", (event, d) => {
      setHoveredNode(null);
      d3.select(event.currentTarget).select("circle").attr("stroke", "#1e293b").attr("stroke-width", 2);
    });

    // Tick Function
    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as Node).x!)
        .attr("y1", d => (d.source as Node).y!)
        .attr("x2", d => (d.target as Node).x!)
        .attr("y2", d => (d.target as Node).y!);

      node
        .attr("transform", d => `translate(${d.x},${d.y})`);
    });

    // Drag Functions
    function dragstarted(event: any, d: Node) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: Node) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: Node) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [assets, relationships]);

  return (
    <div className="h-full relative flex flex-col">
       <div className="absolute top-6 left-6 z-10 pointer-events-none">
        <h2 className="text-2xl font-black text-white tracking-widest uppercase">
          <span className="text-purple-500">Nexus</span> // Relationship Graph
        </h2>
        <p className="text-slate-400">Ownership structures and asset correlations.</p>
      </div>

      <div ref={containerRef} className="flex-1 w-full h-full bg-slate-900/50 relative overflow-hidden">
        {/* Grid Background Effect */}
        <div className="absolute inset-0 opacity-10" 
             style={{ 
               backgroundImage: 'radial-gradient(circle, #334155 1px, transparent 1px)', 
               backgroundSize: '20px 20px' 
             }} 
        />
        
        <svg ref={svgRef} className="w-full h-full" />

        {/* Floating Info HUD */}
        {hoveredNode && (
          <div className="absolute bottom-6 right-6 bg-slate-800/90 backdrop-blur border border-purple-500/30 p-4 rounded-lg shadow-2xl max-w-xs z-20">
            <h4 className="font-bold text-white">{hoveredNode.name}</h4>
            <div className="h-px w-full bg-purple-500/50 my-2"></div>
            <p className="text-sm text-slate-300">Type: <span className="text-white">{hoveredNode.type}</span></p>
            <p className="text-sm text-slate-300">Value: <span className="text-white">${hoveredNode.value.toLocaleString()}</span></p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GraphNexus;