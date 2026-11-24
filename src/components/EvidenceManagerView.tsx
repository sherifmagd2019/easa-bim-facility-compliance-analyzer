import React, { useState } from 'react';
import { EvidenceItem, CorrectiveAction } from '../types';
import { Plus, FileText } from 'lucide-react';

interface EvidenceManagerViewProps {
  evidence: EvidenceItem[];
  actions: CorrectiveAction[];
  onAddEvidence: (item: EvidenceItem) => void;
  onUpdateActionStatus: (actionId: string, status: CorrectiveAction['status'], reviewer: string) => void;
}

export const EvidenceManagerView: React.FC<EvidenceManagerViewProps> = ({
  evidence,
  actions,
  onAddEvidence,
  onUpdateActionStatus
}) => {
  const [activeTab, setActiveTab] = useState<'actions' | 'evidence'>('actions');
  const [showAddEvidence, setShowAddEvidence] = useState(false);

  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState('ApprovedProcedure');
  const [newFileRef, setNewFileRef] = useState('');
  const [newComments, setNewComments] = useState('');

  const handleCreateEvidence = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;

    onAddEvidence({
      evidenceId: `EVD-MANUAL-${Date.now().toString().slice(-4)}`,
      type: newType,
      title: newTitle,
      fileReferenceOrLocation: newFileRef || 'DOCS/CONTROLLED/PROC_2027.pdf',
      sourceDate: new Date().toISOString().split('T')[0],
      reviewer: 'Compliance Engineer Sign-Off',
      verificationStatus: 'Verified Valid',
      relatedRequirementId: 'REQ-145.A.25-A',
      comments: newComments || 'Verified against company controlled manual register.'
    });

    setNewTitle('');
    setNewFileRef('');
    setNewComments('');
    setShowAddEvidence(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Step 7 — Evidence &amp; Corrective-Action Management</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Attach non-BIM documentary evidence, calibration records, and track corrective action closure with verification sign-offs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddEvidence(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Attach Controlled Evidence</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('actions')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'actions'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Corrective Action Register ({actions.length})
        </button>
        <button
          onClick={() => setActiveTab('evidence')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'evidence'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Controlled Evidence Library ({evidence.length})
        </button>
      </div>

      {/* Modal / Dialog for Adding Evidence */}
      {showAddEvidence && (
        <div className="p-5 bg-blue-50/80 border border-blue-200 rounded-lg space-y-4 shadow-sm">
          <h3 className="text-sm font-bold text-blue-950 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Register Controlled Non-BIM Evidence Document</span>
          </h3>
          <form onSubmit={handleCreateEvidence} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Evidence Title</label>
              <input
                type="text"
                placeholder="e.g. ISO 17025 Calibration Certificate..."
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                required
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Evidence Type</label>
              <select
                value={newType}
                onChange={e => setNewType(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded bg-white focus:outline-none"
              >
                <option value="ApprovedProcedure">Approved Procedure (MOE)</option>
                <option value="CalibrationRecord">Calibration Record / Certificate</option>
                <option value="InspectionRecord">Inspection Record</option>
                <option value="PersonnelQualification">Personnel Qualification / Form 4</option>
                <option value="SitePhotograph">Site Photograph / Physical Proof</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">File Reference / Controlled Path</label>
              <input
                type="text"
                placeholder="e.g. MOE/Rev04/Chapter_1_8.pdf"
                value={newFileRef}
                onChange={e => setNewFileRef(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded bg-white font-mono focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Auditor Comments &amp; Scope</label>
              <input
                type="text"
                placeholder="Audit notes and verification observations"
                value={newComments}
                onChange={e => setNewComments(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded bg-white focus:outline-none"
              />
            </div>
            <div className="md:col-span-2 flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddEvidence(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded"
              >
                Save Evidence Record
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 1: Corrective Actions */}
      {activeTab === 'actions' && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-2.5 px-4">Action ID</th>
                  <th className="py-2.5 px-4">Related Finding</th>
                  <th className="py-2.5 px-4">Corrective Action Plan</th>
                  <th className="py-2.5 px-4">Responsible</th>
                  <th className="py-2.5 px-4">Target Date</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {actions.map(act => (
                  <tr key={act.actionId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{act.actionId}</td>
                    <td className="py-3 px-4 font-mono text-blue-600">{act.findingId}</td>
                    <td className="py-3 px-4 max-w-sm">
                      <div className="font-medium text-slate-900 leading-snug">{act.description}</div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        Evidence required: {act.requiredCompletionEvidence}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{act.responsiblePerson}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{act.targetDate}</td>
                    <td className="py-3 px-4">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                        act.status === 'VerifiedClosed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        act.status === 'InProgress' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {act.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {act.status !== 'VerifiedClosed' ? (
                        <button
                          onClick={() => onUpdateActionStatus(act.actionId, 'VerifiedClosed', 'Quality Lead Sign-off')}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium text-[11px] transition-colors cursor-pointer"
                        >
                          Verify &amp; Close
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">Closed &amp; Verified</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Evidence Library */}
      {activeTab === 'evidence' && (
        <div className="grid grid-cols-1 gap-4">
          {evidence.map(ev => (
            <div key={ev.evidenceId} className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900">{ev.evidenceId}</span>
                    <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      {ev.type}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">
                      Req: {ev.relatedRequirementId}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mt-1">{ev.title}</h4>
                </div>
                <span className="text-xs font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded font-medium">
                  {ev.verificationStatus}
                </span>
              </div>
              <div className="text-xs text-slate-600 font-mono bg-slate-50 p-2 rounded border border-slate-100">
                Location: {ev.fileReferenceOrLocation}
              </div>
              <div className="text-xs text-slate-600 italic">
                "{ev.comments}"
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Audited By: <strong>{ev.reviewer}</strong></span>
                <span>Date: {ev.sourceDate}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
