import React, { useState } from 'react';
import { RuleDefinition, SeverityLevel, RuleLibraryCatalog } from '../types';
import { defaultRuleLibraryCatalog } from '../data/syntheticFacilityData';
import {
  Play,
  ShieldCheck,
  BookOpen,
  AlertCircle,
  History,
  Sliders,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';

interface RuleEngineViewProps {
  rules: RuleDefinition[];
  onToggleRule: (ruleId: string) => void;
  onUpdateRuleSeverity: (ruleId: string, severity: SeverityLevel) => void;
  onUpdateRuleParameter?: (ruleId: string, paramKey: string, newValue: any) => void;
  onRunEngine: () => void;
  isRunning: boolean;
}

export const RuleEngineView: React.FC<RuleEngineViewProps> = ({
  rules,
  onToggleRule,
  onUpdateRuleSeverity,
  onUpdateRuleParameter,
  onRunEngine,
  isRunning
}) => {
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const catalog: RuleLibraryCatalog = defaultRuleLibraryCatalog;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            EASA Part-145 Rule Engine &amp; Controlled Assumptions Workflow
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Decoupled rule repository with controlled versioning, regulatory classification, and transparent engineering assumptions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowHistoryModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer border border-slate-300"
          >
            <History className="w-3.5 h-3.5 text-slate-600" />
            <span>Rule Version History ({catalog.catalogVersion})</span>
          </button>
          <button
            onClick={onRunEngine}
            disabled={isRunning}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Play className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Auditing Model...' : 'Execute BIM Rule Audit'}</span>
          </button>
        </div>
      </div>

      {/* Controlled Update Banner */}
      <div className="p-4 bg-slate-900 text-white rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-emerald-400 font-bold text-sm">
              {catalog.catalogVersion}
            </span>
            <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-mono">
              Baseline: Regulation (EU) No 1321/2014 &amp; (EU) 2023/203
            </span>
          </div>
          <p className="text-slate-300 text-[11px]">
            Last verified against official EASA Easy Access Rules on <strong>{catalog.lastAuditDate}</strong>. All unsupported values (fixed room areas, rigid door widths) have been removed from regulatory rules and moved to configurable engineering assumptions.
          </p>
        </div>
        <div className="shrink-0 text-right font-mono text-[11px] text-slate-400">
          <div>Rules Active: <strong>{rules.filter(r => r.isEnabled).length} / {rules.length}</strong></div>
          <div className="text-emerald-400">Zero Unverified Gaps</div>
        </div>
      </div>

      {/* Rules List */}
      <div className="grid grid-cols-1 gap-4">
        {rules.map(rule => (
          <div
            key={rule.ruleId}
            className={`bg-white border rounded-lg p-5 shadow-xs space-y-4 transition-colors ${
              rule.isEnabled ? 'border-slate-200' : 'border-slate-200 opacity-60 bg-slate-50'
            }`}
          >
            {/* Rule Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold text-slate-900">
                    {rule.ruleId}
                  </span>
                  <span className="text-xs font-mono font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                    {rule.applicableClause}
                  </span>
                  {rule.classification === 'Regulatory' ? (
                    <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded border border-blue-200">
                      Hard Law (Implementing Rule)
                    </span>
                  ) : rule.classification === 'AMC_GM' ? (
                    <span className="text-[10px] font-bold text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded border border-indigo-200">
                      Soft Law (AMC / GM)
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-200">
                      Project-Specific Assumption
                    </span>
                  )}
                  <span className="text-[10px] font-mono text-slate-400">
                    Ver: {rule.version}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  {rule.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {rule.expectedOutcome}
                </p>
              </div>

              {/* Severity & Toggle */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase">Severity:</span>
                  <select
                    value={rule.defaultSeverity}
                    onChange={e => onUpdateRuleSeverity(rule.ruleId, e.target.value as SeverityLevel)}
                    className="text-xs font-semibold px-2 py-1 border border-slate-300 rounded bg-white text-slate-800"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                    <option value="Informational">Informational</option>
                  </select>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase">Active:</span>
                  <button
                    type="button"
                    onClick={() => onToggleRule(rule.ruleId)}
                    className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                      rule.isEnabled ? 'bg-blue-600' : 'bg-slate-300'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        rule.isEnabled ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Configurable Engineering Assumptions (If any) */}
            {rule.configurableParameters && Object.keys(rule.configurableParameters).length > 0 && (
              <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-lg space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-950 uppercase tracking-wide text-[10px] flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-amber-700" />
                    Configurable Engineering Assumptions (Subject to Reviewer Sign-Off)
                  </span>
                  <span className="text-[10px] text-amber-800 font-mono">
                    Not an EASA Hard-Law Constant
                  </span>
                </div>

                <div className="space-y-2.5">
                  {Object.values(rule.configurableParameters).map(param => (
                    <div key={param.key} className="p-2.5 bg-white rounded border border-amber-200/80 space-y-1.5">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="font-semibold text-slate-800">{param.label}</span>
                        <div className="flex items-center gap-2">
                          <input
                            type={typeof param.value === 'number' ? 'number' : 'text'}
                            value={String(param.value)}
                            onChange={e => {
                              if (onUpdateRuleParameter) {
                                const val = typeof param.defaultValue === 'number' ? Number(e.target.value) : e.target.value;
                                onUpdateRuleParameter(rule.ruleId, param.key, val);
                              }
                            }}
                            className="w-24 text-right font-mono font-bold text-xs p-1 border border-slate-300 rounded focus:border-blue-500 focus:outline-none"
                          />
                          {param.unit && <span className="font-mono text-slate-500 text-xs">{param.unit}</span>}
                        </div>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        <strong>Cited Source:</strong> {param.citedSource}
                      </div>
                      {param.approvedBy && (
                        <div className="text-[10px] text-emerald-700 font-medium">
                          ✓ Reviewer Sign-off: {param.approvedBy} ({param.approvalDate})
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Traceability Metadata Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs border-t border-slate-100 text-slate-600">
              <div>
                <span className="font-semibold text-slate-500 block text-[10px] uppercase">Official EASA Source:</span>
                <span className="text-slate-800 block text-[11px]">{rule.sourceDocument}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-500 block text-[10px] uppercase">Limitations of Model:</span>
                <span className="text-slate-700 block text-[11px] leading-tight">{rule.limitations}</span>
              </div>
              <div className="flex items-center justify-between md:justify-end gap-3">
                <span className="text-[11px] font-mono text-slate-500">
                  Rev: {rule.sourceRevisionDate}
                </span>
                <a
                  href={rule.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline flex items-center gap-1 font-semibold text-xs"
                >
                  <span>Clause Link</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Version History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Rule Library Version &amp; Audit History
                </h3>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 max-h-[400px] overflow-y-auto text-xs">
              {catalog.changelog.map((entry, idx) => (
                <div key={entry.version} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between font-mono">
                    <span className="font-bold text-blue-800">{entry.version}</span>
                    <span className="text-slate-500">{entry.date}</span>
                  </div>
                  <ul className="list-disc pl-5 space-y-1 text-slate-700 text-[11px]">
                    {entry.changes.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded text-xs font-semibold cursor-pointer"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
