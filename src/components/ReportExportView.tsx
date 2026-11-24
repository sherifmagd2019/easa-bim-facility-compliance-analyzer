import React from 'react';
import { AssessmentProject, Finding, ModelCompletenessReport, RequirementRecord } from '../types';
import { defaultRuleLibraryCatalog, defaultRequirementsLibrary } from '../data/syntheticFacilityData';
import {
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  UserCheck,
  FileCheck2
} from 'lucide-react';

interface ReportExportViewProps {
  project: AssessmentProject;
  findings: Finding[];
  completeness: ModelCompletenessReport;
}

export const ReportExportView: React.FC<ReportExportViewProps> = ({
  project,
  findings,
  completeness
}) => {
  const meetsCount = findings.filter(f => f.status === 'Meets modeled check').length;
  const gapCount = findings.filter(f => f.status === 'Gap found').length;
  const reviewCount = findings.filter(f => f.status === 'Needs human review').length;
  const notAssessedCount = findings.filter(f => f.status === 'Not assessed').length;

  const catalog = defaultRuleLibraryCatalog;
  const unassessedReqs = defaultRequirementsLibrary.filter(r => r.requiresHumanReview || r.assessmentMethod !== 'BimAutomated');

  const handleDownloadCsv = () => {
    let csv = '# EASA PART-145 FACILITY COMPLIANCE-ASSISTANCE AUDIT REGISTER\n';
    csv += '# DEVELOPER: Developer Eng. Sherif Ahmad Magdaldin\n';
    csv += '# DISCLAIMER: Decision-support aid for qualified human reviewers. Does NOT constitute EASA approval or certificate.\n';
    csv += `# Facility: ${project.facilityName}\n`;
    csv += `# Model File: ${project.modelFileName} (Fingerprint: ${project.modelFingerprint})\n`;
    csv += `# Rule Library: ${catalog.catalogVersion} (Baseline: ${catalog.regulatoryBaseline})\n`;
    csv += 'Finding ID,Rule ID,Clause,Classification,Status,Severity,Affected Zone,Revit Element ID,Measured Value,Required Value,Assumptions Applied,Description,Reviewer Decision,Corrective Action\n';
    findings.forEach(f => {
      csv += `"${f.findingId}","${f.ruleId}","${f.regulatoryReference}","${f.classification}","${f.status}","${f.severity}","${f.affectedRoomOrZone}","${f.revitElementId || ''}","${(f.measuredValue || '').replace(/"/g, '""')}","${(f.requiredValue || '').replace(/"/g, '""')}","${(f.assumptionsApplied || '').replace(/"/g, '""')}","${f.description.replace(/"/g, '""')}","${f.reviewerDecision}","${f.recommendedCorrectiveAction.replace(/"/g, '""')}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `EASA_Part145_Findings_${project.projectNumber || '2027'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadJsonReport = () => {
    const reportData = {
      developer: 'Developer Eng. Sherif Ahmad Magdaldin',
      reportTitle: 'EASA Part-145 Facility Compliance-Assistance Review Report',
      legalDisclaimer: 'This document is a software-assisted compliance gap assessment generated to support qualified human reviewers. It does NOT constitute an official EASA approval, certificate, or guarantee of regulatory authorization.',
      ruleLibraryVersion: catalog.catalogVersion,
      regulatoryBaseline: catalog.regulatoryBaseline,
      generationDate: new Date().toISOString(),
      project,
      modelCompleteness: completeness,
      summary: {
        totalEvaluated: findings.length,
        meetsModeledCheck: meetsCount,
        gapsFound: gapCount,
        needsHumanReview: reviewCount,
        notAssessed: notAssessedCount
      },
      engineeringAssumptions: [
        'ULD PMC 96-in Pallet handling envelope: 2,650 mm transporter width + 300 mm lateral maneuvering clearance = 2,950 mm required clear opening (Source: IATA AHM 911 / ULDR).',
        'Emergency Eyewash maximum walking travel distance: 15.0 meters / 10 seconds (Source: ANSI/ISEA Z358.1-2014 & EN 15154-1; Not an EASA regulatory constant).'
      ],
      findings,
      unassessedRequirements: unassessedReqs.map(r => ({
        section: r.sectionReference,
        title: r.summary,
        requiredEvidence: r.requiredEvidence,
        reasonNotFullyAssessedFromBim: 'Requires continuous sensor logs, physical commissioning, or organizational procedures.'
      })),
      signOffPlaceholders: {
        leadAssessor: 'Lead Airworthiness & BIM Surveyor (Pending Signature)',
        facilityDirector: `${project.facilityManager} (Pending Signature)`
      }
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `EASA_Part145_Audit_Report_${project.projectNumber || '2027'}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadTxtReport = () => {
    let txt = '================================================================================\n';
    txt += 'DEVELOPER: Developer Eng. Sherif Ahmad Magdaldin\n';
    txt += '================================================================================\n';
    txt += '    EASA PART-145 FACILITY COMPLIANCE-ASSISTANCE REVIEW REPORT\n';
    txt += '         Annex II to Regulation (EU) No 1321/2014 & Part-IS (EU 2023/203)\n';
    txt += `                    Rule Library: ${catalog.catalogVersion}\n`;
    txt += '================================================================================\n';
    txt += `Facility Name:            ${project.facilityName}\n`;
    txt += `Facility Address:         ${project.facilityAddress}\n`;
    txt += `Country of Operation:     ${project.countryOfOperation}\n`;
    txt += `Intended Approval Scope:  ${project.intendedApprovalScope}\n`;
    txt += `Intended Authority Route: ${project.intendedAuthorityRoute}\n`;
    txt += `Assessment Date:          ${project.assessmentDate} UTC\n`;
    txt += `Model File:               ${project.modelFileName}\n`;
    txt += `Model Fingerprint:        ${project.modelFingerprint}\n`;
    txt += '--------------------------------------------------------------------------------\n';
    txt += 'MANDATORY REGULATORY DISCLAIMER:\n';
    txt += 'This document is a software-assisted compliance gap assessment generated to\n';
    txt += 'support qualified human reviewers. It does NOT constitute an official EASA approval,\n';
    txt += 'certificate, or guarantee of regulatory compliance.\n';
    txt += '--------------------------------------------------------------------------------\n';
    txt += 'FINDINGS MATRIX & TRACEABILITY REGISTER:\n';
    txt += '--------------------------------------------------------------------------------\n';
    findings.forEach(f => {
      txt += `[${f.findingId}] | Status: ${f.status} | Severity: ${f.severity} | Clause: ${f.regulatoryReference}\n`;
      txt += `  Classification:  ${f.classification}\n`;
      txt += `  Zone / Element:  ${f.affectedRoomOrZone} (Revit Element ID: ${f.revitElementId || 'N/A'})\n`;
      txt += `  Measured Value:  ${f.measuredValue || 'N/A'}\n`;
      txt += `  Required Value:  ${f.requiredValue || 'N/A'}\n`;
      if (f.assumptionsApplied) txt += `  Assumptions:     ${f.assumptionsApplied}\n`;
      txt += `  Description:     ${f.description}\n`;
      txt += `  Explanation:     ${f.explanation}\n`;
      txt += `  Action:          ${f.recommendedCorrectiveAction}\n`;
      txt += `  Reviewer Status: ${f.reviewerDecision}\n\n`;
    });
    txt += '================================================================================\n';
    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `EASA_Part145_Audit_Report_${project.projectNumber || '2027'}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Export CTAs */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Compliance-Assistance Review Report Generation
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Export a formal audit package with full evidence traceability, documented assumptions, unassessed items, and reviewer sign-off fields.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadTxtReport}
            className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer border border-slate-300"
            title="Download Plain-Text Airworthiness Audit Report"
          >
            <FileText className="w-4 h-4 text-slate-700" />
            <span>Export Text Report (.txt)</span>
          </button>
          <button
            onClick={handleDownloadJsonReport}
            className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer border border-slate-300"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>Export JSON Audit Package</span>
          </button>
          <button
            onClick={handleDownloadCsv}
            className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer border border-slate-300"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>Export CSV Register</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* Formal Document Preview Container */}
      <div className="bg-white border border-slate-300 rounded-lg shadow-sm space-y-6 max-w-4xl mx-auto overflow-hidden print:border-none print:shadow-none print:p-0">
        {/* Developer Top Ribbon */}
        <div className="bg-slate-900 text-white px-6 py-2.5 flex items-center justify-between text-xs border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Developer:</span>
            <span className="text-amber-400 font-bold tracking-wide">Developer Eng. Sherif Ahmad Magdaldin</span>
          </div>
          <span className="text-slate-400 font-mono text-[11px]">Autodesk Revit 2027 • EASA Part-145 Lead System Architecture</span>
        </div>

        {/* Document Header Ribbon */}
        <div className="bg-slate-950 text-white px-6 py-2 flex items-center justify-between text-xs border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Compliance Instrument:</span>
            <span className="text-slate-200 font-semibold">
              EASA Part-145 Facility Compliance-Assistance Tool
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Rule Library:</span>
            <span className="text-emerald-400 font-mono font-bold">
              {catalog.catalogVersion}
            </span>
          </div>
        </div>

        <div className="p-8 pt-4 space-y-6">
          {/* Document Title Header */}
          <div className="border-b-2 border-slate-900 pb-5">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[11px] font-mono tracking-widest text-slate-500 uppercase block font-semibold">
                  EASA Part-145 (Annex II to Reg. EU 1321/2014) &amp; Part-IS
                </span>
                <h1 className="text-2xl font-bold text-slate-900 mt-1">
                  Facility BIM Compliance-Assistance Review Report
                </h1>
                <div className="text-xs text-amber-700 font-semibold mt-1">
                  Developer: Developer Eng. Sherif Ahmad Magdaldin
                </div>
                <div className="text-xs text-slate-600 mt-0.5 font-medium">
                  {project.facilityName} • {project.countryOfOperation}
                </div>
              </div>
              <div className="text-right text-xs text-slate-600 space-y-0.5 font-mono">
                <div>Ref: <strong>{project.projectNumber}</strong></div>
                <div>Revision: <strong>{project.revision}</strong></div>
                <div>Date: {new Date().toISOString().split('T')[0]}</div>
                <div className="text-blue-700 font-semibold pt-1">LOD 350 Model Audit</div>
              </div>
            </div>
          </div>

          {/* Mandatory Non-Certification Boundary Notice */}
          <div className="p-4 bg-slate-50 border-2 border-slate-300 rounded-lg flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-slate-800 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700 space-y-1">
              <span className="font-bold text-slate-900 block uppercase tracking-wider text-[11px]">
                Mandatory Regulatory Non-Certification Boundary Notice
              </span>
              <p className="leading-relaxed">
                This document is a software-assisted compliance gap assessment designed strictly to support a qualified human reviewer. It does <strong>NOT</strong> certify, approve, or guarantee EASA Part-145 facility compliance. A positive result in this report confirms only that modeled elements meet specific geometric checks; official regulatory authorization requires formal application via EASA Form 2, evaluation of the Maintenance Organization Exposition (MOE), review of environmental/calibration logs, and direct on-site physical inspection by the competent authority.
              </p>
            </div>
          </div>

          {/* Section 1: Executive 4-Tier Assessment Status */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1">
              1. Modeled Check Status &amp; Readiness Summary
            </h3>
            <div className="grid grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-red-50 border border-red-200 rounded">
                <span className="text-[11px] text-red-700 font-bold block uppercase">Gap Found</span>
                <span className="text-2xl font-bold text-red-700 font-mono">{gapCount}</span>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded">
                <span className="text-[11px] text-amber-700 font-bold block uppercase">Needs Human Review</span>
                <span className="text-2xl font-bold text-amber-700 font-mono">{reviewCount}</span>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded">
                <span className="text-[11px] text-emerald-700 font-bold block uppercase">Meets Modeled Check</span>
                <span className="text-2xl font-bold text-emerald-700 font-mono">{meetsCount}</span>
              </div>
              <div className="p-3 bg-slate-100 border border-slate-200 rounded">
                <span className="text-[11px] text-slate-600 font-bold block uppercase">Not Assessed (BIM)</span>
                <span className="text-2xl font-bold text-slate-700 font-mono">{notAssessedCount}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Model Identifiers & Applied Engineering Assumptions */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1">
              2. Model Identifiers &amp; Configured Engineering Assumptions
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1 p-3 bg-slate-50 rounded border border-slate-200">
                <div className="font-semibold text-slate-800 text-[11px] uppercase mb-1">Model &amp; Facility Identifiers</div>
                <div><strong>Revit Model File:</strong> {project.modelFileName}</div>
                <div><strong>Model Fingerprint:</strong> <span className="font-mono text-[11px]">{project.modelFingerprint}</span></div>
                <div><strong>Approval Scope:</strong> {project.intendedApprovalScope}</div>
                <div><strong>Active ULD Profile:</strong> PMC (96x125 in) Base: 2,438 mm</div>
                <div><strong>Authority Route:</strong> {project.intendedAuthorityRoute}</div>
              </div>
              <div className="space-y-1 p-3 bg-slate-50 rounded border border-slate-200">
                <div className="font-semibold text-slate-800 text-[11px] uppercase mb-1">Configured Engineering Assumptions</div>
                <div className="text-slate-700 text-[11px] leading-relaxed">
                  • <strong>ULD Door Clearance:</strong> Transporter width 2,650 mm + 300 mm lateral maneuvering margin = <strong>2,950 mm</strong> required clear opening (Source: IATA AHM 911; Reviewer approved).
                </div>
                <div className="text-slate-700 text-[11px] leading-relaxed pt-1">
                  • <strong>Eyewash Proximity:</strong> 15.0 m maximum walking distance (Source: ANSI/ISEA Z358.1-2014 / EN 15154; Reviewer approved; Not an EASA regulatory constant).
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Traceable Findings Matrix */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1">
              3. Regulatory Findings Matrix &amp; Traceability Register
            </h3>
            <div className="space-y-3">
              {findings.map(f => (
                <div key={f.findingId} className="border border-slate-200 rounded p-3 text-xs space-y-1.5">
                  <div className="flex justify-between items-center font-mono">
                    <span className="font-bold text-slate-900">
                      {f.findingId} • {f.ruleId} • Clause: {f.regulatoryReference}
                    </span>
                    <span className={`font-bold ${
                      f.status === 'Gap found' ? 'text-red-700' :
                      f.status === 'Needs human review' ? 'text-amber-700' :
                      f.status === 'Meets modeled check' ? 'text-emerald-700' :
                      'text-slate-600'
                    }`}>
                      {f.status} ({f.severity})
                    </span>
                  </div>
                  <div className="text-slate-900 font-semibold">{f.description}</div>
                  <div className="text-slate-600 leading-relaxed">{f.explanation}</div>
                  
                  {/* Measured vs Required */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2 rounded border border-slate-100 font-mono">
                    <div><strong>Measured:</strong> {f.measuredValue || 'Enclosure check'}</div>
                    <div><strong>Required:</strong> {f.requiredValue || 'Clause standard'}</div>
                  </div>

                  <div className="text-[11px] text-slate-500 font-mono flex items-center justify-between">
                    <span>Revit Element ID: {f.revitElementId || 'N/A'} | Zone: {f.affectedRoomOrZone}</span>
                    <span>Reviewer Decision: <strong className="text-slate-800">{f.reviewerDecision}</strong></span>
                  </div>

                  <div className="p-2 bg-blue-50/60 rounded border border-blue-100 text-slate-800 text-[11px]">
                    <strong>Corrective Action:</strong> {f.recommendedCorrectiveAction}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Unassessed Requirements Requiring Documentary / On-Site Audit */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1">
              4. Unassessed Requirements Requiring Documentary / On-Site Audit
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              The following EASA Part-145 provisions cannot be verified solely from Revit architectural geometry and require empirical documentation or physical inspection:
            </p>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                <div className="font-semibold text-slate-800">145.A.25(a) &amp; (c) — Weather Protection, Dust Sealing &amp; Temperature Control</div>
                <div className="text-slate-600 text-[11px]">Requires 30-day continuous calibrated temperature/humidity datalogger logs and ASHRAE MERV 13 filtration commissioning reports.</div>
              </div>
              <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                <div className="font-semibold text-slate-800">145.A.40(a) — Tool &amp; Equipment Calibration Validity</div>
                <div className="text-slate-600 text-[11px]">Requires DAkkS / ISO 17025 accredited calibration certificates and master tool register verification.</div>
              </div>
              <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                <div className="font-semibold text-slate-800">145.A.25(d) &amp; 145.A.42 — Quarantine Physical Security &amp; Key Custody</div>
                <div className="text-slate-600 text-[11px]">Requires Maintenance Organization Exposition (MOE) Chapter 2.2 storekeeper procedure and physical lock custody register.</div>
              </div>
            </div>
          </div>

          {/* Document Sign-off Footer */}
          <div className="pt-6 border-t-2 border-slate-900 grid grid-cols-2 gap-10 text-xs text-slate-700">
            <div className="space-y-1">
              <div className="h-12 border-b border-slate-400 mb-1" />
              <div><strong>Lead Airworthiness &amp; BIM Surveyor</strong></div>
              <div className="text-slate-500 text-[11px]">Name, Professional License / Part-66 &amp; Date</div>
            </div>
            <div className="space-y-1">
              <div className="h-12 border-b border-slate-400 mb-1" />
              <div><strong>Facility Quality &amp; Safety Director</strong></div>
              <div className="text-slate-500 text-[11px]">{project.facilityManager} &amp; Management Date</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
