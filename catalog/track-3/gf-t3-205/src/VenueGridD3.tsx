/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface Venue {
  id: string;
  name: string;
  type: string;
  base_price: number;
  depth_units: number;
  latency_ms: number;
  fee_bps: number;
  status: string;
  reliability: number;
}

interface VenueGridD3Props {
  venues: Venue[];
  onSelectVenue?: (venueId: string) => void;
}

export default function VenueGridD3({ venues }: VenueGridD3Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 600;
    const height = 360;
    const margin = { top: 40, right: 40, bottom: 50, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Scales
    // Latency (X-axis): 0 to 15 ms
    const xScale = d3.scaleLinear()
      .domain([0, 15])
      .range([0, innerWidth]);

    // Fill Probability (Y-axis): 0.95 to 1.0 (95% to 100%)
    const yScale = d3.scaleLinear()
      .domain([0.95, 1.0])
      .range([innerHeight, 0]);

    // Background Zones (Optimal Zone vs High Latency Zone)
    // Optimal Zone: Latency < 5ms, Fill Prob > 0.99
    g.append("rect")
      .attr("x", xScale(0))
      .attr("y", yScale(1.0))
      .attr("width", xScale(5) - xScale(0))
      .attr("height", yScale(0.99) - yScale(1.0))
      .attr("fill", "#065F46")
      .attr("opacity", 0.15);

    g.append("text")
      .attr("x", xScale(2.5))
      .attr("y", yScale(0.995))
      .attr("fill", "#10B981")
      .attr("font-size", "12px")
      .attr("font-weight", "bold")
      .attr("text-anchor", "middle")
      .text("OPTIMAL ROUTING ZONE");

    // Danger / Caution Zone
    g.append("rect")
      .attr("x", xScale(5))
      .attr("y", yScale(0.99))
      .attr("width", xScale(15) - xScale(5))
      .attr("height", yScale(0.95) - yScale(0.99))
      .attr("fill", "#78350F")
      .attr("opacity", 0.15);

    g.append("text")
      .attr("x", xScale(10))
      .attr("y", yScale(0.97))
      .attr("fill", "#F59E0B")
      .attr("font-size", "12px")
      .attr("font-weight", "bold")
      .attr("text-anchor", "middle")
      .text("LATENCY PENALTY ZONE");

    // Grid lines
    const xAxes = d3.axisBottom(xScale).ticks(6).tickSize(-innerHeight);
    const yAxes = d3.axisLeft(yScale).ticks(5).tickSize(-innerWidth).tickFormat(d => `${(Number(d) * 100).toFixed(0)}%`);

    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(xAxes)
      .attr("color", "#334155")
      .selectAll("text")
      .attr("fill", "#94A3B8")
      .attr("font-size", "12px");

    g.append("g")
      .call(yAxes)
      .attr("color", "#334155")
      .selectAll("text")
      .attr("fill", "#94A3B8")
      .attr("font-size", "12px");

    // Axis labels
    g.append("text")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight + 40)
      .attr("fill", "#E2E8F0")
      .attr("font-size", "12px")
      .attr("font-weight", "bold")
      .attr("text-anchor", "middle")
      .text("Queue Latency (ms)");

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -innerHeight / 2)
      .attr("y", -45)
      .attr("fill", "#E2E8F0")
      .attr("font-size", "12px")
      .attr("font-weight", "bold")
      .attr("text-anchor", "middle")
      .text("Fill Probability (%)");

    // Venue data points (simulate fill probability based on reliability and latency)
    const venuePoints = venues.map(v => {
      const fillProb = Math.min(1.0, Math.max(0.95, v.reliability * Math.exp(-0.02 * v.latency_ms)));
      return { ...v, fillProb };
    });

    // Tooltip div
    const tooltip = d3.select("body").selectAll(".d3-tooltip").data([0]).join("div")
      .attr("class", "d3-tooltip")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background", "#0F172A")
      .style("color", "#F8FAFC")
      .style("border", "1px solid #334155")
      .style("padding", "8px 12px")
      .style("border-radius", "6px")
      .style("font-size", "12px")
      .style("font-family", "monospace")
      .style("box-shadow", "0 10px 15px -3px rgba(0, 0, 0, 0.5)")
      .style("z-index", "9999");

    // Plot points
    const circles = g.selectAll(".venue-node")
      .data(venuePoints)
      .enter()
      .append("g")
      .attr("class", "venue-node")
      .attr("transform", d => `translate(${xScale(Math.min(15, d.latency_ms))},${yScale(d.fillProb)})`);

    circles.append("circle")
      .attr("r", 8)
      .attr("fill", d => d.status === "ACTIVE" ? "#06B6D4" : "#EF4444")
      .attr("stroke", "#0A0D14")
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .on("mouseover", (event, d) => {
        d3.select(event.target as SVGCircleElement).transition().duration(150).attr("r", 12);
        tooltip.style("visibility", "visible")
          .html(`<strong>${d.name}</strong><br/>Latency: ${d.latency_ms} ms<br/>Fill Prob: ${(d.fillProb * 100).toFixed(2)}%<br/>Status: ${d.status}`);
      })
      .on("mousemove", (event) => {
        tooltip.style("top", `${event.pageY - 40}px`).style("left", `${event.pageX + 15}px`);
      })
      .on("mouseout", (event) => {
        d3.select(event.target as SVGCircleElement).transition().duration(150).attr("r", 8);
        tooltip.style("visibility", "hidden");
      });

    circles.append("text")
      .attr("x", 12)
      .attr("y", 4)
      .attr("fill", "#CBD5E1")
      .attr("font-size", "11px")
      .attr("font-weight", "600")
      .text(d => d.id);

  }, [venues]);

  return (
    <div className="bg-[#111726] border border-slate-800 rounded-lg p-5 space-y-4 shadow-lg">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-base font-bold text-slate-100">Venue Latency vs Fill Probability Map</h3>
          <p className="text-xs text-slate-400">2D D3 Matrix mapping queue delay against execution probability for optimal routing zones.</p>
        </div>
        <div className="flex items-center space-x-3 text-xs">
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Optimal Zone
          </span>
          <span className="flex items-center gap-1 text-cyan-400">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block"></span> Active Venue
          </span>
        </div>
      </div>
      <div className="w-full overflow-x-auto flex justify-center bg-[#0A0D14] rounded-md p-2 border border-slate-800">
        <svg ref={svgRef} className="w-full max-w-[600px] h-[360px]" />
      </div>
    </div>
  );
}
