import { scaleLinear } from 'd3-scale';
import { interpolateRgb } from 'd3-interpolate';
import { BimElement, Finding, SeverityLevel } from '../types';

export type HeatMapScheme = 'safety' | 'turbo' | 'viridis';
export type HeatMapMetric = 'max_severity' | 'risk_score' | 'finding_count';

export interface ElementHeatData {
  elementId: number;
  maxSeverity: SeverityLevel | 'Compliant';
  normalizedValue: number; // 0.0 (Compliant) to 1.0 (Critical)
  riskScore: number;
  findingCount: number;
  activeFindings: Finding[];
  primaryFinding?: Finding;
  colorHex: string;
}

// Severity weight mapping
export const SEVERITY_WEIGHTS: Record<SeverityLevel | 'Compliant', number> = {
  Critical: 1.0,
  High: 0.75,
  Medium: 0.5,
  Low: 0.25,
  Informational: 0.12,
  Compliant: 0.0,
};

// D3 color interpolator builders
export const createD3HeatScale = (scheme: HeatMapScheme) => {
  switch (scheme) {
    case 'turbo':
      return scaleLinear<string>()
        .domain([0.0, 0.25, 0.5, 0.75, 1.0])
        .range(['#2563eb', '#06b6d4', '#10b981', '#f59e0b', '#dc2626'])
        .interpolate(interpolateRgb);

    case 'viridis':
      return scaleLinear<string>()
        .domain([0.0, 0.25, 0.5, 0.75, 1.0])
        .range(['#440154', '#3b528b', '#21918c', '#5ec962', '#fde725'])
        .interpolate(interpolateRgb);

    case 'safety':
    default:
      return scaleLinear<string>()
        .domain([0.0, 0.25, 0.5, 0.75, 1.0])
        .range(['#10b981', '#0ea5e9', '#eab308', '#f97316', '#ef4444'])
        .interpolate(interpolateRgb);
  }
};

/**
 * Computes compliance heat data for all BIM elements based on findings
 */
export function computeFacilityHeatMap(
  elements: BimElement[],
  findings: Finding[],
  scheme: HeatMapScheme = 'safety',
  metric: HeatMapMetric = 'max_severity'
): Map<number, ElementHeatData> {
  const heatMap = new Map<number, ElementHeatData>();
  const d3Scale = createD3HeatScale(scheme);

  elements.forEach(el => {
    // 1. Direct element findings
    const directFindings = findings.filter(f => f.revitElementId === el.elementId);
    
    // 2. Room contextual findings
    const roomFindings = el.category === 'Room'
      ? findings.filter(f => 
          f.affectedRoomOrZone?.toLowerCase().includes(el.name.toLowerCase()) ||
          (el.roomNumber && f.affectedRoomOrZone?.includes(el.roomNumber))
        )
      : [];

    const allFindings = Array.from(new Set([...directFindings, ...roomFindings]));

    // Distinguish gaps and review items from passed checks
    const activeFindings = allFindings.filter(f => f.status === 'Gap found' || f.status === 'Needs human review');

    let maxSeverity: SeverityLevel | 'Compliant' = 'Compliant';
    let riskScore = 0;

    if (activeFindings.length > 0) {
      if (activeFindings.some(f => f.severity === 'Critical')) {
        maxSeverity = 'Critical';
      } else if (activeFindings.some(f => f.severity === 'High')) {
        maxSeverity = 'High';
      } else if (activeFindings.some(f => f.severity === 'Medium')) {
        maxSeverity = 'Medium';
      } else if (activeFindings.some(f => f.severity === 'Low')) {
        maxSeverity = 'Low';
      } else {
        maxSeverity = 'Informational';
      }

      activeFindings.forEach(f => {
        if (f.severity === 'Critical') riskScore += 10;
        else if (f.severity === 'High') riskScore += 6;
        else if (f.severity === 'Medium') riskScore += 3;
        else if (f.severity === 'Low') riskScore += 1;
        else riskScore += 0.5;
      });
    } else if (allFindings.some(f => f.status === 'Meets modeled check')) {
      maxSeverity = 'Compliant';
      riskScore = 0;
    }

    let normalizedValue = 0;
    if (metric === 'max_severity') {
      normalizedValue = SEVERITY_WEIGHTS[maxSeverity];
    } else if (metric === 'risk_score') {
      normalizedValue = Math.min(1.0, riskScore / 10.0);
    } else if (metric === 'finding_count') {
      normalizedValue = Math.min(1.0, activeFindings.length / 3.0);
    }

    const colorHex = d3Scale(normalizedValue);

    const primaryFinding = activeFindings.length > 0
      ? activeFindings.sort((a, b) => SEVERITY_WEIGHTS[b.severity] - SEVERITY_WEIGHTS[a.severity])[0]
      : allFindings[0];

    heatMap.set(el.elementId, {
      elementId: el.elementId,
      maxSeverity,
      normalizedValue,
      riskScore,
      findingCount: activeFindings.length,
      activeFindings,
      primaryFinding,
      colorHex
    });
  });

  return heatMap;
}

export function getLegendItems(
  heatMap: Map<number, ElementHeatData>,
  scheme: HeatMapScheme
): { label: string; color: string; count: number; severity: SeverityLevel | 'Compliant'; description?: string }[] {
  const d3Scale = createD3HeatScale(scheme);
  const data = Array.from(heatMap.values());

  return [
    {
      label: 'Critical Gap',
      severity: 'Critical',
      color: d3Scale(1.0),
      count: data.filter(d => d.maxSeverity === 'Critical').length,
      description: 'Critical nonconformity requiring architectural or structural remediation'
    },
    {
      label: 'High Severity Gap',
      severity: 'High',
      color: d3Scale(0.75),
      count: data.filter(d => d.maxSeverity === 'High').length,
      description: 'High risk gap requiring hardware modification or approved procedure'
    },
    {
      label: 'Medium / Review',
      severity: 'Medium',
      color: d3Scale(0.5),
      count: data.filter(d => d.maxSeverity === 'Medium').length,
      description: 'Item requiring human reviewer inspection or parameter completion'
    },
    {
      label: 'Low / Minor',
      severity: 'Low',
      color: d3Scale(0.25),
      count: data.filter(d => d.maxSeverity === 'Low').length,
      description: 'Minor or informational deviation'
    },
    {
      label: 'Meets Modeled Check',
      severity: 'Compliant',
      color: d3Scale(0.0),
      count: data.filter(d => d.maxSeverity === 'Compliant').length,
      description: 'Element satisfies all modeled architectural rule checks'
    }
  ];
}
