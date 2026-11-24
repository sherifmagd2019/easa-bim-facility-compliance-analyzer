import React, { useState } from 'react';
import { ModelCompletenessReport, BimElement } from '../types';
import { AlertTriangle, Info } from 'lucide-react';

interface ModelCompletenessViewProps {
  report: ModelCompletenessReport;
  rooms: BimElement[];
  doors: BimElement[];
  equipment: BimElement[];
  onSelectElement: (el: BimElement) => void;
}

export const ModelCompletenessView: React.FC<ModelCompletenessViewProps> = ({
  report,
  rooms,
  doors,
  equipment,
  onSelectElement
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'summary' | 'rooms' | 'equipment' | 'mappings'>('summary');

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Step 2 — BIM Model Inspection &amp; Completeness Dashboard</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Non-destructive audit of the active Revit 2027 document. Evaluates room spatial enclosures, door clearances, and parameter completeness.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono bg-slate-100 text-slate-700 px-3 py-1.5 rounded border border-slate-200">
            FRA-ULD-MNT-2027-R03.rvt (LOD 350)
          </span>
        </div>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-lg">
          <div className="text-xs text-slate-500 font-medium">Elements Inspected</div>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">{report.elementsInspected}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">{report.elementsExcluded} auxiliary excluded</div>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-lg">
          <div className="text-xs text-slate-500 font-medium">Audited Rooms</div>
          <div className="text-2xl font-bold text-blue-600 mt-1 font-mono">{report.roomsInspected}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Zoned &amp; enclosed</div>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-lg">
          <div className="text-xs text-slate-500 font-medium">Door Openings</div>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">{report.doorsInspected}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Clearance checked</div>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-lg">
          <div className="text-xs text-slate-500 font-medium">Tooling / Equipment</div>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">{report.equipmentInspected}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Asset tags evaluated</div>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-lg">
          <div className="text-xs text-slate-500 font-medium">Completeness Score</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1 font-mono">{report.overallCompletenessScore}%</div>
          <div className="text-[11px] text-emerald-700 mt-0.5">High fidelity LOD 350</div>
        </div>
      </div>

      {/* Navigation Sub-tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveSubTab('summary')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeSubTab === 'summary'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Quality &amp; Limitation Notes
        </button>
        <button
          onClick={() => setActiveSubTab('rooms')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeSubTab === 'rooms'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Extracted Rooms ({rooms.length})
        </button>
        <button
          onClick={() => setActiveSubTab('equipment')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeSubTab === 'equipment'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Extracted Tooling &amp; Equipment ({equipment.length})
        </button>
        <button
          onClick={() => setActiveSubTab('mappings')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeSubTab === 'mappings'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Parameter Mappings
        </button>
      </div>

      {/* Subtab 1: Summary & Limitations */}
      {activeSubTab === 'summary' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Identified Model Parameter Deficiencies</span>
            </h3>
            <div className="space-y-3">
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded text-xs text-amber-900 space-y-1">
                <span className="font-semibold block">Missing Equipment Asset Parameters</span>
                <p>
                  Pneumatic Riveter #2 (Revit Element ID 30302) lacks <code>AssetID</code> and <code>CalibrationDue</code> parameters in its instance property table.
                </p>
              </div>
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded text-xs text-amber-900 space-y-1">
                <span className="font-semibold block">Unassigned Functional Room Name</span>
                <p>
                  Room 109 retains generic placeholder title <code>"Room 109"</code> without designated operational classification.
                </p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700 space-y-1">
                <span className="font-semibold block">Door Clear Width Warning</span>
                <p>
                  Bay Door South (Element 20202) clear width is 2,200 mm, triggering an automatic regulatory nonconformity check against PMC pallet transit.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-500" />
              <span>Model Data Limitations &amp; Exclusions</span>
            </h3>
            <ul className="space-y-2 text-xs text-slate-600 list-disc pl-4">
              {report.modelLimitations.map((lim, i) => (
                <li key={i} className="leading-relaxed">
                  {lim}
                </li>
              ))}
              <li className="leading-relaxed">
                Revit geometry does not prove physical dust containment or air pressure differentials; documentary verification of HVAC commissioning is mandatory.
              </li>
              <li className="leading-relaxed">
                The presence of physical locks and keycard readers in BIM must be substantiated with an approved key-custody procedure in the MOE.
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Subtab 2: Extracted Rooms */}
      {activeSubTab === 'rooms' && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-2.5 px-4">Room #</th>
                <th className="py-2.5 px-4">Room Name</th>
                <th className="py-2.5 px-4">Area (m²)</th>
                <th className="py-2.5 px-4">Revit Element ID</th>
                <th className="py-2.5 px-4">UniqueId</th>
                <th className="py-2.5 px-4">Department / Purpose</th>
                <th className="py-2.5 px-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {rooms.map(rm => (
                <tr key={rm.elementId} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-4 font-mono font-medium">{rm.roomNumber}</td>
                  <td className="py-2.5 px-4 font-semibold text-slate-900">{rm.roomName}</td>
                  <td className="py-2.5 px-4 font-mono">{rm.areaSqM?.toFixed(1)} m²</td>
                  <td className="py-2.5 px-4 font-mono text-slate-500">{rm.elementId}</td>
                  <td className="py-2.5 px-4 font-mono text-[11px] text-slate-400">{rm.uniqueId}</td>
                  <td className="py-2.5 px-4 text-slate-600">{rm.parameters['Department'] || 'General'}</td>
                  <td className="py-2.5 px-4">
                    <button
                      onClick={() => onSelectElement(rm)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-medium transition-colors cursor-pointer"
                    >
                      Inspect in 3D
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Subtab 3: Equipment */}
      {activeSubTab === 'equipment' && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-2.5 px-4">Asset ID</th>
                <th className="py-2.5 px-4">Equipment Description</th>
                <th className="py-2.5 px-4">Room Location</th>
                <th className="py-2.5 px-4">Revit ID</th>
                <th className="py-2.5 px-4">Calibration Due</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {equipment.map(eq => {
                const hasAssetId = !!eq.parameters['AssetID'];
                return (
                  <tr key={eq.elementId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-semibold">
                      {eq.parameters['AssetID'] || <span className="text-amber-600">[MISSING]</span>}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">{eq.name}</td>
                    <td className="py-2.5 px-4">{eq.roomName}</td>
                    <td className="py-2.5 px-4 font-mono text-slate-500">{eq.elementId}</td>
                    <td className="py-2.5 px-4 font-mono">
                      {eq.parameters['CalibrationDue'] || <span className="text-slate-400">N/A</span>}
                    </td>
                    <td className="py-2.5 px-4">
                      {hasAssetId ? (
                        <span className="text-emerald-700 font-medium">Identified</span>
                      ) : (
                        <span className="text-amber-700 font-medium">Missing Parameter</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4">
                      <button
                        onClick={() => onSelectElement(eq)}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-medium transition-colors cursor-pointer"
                      >
                        Inspect in 3D
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Subtab 4: Parameter Mappings */}
      {activeSubTab === 'mappings' && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Configured Shared Parameter Mappings</h3>
          <p className="text-xs text-slate-500">
            Defines how Revit instance and type parameters map to standard EASA compliance evaluation fields.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded">
              <span className="text-xs font-bold text-slate-900 block mb-2">Room Categories</span>
              <ul className="text-xs space-y-1 font-mono text-slate-600">
                <li>Name → Room Name, Function</li>
                <li>Number → Room Number</li>
                <li>Area → Area (m²)</li>
                <li>Department → Department, Occupancy</li>
              </ul>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded">
              <span className="text-xs font-bold text-slate-900 block mb-2">Door Openings</span>
              <ul className="text-xs space-y-1 font-mono text-slate-600">
                <li>ClearWidth → Clear Width, Rough Width</li>
                <li>ClearHeight → Clear Height, Frame Height</li>
                <li>AccessControl → Security Level, Keycard</li>
              </ul>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded">
              <span className="text-xs font-bold text-slate-900 block mb-2">Equipment &amp; Tools</span>
              <ul className="text-xs space-y-1 font-mono text-slate-600">
                <li>AssetID → AssetID, Tag, Mark</li>
                <li>CalibrationDue → Calibration Due Date</li>
                <li>Workstation → Room, Associated Space</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
