import React from 'react';
import { Calendar, HardDrive } from 'lucide-react';

export const AssessmentHistoryView: React.FC = () => {
  const sessions = [
    {
      sessionId: 'SES-2027-003',
      date: '2026-10-17 12:15 UTC',
      modelFile: 'FRA-ULD-MNT-2027-R03.rvt',
      fingerprint: 'A7F3-9D12-88E4-BC01',
      rulesRun: 6,
      pass: 2,
      fail: 2,
      review: 2,
      score: '91.5%',
      auditor: 'Marcus Vance'
    },
    {
      sessionId: 'SES-2027-002',
      date: '2026-09-28 09:30 UTC',
      modelFile: 'FRA-ULD-MNT-2027-R02.rvt',
      fingerprint: '8B22-4410-19EC-AA99',
      rulesRun: 6,
      pass: 1,
      fail: 3,
      review: 2,
      score: '84.0%',
      auditor: 'Hans Meier'
    },
    {
      sessionId: 'SES-2027-001',
      date: '2026-08-14 14:00 UTC',
      modelFile: 'FRA-ULD-MNT-2027-R01.rvt',
      fingerprint: '3C19-FF82-0199-55E2',
      rulesRun: 5,
      pass: 0,
      fail: 4,
      review: 1,
      score: '72.0%',
      auditor: 'Hans Meier'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Developer Ribbon */}
      <div className="bg-slate-900 border border-slate-800 text-white px-5 py-2.5 rounded-lg flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Session Database:</span>
          <span className="text-slate-200 font-semibold font-mono">SQLite (EasaAssessmentHistory.db)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Developer:</span>
          <span className="text-blue-300 font-bold tracking-wide">
            Developer Eng. Sherif Ahmad Magaldin
          </span>
        </div>
      </div>

      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Step 9 — Assessment History &amp; SQLite Audit Trail</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Historical assessment sessions, model revision fingerprints, and compliance progression tracking.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono bg-slate-100 text-slate-700 px-3 py-1.5 rounded border border-slate-200 flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-slate-500" />
            <span>SQLite: EasaAssessmentHistory.db</span>
          </span>
        </div>
      </div>

      {/* History Session Cards */}
      <div className="space-y-4">
        {sessions.map(s => (
          <div key={s.sessionId} className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                  {s.sessionId}
                </span>
                <span className="text-sm font-bold text-slate-900">
                  {s.modelFile}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Hash: {s.fingerprint}
                </span>
              </div>
              <div className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                <Calendar className="w-3.5 h-3.5" />
                <span>{s.date}</span>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-3 p-3 bg-slate-50 rounded border border-slate-100 text-center text-xs">
              <div>
                <span className="text-slate-500 text-[11px] block">Rules Executed</span>
                <span className="font-bold text-slate-800 font-mono text-sm">{s.rulesRun}</span>
              </div>
              <div>
                <span className="text-emerald-700 text-[11px] block">Pass</span>
                <span className="font-bold text-emerald-700 font-mono text-sm">{s.pass}</span>
              </div>
              <div>
                <span className="text-red-700 text-[11px] block">Fail</span>
                <span className="font-bold text-red-700 font-mono text-sm">{s.fail}</span>
              </div>
              <div>
                <span className="text-amber-700 text-[11px] block">Needs Review</span>
                <span className="font-bold text-amber-700 font-mono text-sm">{s.review}</span>
              </div>
              <div>
                <span className="text-blue-700 text-[11px] block">Completeness</span>
                <span className="font-bold text-blue-700 font-mono text-sm">{s.score}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span>Auditor / Responsible Assessor: <strong>{s.auditor}</strong></span>
              <button
                type="button"
                className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
              >
                View Session Findings Diff →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
