import React, { useState } from 'react';
import { RequirementRecord, ApplicabilityState } from '../types';

interface RegulatoryScopeViewProps {
  requirements: RequirementRecord[];
  onUpdateRequirement: (req: RequirementRecord) => void;
}

export const RegulatoryScopeView: React.FC<RegulatoryScopeViewProps> = ({
  requirements,
  onUpdateRequirement
}) => {
  const [selectedReqId, setSelectedReqId] = useState<string>(requirements[0]?.requirementId || '');

  const selectedReq = requirements.find(r => r.requirementId === selectedReqId);

  const handleStateChange = (newState: ApplicabilityState) => {
    if (!selectedReq) return;
    onUpdateRequirement({
      ...selectedReq,
      applicability: newState
    });
  };

  const handleJustificationChange = (text: string) => {
    if (!selectedReq) return;
    onUpdateRequirement({
      ...selectedReq,
      applicabilityJustification: text
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Step 3 — Define Regulatory Assessment Scope &amp; Applicability</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Evaluate applicability of EASA Part-145 and Part-IS clauses. Every non-applicable or conditional determination must include a documented justification.
          </p>
        </div>
      </div>

      {/* Scope Matrix Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left List of Requirement Clauses (5 Cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
          <div className="p-3 bg-slate-50 border-b border-slate-200 font-semibold text-xs text-slate-700 flex justify-between items-center">
            <span>Regulatory Assessment Clauses ({requirements.length})</span>
            <span className="text-[11px] font-normal text-slate-400">Click to audit scope</span>
          </div>
          <div className="divide-y divide-slate-100 max-h-[580px] overflow-y-auto">
            {requirements.map(req => {
              const isSelected = req.requirementId === selectedReqId;
              return (
                <div
                  key={req.requirementId}
                  onClick={() => setSelectedReqId(req.requirementId)}
                  className={`p-3.5 cursor-pointer transition-colors ${
                    isSelected ? 'bg-blue-50/70 border-l-4 border-l-blue-600' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-bold text-slate-900">
                      {req.sectionReference}
                    </span>
                    <span className={`text-[10px] font-semibold tracking-wider ${
                      req.applicability === 'APPLICABLE' ? 'text-emerald-700' :
                      req.applicability === 'CONDITIONAL' ? 'text-blue-700' :
                      req.applicability === 'NOT_APPLICABLE' ? 'text-slate-500' :
                      'text-amber-700'
                    }`}>
                      {req.applicability}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {req.summary}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Detail & Applicability Justification Form (7 Cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
          {selectedReq ? (
            <>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    {selectedReq.requirementId} • {selectedReq.sectionReference}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {selectedReq.classification}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-2">
                  {selectedReq.summary}
                </h3>
                <span className="text-xs text-slate-500 block mt-0.5">
                  Source: {selectedReq.regulationName}
                </span>
              </div>

              {/* Full Text Box */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Original Regulatory Text Extract (EASA Easy Access Rules)
                </span>
                <p className="text-xs text-slate-700 italic leading-relaxed">
                  "{selectedReq.originalTextExtract}"
                </p>
              </div>

              {/* Applicability State Selector Buttons */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Confirmed Applicability State
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['APPLICABLE', 'CONDITIONAL', 'NOT_APPLICABLE', 'UNRESOLVED'] as ApplicabilityState[]).map(state => {
                    const isCurrent = selectedReq.applicability === state;
                    return (
                      <button
                        key={state}
                        type="button"
                        onClick={() => handleStateChange(state)}
                        className={`py-2 px-1 text-center text-xs font-semibold rounded border transition-colors cursor-pointer ${
                          isCurrent
                            ? state === 'APPLICABLE' ? 'bg-emerald-600 border-emerald-600 text-white' :
                              state === 'CONDITIONAL' ? 'bg-blue-600 border-blue-600 text-white' :
                              state === 'NOT_APPLICABLE' ? 'bg-slate-700 border-slate-700 text-white' :
                              'bg-amber-600 border-amber-600 text-white'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {state}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Justification Field (Mandatory under EASA rules) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                  <span>Documented Justification &amp; Applicability Rationale</span>
                  <span className="text-slate-400 font-normal lowercase">(required for audit trail)</span>
                </label>
                <textarea
                  rows={4}
                  value={selectedReq.applicabilityJustification}
                  onChange={e => handleJustificationChange(e.target.value)}
                  placeholder="Explain why this requirement applies, does not apply, or what conditions are required..."
                  className="w-full text-xs p-3 border border-slate-300 rounded focus:border-blue-500 focus:outline-none leading-relaxed"
                />
              </div>

              {/* Required Evidence Info */}
              <div className="p-3 bg-blue-50/50 border border-blue-100 rounded text-xs text-blue-950 space-y-1">
                <span className="font-semibold block text-blue-900">Required Audit Evidence:</span>
                <p>{selectedReq.requiredEvidence}</p>
                <div className="text-[11px] text-blue-800 pt-1">
                  Related BIM Categories: {selectedReq.relatedBimCategories.join(', ')}
                </div>
              </div>
            </>
          ) : (
            <div className="py-20 text-center text-slate-400 text-xs">
              Select a requirement clause on the left to review its scope and justification.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
