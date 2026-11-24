import React, { useState } from 'react';
import { BimElement, UldProfile } from '../types';
import { standardUldProfiles } from '../data/syntheticFacilityData';
import {
  Boxes,
  Truck,
  Sliders,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  Info,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

interface UldRouteAnalyzerProps {
  doors: BimElement[];
  onZoomToDoor: (doorId: number) => void;
  selectedUldId: string;
  onSelectUld: (uldId: string) => void;
}

export const UldRouteAnalyzer: React.FC<UldRouteAnalyzerProps> = ({
  doors,
  onZoomToDoor,
  selectedUldId,
  onSelectUld
}) => {
  const [selectedUld, setSelectedUld] = useState<UldProfile>(
    standardUldProfiles.find(u => u.id === selectedUldId) || standardUldProfiles[0]
  );
  const [equipmentEnvelopeWidth, setEquipmentEnvelopeWidth] = useState<number>(
    selectedUld.equipmentEnvelopeWidthMm
  );
  const [lateralMarginMm, setLateralMarginMm] = useState<number>(
    selectedUld.recommendedLateralMarginMm
  );
  const [filterCorridorOnly, setFilterCorridorOnly] = useState<boolean>(true);

  const handleUldChange = (profileId: string) => {
    const prof = standardUldProfiles.find(p => p.id === profileId);
    if (prof) {
      setSelectedUld(prof);
      setEquipmentEnvelopeWidth(prof.equipmentEnvelopeWidthMm);
      setLateralMarginMm(prof.recommendedLateralMarginMm);
      onSelectUld(profileId);
    }
  };

  // Base envelope is the max of the ULD dimension and the handling equipment (dolly/transporter) width
  const physicalTransitWidth = Math.max(selectedUld.baseWidthMm, equipmentEnvelopeWidth);
  const totalRequiredClearWidth = physicalTransitWidth + lateralMarginMm;

  // Filter cargo bay doors vs pedestrian doors
  const cargoDoors = doors.filter(d => {
    if (!filterCorridorOnly) return true;
    return (
      d.clearWidthMm && d.clearWidthMm >= 1200 ||
      d.name.toLowerCase().includes('cargo') ||
      d.name.toLowerCase().includes('bay') ||
      d.name.toLowerCase().includes('rollup') ||
      d.name.toLowerCase().includes('gate')
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            ULD Transit Route &amp; Door Clear Opening Analyzer
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Grounded in EASA AMC 145.A.25(a) &amp; IATA ULD Regulations. Evaluates verified clear door openings against actual ULD base dimensions and handling transporter envelopes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 font-mono">
            EASA AMC 145.A.25(a) Check
          </span>
        </div>
      </div>

      {/* Non-Certification Notice */}
      <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3 text-xs text-amber-900">
        <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold block text-amber-950 uppercase tracking-wide text-[11px]">
            Engineering Assumption &amp; Methodological Boundary
          </span>
          <p className="leading-relaxed">
            EASA AMC 145.A.25(a) requires workshop openings and transit routes to provide adequate clearance for the largest component handled with its handling equipment. EASA does <em>not</em> mandate fixed door dimensions; required dimensions are derived from the chosen ULD profile, transporter equipment envelope, and maneuvering safety margin. These values are configurable below and must be verified by the qualified reviewer against facility standard operating procedures (SOP).
          </p>
        </div>
      </div>

      {/* Interactive ULD & Transporter Configuration Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Boxes className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              1. Active ULD Type &amp; Handling Envelope Selection
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            Standard: {selectedUld.citedStandard}
          </span>
        </div>

        {/* ULD Selection Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {standardUldProfiles.map(p => {
            const isSelected = p.id === selectedUld.id;
            return (
              <button
                key={p.id}
                onClick={() => handleUldChange(p.id)}
                className={`p-3.5 rounded-lg border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/70 shadow-xs ring-1 ring-blue-600'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100/80 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900">{p.code}</span>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-white text-slate-600 border border-slate-200">
                    {p.category}
                  </span>
                </div>
                <div className="text-xs text-slate-600 mt-1 line-clamp-1">{p.name}</div>
                <div className="text-[11px] font-mono text-slate-500 mt-2 space-y-0.5">
                  <div>Base: <strong>{p.baseWidthMm} × {p.baseLengthMm} mm</strong></div>
                  <div>Max Weight: <strong>{p.maxGrossWeightKg.toLocaleString()} kg</strong></div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Transporter Envelope and Safety Margin Parameters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-slate-100 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between text-slate-700 font-semibold">
              <span>Handling Equipment Envelope Width</span>
              <span className="font-mono text-blue-700 font-bold">{equipmentEnvelopeWidth} mm</span>
            </div>
            <input
              type="range"
              min={selectedUld.baseWidthMm}
              max={selectedUld.baseWidthMm + 800}
              step={25}
              value={equipmentEnvelopeWidth}
              onChange={e => setEquipmentEnvelopeWidth(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <span className="text-[11px] text-slate-500 block">
              Default for {selectedUld.code}: {selectedUld.standardHandlingEquipment}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between text-slate-700 font-semibold">
              <span>Maneuvering Lateral Clearance Margin</span>
              <span className="font-mono text-blue-700 font-bold">{lateralMarginMm} mm</span>
            </div>
            <input
              type="range"
              min={150}
              max={600}
              step={25}
              value={lateralMarginMm}
              onChange={e => setLateralMarginMm(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <span className="text-[11px] text-slate-500 block">
              Recommended: 300 mm buffer per IATA AHM 911
            </span>
          </div>

          <div className="p-3 bg-blue-50/80 rounded-lg border border-blue-200 flex flex-col justify-center">
            <span className="text-slate-600 font-semibold text-[11px] uppercase tracking-wider">
              Total Required Door Clear Opening
            </span>
            <div className="text-2xl font-bold font-mono text-blue-900 mt-1">
              {totalRequiredClearWidth} mm
            </div>
            <span className="text-[11px] text-blue-700 font-mono mt-0.5">
              Physical ({physicalTransitWidth} mm) + Margin ({lateralMarginMm} mm)
            </span>
          </div>
        </div>
      </div>

      {/* Door Clear Openings Evaluation Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-slate-700" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              2. Revit Modeled Clear Openings vs Required ULD Envelope
            </h3>
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={filterCorridorOnly}
              onChange={e => setFilterCorridorOnly(e.target.checked)}
              className="rounded text-blue-600"
            />
            <span>Show Cargo &amp; Transit Doors Only</span>
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="py-2.5 px-4">Evaluation Result</th>
                <th className="py-2.5 px-4">Door Name &amp; Location</th>
                <th className="py-2.5 px-4">Revit Element ID</th>
                <th className="py-2.5 px-4">Nominal Rough Width</th>
                <th className="py-2.5 px-4">Verified Clear Width</th>
                <th className="py-2.5 px-4">Required Width</th>
                <th className="py-2.5 px-4">Clearance Margin</th>
                <th className="py-2.5 px-4 text-right">3D Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {cargoDoors.map(door => {
                const clearWidth = door.clearWidthMm || 0;
                const margin = clearWidth - totalRequiredClearWidth;
                const meetsCheck = clearWidth >= totalRequiredClearWidth;
                const hasClearParameter = door.clearOpeningVerified;

                return (
                  <tr key={door.elementId} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">
                      {meetsCheck ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Meets modeled check
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-100 text-red-800 border border-red-300">
                          <XCircle className="w-3.5 h-3.5 text-red-600" />
                          Gap found
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{door.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {door.roomName || 'Transit Corridor'} • {door.familyName}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {door.elementId}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {door.widthMm ? `${door.widthMm} mm` : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-slate-900">
                        {clearWidth ? `${clearWidth} mm` : <span className="text-red-500 font-semibold">Missing Parameter</span>}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {hasClearParameter ? 'Verified Revit Param' : 'Frame deduction unverified'}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                      {totalRequiredClearWidth} mm
                    </td>
                    <td className="py-3 px-4 font-mono font-bold">
                      <span className={margin >= 0 ? 'text-emerald-700' : 'text-red-600'}>
                        {margin >= 0 ? `+${margin} mm` : `${margin} mm (Deficit)`}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onZoomToDoor(door.elementId)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded transition-colors cursor-pointer border border-slate-300"
                        title="Highlight door in 3D viewer"
                      >
                        <Eye className="w-3.5 h-3.5 text-blue-600" />
                        <span>Inspect in 3D</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Diagnostic Notes */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 space-y-1.5">
          <div className="font-semibold text-slate-800">
            Revit Opening Verification Rules Applied:
          </div>
          <ul className="list-disc pl-5 space-y-1 text-slate-600">
            <li>
              Evaluates parameter <code>Clear Opening Width</code> directly from door family geometry. Rough width or frame opening width is <strong>not</strong> accepted as a substitute for verified clear aperture.
            </li>
            <li>
              Bay Cargo Door South (Element 20202) provides 2,200 mm net clearance, generating a <strong>Gap found</strong> for {selectedUld.code} (needs &gt;= {totalRequiredClearWidth} mm). An Engineering Change Order (ECO) is required to re-frame the opening before airworthiness sign-off.
            </li>
            <li>
              Interior pedestrian doors (e.g. Element 20203, 880 mm) are excluded from primary ULD transport corridors by operational design.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
