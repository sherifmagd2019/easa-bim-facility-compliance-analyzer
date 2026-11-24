import React, { useState } from 'react';
import { AssessmentProject } from '../types';
import { CheckCircle2, ShieldAlert, Save } from 'lucide-react';

interface ProjectSetupViewProps {
  project: AssessmentProject;
  onUpdateProject: (updated: AssessmentProject) => void;
}

export const ProjectSetupView: React.FC<ProjectSetupViewProps> = ({
  project,
  onUpdateProject
}) => {
  const [formData, setFormData] = useState<AssessmentProject>(project);
  const [savedNotification, setSavedNotification] = useState(false);

  const isEuState = [
    'Austria', 'Belgium', 'Bulgaria', 'Croatia', 'Cyprus', 'Czech Republic', 'Czechia',
    'Denmark', 'Estonia', 'Finland', 'France', 'Germany', 'Greece', 'Hungary', 'Ireland',
    'Italy', 'Latvia', 'Lithuania', 'Luxembourg', 'Malta', 'Netherlands', 'Poland',
    'Portugal', 'Romania', 'Slovakia', 'Slovenia', 'Spain', 'Sweden', 'Switzerland', 'Norway', 'Iceland'
  ].some(c => c.toLowerCase() === formData.countryOfOperation.toLowerCase().trim());

  const hasRouteConflict = !isEuState && 
    (formData.intendedAuthorityRoute.toLowerCase().includes('member state') || 
     formData.intendedAuthorityRoute.toLowerCase().includes('national aviation') ||
     formData.intendedAuthorityRoute.toLowerCase().includes('lba') ||
     formData.intendedAuthorityRoute.toLowerCase().includes('dgac'));

  const handleChange = (field: keyof AssessmentProject, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleToggleUld = (uld: string) => {
    const list = formData.uldTypesHandled.includes(uld)
      ? formData.uldTypesHandled.filter(u => u !== uld)
      : [...formData.uldTypesHandled, uld];
    handleChange('uldTypesHandled', list);
  };

  const handleSave = () => {
    onUpdateProject(formData);
    setSavedNotification(true);
    setTimeout(() => setSavedNotification(false), 3000);
  };

  const allUlds = ['AKE (LD3)', 'PMC (96x125 in Pallet)', 'PAG', 'AMF', 'PLA', 'DQF', 'DPE'];

  return (
    <div className="space-y-6">
      {/* Top Header & Save CTA */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Step 1 — Create &amp; Configure Assessment Project</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Define facility scope, ULD handling types, operational jurisdiction, and verify authority competence under Regulation (EU) 2018/1139.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {savedNotification && (
            <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Changes saved
            </span>
          )}
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Configuration</span>
          </button>
        </div>
      </div>

      {/* Route Competence Alert Banner */}
      {hasRouteConflict ? (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 space-y-1">
            <span className="font-semibold block text-amber-950">
              Regulatory Jurisdiction Warning — Non-EU Third Country Route
            </span>
            <p>
              Under Regulation (EU) 2018/1139 Article 62(1), facilities located outside EU Member States cannot seek direct Part-145 approval from an individual EU Member State National Aviation Authority (e.g. LBA, DGAC). Application must be submitted directly to the <strong>EASA Foreign Part-145 Approvals Section</strong> (EASA Form 2) or under an applicable bilateral agreement (e.g. FAA BASA / TCCA CAR 573).
            </p>
          </div>
        </div>
      ) : (
        <div className="p-3 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Jurisdiction Verification: <strong>{formData.countryOfOperation}</strong> ({isEuState ? 'EU/EFTA Member State' : 'Third Country Foreign Organization'}). Competent Authority: <strong>{formData.intendedAuthorityRoute}</strong>.
            </span>
          </div>
          <span className="font-mono text-slate-500">EASA Form 2 Route Checked</span>
        </div>
      )}

      {/* 2-Column Form Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Column 1: Organization & Facility Metadata */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
            Organization &amp; Facility Profile
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Project Name</label>
              <input
                type="text"
                value={formData.projectName}
                onChange={e => handleChange('projectName', e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Project Number</label>
              <input
                type="text"
                value={formData.projectNumber}
                onChange={e => handleChange('projectNumber', e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:border-blue-500 focus:outline-none font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Facility Name</label>
            <input
              type="text"
              value={formData.facilityName}
              onChange={e => handleChange('facilityName', e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Facility Physical Address</label>
            <input
              type="text"
              value={formData.facilityAddress}
              onChange={e => handleChange('facilityAddress', e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Country of Operation</label>
              <input
                type="text"
                value={formData.countryOfOperation}
                onChange={e => handleChange('countryOfOperation', e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Principal Place of Business</label>
              <input
                type="text"
                value={formData.principalPlaceOfBusiness}
                onChange={e => handleChange('principalPlaceOfBusiness', e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Facility Manager / Quality Lead</label>
              <input
                type="text"
                value={formData.facilityManager}
                onChange={e => handleChange('facilityManager', e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Assessment Revision</label>
              <input
                type="text"
                value={formData.revision}
                onChange={e => handleChange('revision', e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:border-blue-500 focus:outline-none font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Organization Scope &amp; Legal Entity</label>
            <textarea
              rows={2}
              value={formData.organizationDetails}
              onChange={e => handleChange('organizationDetails', e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Column 2: Scope, ULD Types & Authority Route */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
            Aviation Regulatory Scope &amp; ULD Types
          </h3>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Intended Approval Scope</label>
            <input
              type="text"
              value={formData.intendedApprovalScope}
              onChange={e => handleChange('intendedApprovalScope', e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:border-blue-500 focus:outline-none font-medium"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Intended Authority Approval Route</label>
            <input
              type="text"
              value={formData.intendedAuthorityRoute}
              onChange={e => handleChange('intendedAuthorityRoute', e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:border-blue-500 focus:outline-none"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Third-country applicants must route to EASA Foreign Part-145 directly.
            </span>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              ULD Types Handled by Facility
            </label>
            <div className="flex flex-wrap gap-2">
              {allUlds.map(uld => {
                const isSelected = formData.uldTypesHandled.includes(uld);
                return (
                  <button
                    key={uld}
                    type="button"
                    onClick={() => handleToggleUld(uld)}
                    className={`px-3 py-1.5 text-xs rounded border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 border-blue-400 text-blue-800 font-semibold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {uld}
                  </button>
                );
              })}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Selecting PMC (96×125 in) automatically enforces minimum 2,440 mm clear door opening rule checks.
            </span>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Assessment Limitations</label>
            <textarea
              rows={2}
              value={formData.assessmentLimitations}
              onChange={e => handleChange('assessmentLimitations', e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Key Engineering Assumptions</label>
            <textarea
              rows={2}
              value={formData.assumptions}
              onChange={e => handleChange('assumptions', e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
