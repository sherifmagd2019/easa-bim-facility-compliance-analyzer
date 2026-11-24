import React, { useState } from 'react';
import { Finding, ComplianceStatus, ReviewerDecision, ReviewerOverride } from '../types';
import {
  Search,
  Eye,
  Focus,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  ShieldAlert,
  UserCheck,
  Clock,
  ExternalLink,
  Edit3
} from 'lucide-react';

interface FindingsExplorerViewProps {
  findings: Finding[];
  selectedFindingId: string | null;
  onSelectFinding: (finding: Finding) => void;
  onZoomToElement: (elementId: number) => void;
  onIsolateElement: (elementId: number) => void;
  onUpdateFinding?: (updated: Finding) => void;
}

export const FindingsExplorerView: React.FC<FindingsExplorerViewProps> = ({
  findings,
  selectedFindingId,
  onSelectFinding,
  onZoomToElement,
  onIsolateElement,
  onUpdateFinding
}) => {
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Override dialog state
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [overrideReviewerName, setOverrideReviewerName] = useState('Marcus Vance, Lead Auditor');
  const [overrideReviewerRole, setOverrideReviewerRole] = useState('Quality & Airworthiness Director (Part-66 / QA)');
  const [overrideNewStatus, setOverrideNewStatus] = useState<ComplianceStatus>('Needs human review');
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideEvidenceRef, setOverrideEvidenceRef] = useState('');

  const selectedFinding = findings.find(f => f.findingId === selectedFindingId) || findings[0];

  const filtered = findings.filter(f => {
    const matchesSearch = 
      f.findingId.toLowerCase().includes(searchText.toLowerCase()) ||
      f.regulatoryReference.toLowerCase().includes(searchText.toLowerCase()) ||
      f.description.toLowerCase().includes(searchText.toLowerCase()) ||
      f.affectedRoomOrZone.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || f.status === statusFilter;
    const matchesSeverity = severityFilter === 'ALL' || f.severity === severityFilter;
    return matchesSearch && matchesStatus && matchesSeverity;
  });

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenOverrideModal = () => {
    if (!selectedFinding) return;
    setOverrideNewStatus(selectedFinding.status);
    setOverrideReason('');
    setOverrideEvidenceRef('');
    setIsOverrideModalOpen(true);
  };

  const handleSaveOverride = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFinding || !onUpdateFinding) return;

    const newOverride: ReviewerOverride = {
      overrideId: `OVR-${Date.now()}`,
      reviewerName: overrideReviewerName.trim() || 'Qualified Auditor',
      reviewerRole: overrideReviewerRole.trim() || 'Lead Airworthiness Surveyor',
      timestamp: new Date().toISOString(),
      previousStatus: selectedFinding.status,
      newStatus: overrideNewStatus,
      reason: overrideReason.trim() || 'Reviewer assessment based on validated documentary/physical evidence.',
      justificationEvidenceRef: overrideEvidenceRef.trim() || 'See attached audit memo in Evidence Manager'
    };

    const updatedFinding: Finding = {
      ...selectedFinding,
      status: overrideNewStatus,
      reviewerDecision: 'Overridden',
      reviewerOverrides: [newOverride, ...(selectedFinding.reviewerOverrides || [])]
    };

    onUpdateFinding(updatedFinding);
    setIsOverrideModalOpen(false);
  };

  const getStatusBadge = (status: ComplianceStatus) => {
    switch (status) {
      case 'Meets modeled check':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Meets modeled check
          </span>
        );
      case 'Gap found':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800 border border-red-300">
            <XCircle className="w-3.5 h-3.5 text-red-600" />
            Gap found
          </span>
        );
      case 'Needs human review':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
            Needs human review
          </span>
        );
      case 'Not assessed':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            Not assessed
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Findings Explorer &amp; Regulatory Traceability Register
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Full audit traceability connecting Revit element IDs, measured dimensions, cited EASA clauses, engineering assumptions, and auditor overrides.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-mono">
            {filtered.length} of {findings.length} findings displayed
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white border border-slate-200 rounded-lg shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            placeholder="Search finding ID, clause, room, element..."
            className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3 overflow-x-auto">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white text-slate-700 font-medium"
            >
              <option value="ALL">All Statuses (4-Tier)</option>
              <option value="Meets modeled check">Meets modeled check</option>
              <option value="Gap found">Gap found</option>
              <option value="Needs human review">Needs human review</option>
              <option value="Not assessed">Not assessed</option>
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500">Severity:</span>
            <select
              value={severityFilter}
              onChange={e => setSeverityFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white text-slate-700 font-medium"
            >
              <option value="ALL">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
              <option value="Informational">Informational</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2-Column Findings Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Findings Table (7 Cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs flex flex-col">
          <div className="overflow-x-auto max-h-[640px]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold z-10">
                <tr>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Severity</th>
                  <th className="py-2.5 px-3">EASA Clause</th>
                  <th className="py-2.5 px-3">Location / Element</th>
                  <th className="py-2.5 px-3">Revit ID</th>
                  <th className="py-2.5 px-3">Finding Title</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filtered.map(f => {
                  const isSelected = f.findingId === selectedFinding?.findingId;
                  return (
                    <tr
                      key={f.findingId}
                      onClick={() => onSelectFinding(f)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-50/80 font-medium' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {getStatusBadge(f.status)}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className={`text-[11px] font-bold ${
                          f.severity === 'Critical' ? 'text-red-700' :
                          f.severity === 'High' ? 'text-orange-700' :
                          f.severity === 'Medium' ? 'text-amber-700' :
                          'text-slate-600'
                        }`}>
                          {f.severity}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-700 whitespace-nowrap">
                        {f.regulatoryReference}
                      </td>
                      <td className="py-2.5 px-3 max-w-[150px] truncate" title={f.affectedRoomOrZone}>
                        {f.affectedRoomOrZone}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap">
                        {f.revitElementId ? `#${f.revitElementId}` : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="py-2.5 px-3 max-w-[180px] truncate" title={f.description}>
                        {f.description}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Detailed Finding Panel & Traceability Inspector (5 Cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
          {selectedFinding ? (
            <>
              {/* Finding Title & Badges */}
              <div className="border-b border-slate-100 pb-3">
                <div className="flex items-center justify-between text-xs font-mono text-slate-500 mb-1">
                  <span>{selectedFinding.findingId}</span>
                  <span className="font-semibold text-slate-700">{selectedFinding.ruleId}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  {selectedFinding.description}
                </h3>
                <div className="flex flex-wrap items-center gap-2 mt-2.5">
                  {getStatusBadge(selectedFinding.status)}
                  <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                    {selectedFinding.severity} Severity
                  </span>
                  <span className="text-[11px] font-mono text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded">
                    {selectedFinding.regulatoryReference}
                  </span>
                  <span className="text-[10px] uppercase font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {selectedFinding.classification}
                  </span>
                </div>
              </div>

              {/* Measured vs Required Values */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2 text-xs">
                <div className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                  Measured vs Required Parameters
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-white rounded border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Modeled / Measured Value</span>
                    <span className="font-mono font-bold text-slate-900 text-xs">
                      {selectedFinding.measuredValue || 'Not applicable / Geometric enclosure'}
                    </span>
                  </div>
                  <div className="p-2 bg-white rounded border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Required Threshold</span>
                    <span className="font-mono font-bold text-blue-900 text-xs">
                      {selectedFinding.requiredValue || 'Clause specific requirement'}
                    </span>
                  </div>
                </div>
                {selectedFinding.assumptionsApplied && (
                  <div className="text-[11px] text-slate-600 pt-1">
                    <strong className="text-slate-800">Assumptions Applied:</strong> {selectedFinding.assumptionsApplied}
                  </div>
                )}
              </div>

              {/* Regulatory Grounding & Explanation */}
              <div className="space-y-1.5 text-xs">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] block">
                  Regulatory Grounding &amp; Clause Citation
                </span>
                <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1.5">
                  <p className="leading-relaxed text-slate-700">
                    {selectedFinding.explanation}
                  </p>
                  <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200 flex items-center justify-between">
                    <span>Source: <strong>{selectedFinding.sourceDocument}</strong></span>
                    {selectedFinding.sourceUrl && (
                      <a
                        href={selectedFinding.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1 font-medium"
                      >
                        Official EASA Source <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Evidence Audited & Missing Evidence */}
              <div className="space-y-1.5 text-xs">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] block">
                  BIM Evidence &amp; Missing Documentation
                </span>
                <div className="p-2.5 bg-slate-50 rounded border border-slate-200 text-slate-700 space-y-1 font-mono text-[11px]">
                  <div><strong>Modeled Evidence:</strong> {selectedFinding.evidenceReviewed}</div>
                  {selectedFinding.missingEvidence && (
                    <div className="text-amber-800">
                      <strong>Missing Evidence:</strong> {selectedFinding.missingEvidence}
                    </div>
                  )}
                </div>
              </div>

              {/* Corrective Action */}
              <div className="space-y-1.5 text-xs">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] block">
                  Recommended Corrective Action
                </span>
                <p className="p-3 bg-blue-50/70 rounded border border-blue-200 text-slate-800 leading-relaxed">
                  {selectedFinding.recommendedCorrectiveAction}
                </p>
              </div>

              {/* Reviewer Decision & Overrides Box */}
              <div className="p-3.5 bg-slate-100 rounded-lg border border-slate-300 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-slate-700" />
                    <span className="font-bold text-slate-900">Reviewer Decision &amp; Audit Log</span>
                  </div>
                  <button
                    onClick={handleOpenOverrideModal}
                    className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-50 text-blue-700 font-semibold rounded border border-blue-300 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Record Override</span>
                  </button>
                </div>

                <div className="text-slate-600 text-[11px]">
                  Current Reviewer Decision: <strong className="text-slate-900">{selectedFinding.reviewerDecision}</strong>
                </div>

                {selectedFinding.reviewerOverrides && selectedFinding.reviewerOverrides.length > 0 && (
                  <div className="space-y-2 pt-1 border-t border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Override History</span>
                    {selectedFinding.reviewerOverrides.map(ovr => (
                      <div key={ovr.overrideId} className="p-2 bg-white rounded border border-slate-200 text-[11px] space-y-1">
                        <div className="flex justify-between items-center text-slate-800 font-medium">
                          <span>{ovr.reviewerName} ({ovr.reviewerRole})</span>
                          <span className="text-slate-400 font-mono text-[10px]">{ovr.timestamp.split('T')[0]}</span>
                        </div>
                        <div className="text-slate-600">
                          Status changed: <em>{ovr.previousStatus}</em> → <strong className="text-blue-700">{ovr.newStatus}</strong>
                        </div>
                        <div className="text-slate-500 italic">"{ovr.reason}"</div>
                        <div className="text-slate-400 text-[10px]">Justification Ref: {ovr.justificationEvidenceRef}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Revit 3D Navigation Controls */}
              {selectedFinding.revitElementId && (
                <div className="p-3 bg-slate-900 rounded-lg text-white flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <div className="font-mono text-blue-400 font-semibold">
                      Revit Element ID: {selectedFinding.revitElementId}
                    </div>
                    <div className="text-slate-400 text-[11px]">
                      {selectedFinding.affectedRoomOrZone}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onZoomToElement(selectedFinding.revitElementId!)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Zoom 3D</span>
                    </button>
                    <button
                      onClick={() => onIsolateElement(selectedFinding.revitElementId!)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-medium transition-colors cursor-pointer border border-slate-700"
                    >
                      <Focus className="w-3.5 h-3.5" />
                      <span>Isolate</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs">
              Select a finding from the table to view full traceability.
            </div>
          )}
        </div>
      </div>

      {/* Reviewer Override Modal */}
      {isOverrideModalOpen && selectedFinding && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Record Qualified Reviewer Override
                </h3>
              </div>
              <button
                onClick={() => setIsOverrideModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              As a qualified airworthiness reviewer or lead surveyor, you may override automated modeled results based on validated non-BIM documentary evidence, physical laser measurements, or engineering dispositions. All overrides are permanently recorded in the audit trail.
            </p>

            <form onSubmit={handleSaveOverride} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Qualified Reviewer Name
                </label>
                <input
                  type="text"
                  required
                  value={overrideReviewerName}
                  onChange={e => setOverrideReviewerName(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded focus:border-blue-500 focus:outline-none"
                  placeholder="e.g. Marcus Vance"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Reviewer Professional Role / License
                </label>
                <input
                  type="text"
                  required
                  value={overrideReviewerRole}
                  onChange={e => setOverrideReviewerRole(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded focus:border-blue-500 focus:outline-none"
                  placeholder="e.g. Lead Quality Auditor (Part-66 / QA License #4901)"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Adjusted Compliance Status
                </label>
                <select
                  value={overrideNewStatus}
                  onChange={e => setOverrideNewStatus(e.target.value as ComplianceStatus)}
                  className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800 font-medium"
                >
                  <option value="Meets modeled check">Meets modeled check</option>
                  <option value="Gap found">Gap found</option>
                  <option value="Needs human review">Needs human review</option>
                  <option value="Not assessed">Not assessed</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Override Justification &amp; Technical Reason
                </label>
                <textarea
                  required
                  rows={3}
                  value={overrideReason}
                  onChange={e => setOverrideReason(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded focus:border-blue-500 focus:outline-none"
                  placeholder="Describe why modeled finding is overridden (e.g., physical laser measurement confirms 3,000 mm clear opening after frame modification; or procedural MOE 2.2 compensation accepted)."
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Supporting Evidence / Document Reference
                </label>
                <input
                  type="text"
                  required
                  value={overrideEvidenceRef}
                  onChange={e => setOverrideEvidenceRef(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded focus:border-blue-500 focus:outline-none"
                  placeholder="e.g. ECO-2027-14 Contractor As-Built Laser Survey &amp; MOE Rev 4 Chapter 2.2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsOverrideModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold cursor-pointer shadow-sm"
                >
                  Commit Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
