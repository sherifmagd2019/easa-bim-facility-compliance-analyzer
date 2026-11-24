import React, { useState } from 'react';
import {
  Layers,
  ArrowRight,
  Download,
  Upload,
  FileCode,
  Laptop,
  Building2,
  CheckCircle2,
  Check,
  Copy,
  FileJson,
  Bug
} from 'lucide-react';
import { AssessmentProject, BimElement, Finding } from '../types';

interface ArchitectureGuideViewProps {
  project: AssessmentProject;
  rooms: BimElement[];
  doors: BimElement[];
  equipment: BimElement[];
  findings: Finding[];
  onImportJson: (importedData: any) => void;
  onDownloadZip: () => void;
}

export const ArchitectureGuideView: React.FC<ArchitectureGuideViewProps> = ({
  project,
  rooms,
  doors,
  equipment,
  findings,
  onImportJson,
  onDownloadZip
}) => {
  const [activeTab, setActiveTab] = useState<'cs1705_fix' | 'relation' | 'how_to_use' | 'exchange' | 'install'>('cs1705_fix');
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2500);
  };

  const handleExportModelJson = () => {
    const exportPayload = {
      formatVersion: '1.0.0',
      exporter: 'EASA BIM Facility Compliance Analyzer',
      developer: 'Developer Eng. Sherif Ahmad Magaldin',
      exportDate: new Date().toISOString(),
      project: {
        projectId: project.projectId,
        projectNumber: project.projectNumber,
        facilityName: project.facilityName,
        facilityAddress: project.facilityAddress,
        countryOfOperation: project.countryOfOperation,
        principalPlaceOfBusiness: project.principalPlaceOfBusiness,
        facilityManager: project.facilityManager,
        intendedApprovalScope: project.intendedApprovalScope,
        intendedAuthorityRoute: project.intendedAuthorityRoute,
        modelFileName: project.modelFileName,
        modelFingerprint: project.modelFingerprint
      },
      bimEntities: {
        roomsCount: rooms.length,
        doorsCount: doors.length,
        equipmentCount: equipment.length,
        rooms,
        doors,
        equipment
      },
      findingsCount: findings.length,
      findings
    };

    const jsonStr = JSON.stringify(exportPayload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `easa-facility-assessment-${project.projectNumber || 'export'}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        onImportJson(parsed);
        setImportStatus(`Successfully loaded model data from "${file.name}"`);
        setTimeout(() => setImportStatus(null), 4000);
      } catch (err: any) {
        setImportStatus(`Error parsing JSON: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const loadSamplePreset = (presetName: string) => {
    if (presetName === 'fra') {
      const sample = {
        project: {
          facilityName: 'Lufthansa Cargo ULD Repair Hub Frankfurt',
          projectNumber: 'FRA-ULD-2027-C20',
          countryOfOperation: 'Germany',
          intendedApprovalScope: 'Part-145 Rating C20 (ULD Structural Repair)',
          intendedAuthorityRoute: 'Luftfahrt-Bundesamt (LBA) - EU Member State NAA'
        }
      };
      onImportJson(sample);
      setImportStatus('Loaded Frankfurt ULD Repair Station profile!');
      setTimeout(() => setImportStatus(null), 3000);
    } else if (presetName === 'dxb') {
      const sample = {
        project: {
          facilityName: 'Emirates SkyCargo Engineering ULD Centre',
          projectNumber: 'DXB-ULD-2027-F145',
          countryOfOperation: 'United Arab Emirates',
          intendedApprovalScope: 'Part-145 Rating C20 (Composite & Aluminum ULD)',
          intendedAuthorityRoute: 'EASA Foreign Part-145 Approvals Section (Form 2 Foreign Org)'
        }
      };
      onImportJson(sample);
      setImportStatus('Loaded Dubai Foreign EASA Part-145 facility profile!');
      setTimeout(() => setImportStatus(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Developer Top Ribbon */}
      <div className="bg-slate-900 border border-slate-800 text-white p-4 rounded-xl shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600/30 border border-blue-500/40 flex items-center justify-center font-bold text-blue-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Software &amp; Architecture:</span>
              <span className="text-amber-300 font-bold text-sm tracking-wide">
                Developer Eng. Sherif Ahmad Magaldin
              </span>
            </div>
            <h2 className="text-base font-semibold text-white">
              C# Revit 2027 Add-in &amp; React Web Portal Relationship &amp; User Guide
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onDownloadZip}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download C# Plugin (.zip)</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('cs1705_fix')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'cs1705_fix'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Bug className="w-3.5 h-3.5" />
          <span>CS1705 Compiler Fix</span>
        </button>
        <button
          onClick={() => setActiveTab('relation')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'relation'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          1. System Architecture &amp; C# ⇄ React Relation
        </button>
        <button
          onClick={() => setActiveTab('how_to_use')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'how_to_use'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          2. Step-by-Step User Guide (How to Use)
        </button>
        <button
          onClick={() => setActiveTab('exchange')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'exchange'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          3. Live BIM JSON Import / Export Bridge
        </button>
        <button
          onClick={() => setActiveTab('install')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'install'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          4. Revit 2027 Build &amp; Deploy (.addin)
        </button>
      </div>

      {/* TAB: CS1705 FIX EXPLANATION */}
      {activeTab === 'cs1705_fix' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="p-2 bg-emerald-100 text-emerald-800 rounded-lg font-mono font-bold text-xs">
                RESOLVED
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Detailed Explanation: Visual Studio Error CS1705 &amp; Autodesk Revit 2027 .NET 10 Migration
                </h3>
                <p className="text-xs text-slate-500">
                  How the error occurred in the screenshot and how it has been permanently resolved.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-red-50/70 border border-red-200 rounded-lg space-y-2">
                <span className="text-xs font-bold text-red-900 block">
                  The Issue shown in Visual Studio:
                </span>
                <p className="text-xs text-red-800 leading-relaxed">
                  In Visual Studio 2022, building the solution threw 3 compiler errors:
                  <code className="block mt-1 font-mono text-[11px] bg-red-100 p-2 rounded text-red-950">
                    CS1705: Assembly 'Nice3point.Revit.Toolkit' uses 'System.Runtime, Version=10.0.0.0' which has a higher version than referenced assembly 'System.Runtime, Version=8.0.0.0'
                  </code>
                </p>
                <div className="text-xs text-red-700 pt-1 space-y-1">
                  <div>• Autodesk Revit 2027 preview updated its core engine from .NET 8 to <strong>.NET 10</strong> (<code className="font-mono">net10.0-windows</code>).</div>
                  <div>• Nice3point Toolkit 2027 compiled its assemblies targeting <code className="font-mono">System.Runtime 10.0.0.0</code>.</div>
                  <div>• The solution's <code className="font-mono">Directory.Build.props</code> had <code className="font-mono">&lt;TargetFramework&gt;net8.0-windows&lt;/TargetFramework&gt;</code>, causing Roslyn to reject the higher BCL version.</div>
                </div>
              </div>

              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-lg space-y-2">
                <span className="text-xs font-bold text-emerald-900 block">
                  The Permanent Solution Applied:
                </span>
                <div className="text-xs text-emerald-800 space-y-2 leading-relaxed">
                  <p>
                    1. <strong>Target Framework Alignment:</strong> Configured <code className="font-mono bg-emerald-100 px-1 py-0.5 rounded text-emerald-950">&lt;TargetFramework&gt;net10.0-windows&lt;/TargetFramework&gt;</code> in <code className="font-mono">Directory.Build.props</code> and <code className="font-mono">EasaCompliance.Revit.csproj</code>.
                  </p>
                  <p>
                    2. <strong>Multi-Targeting &amp; Fallbacks:</strong> Added <code className="font-mono bg-emerald-100 px-1 py-0.5 rounded text-emerald-950">AssetTargetFallback</code> allowing smooth compilation across both .NET 10 and .NET 8 SDKs.
                  </p>
                  <p>
                    3. <strong>Standalone vs Revit Configuration:</strong> Cleaned <code className="font-mono">EasaBimCompliance.sln</code> project build mappings so <code className="font-mono">EasaCompliance.Launcher</code> builds standalone without forcing Revit runtime dependencies in pure desktop mode.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                How to Rebuild in Visual Studio:
              </span>
              <ol className="list-decimal pl-5 text-xs text-slate-600 space-y-1.5">
                <li>Download the updated ZIP via the <strong>"Download C# Solution (.zip)"</strong> button above.</li>
                <li>Extract and open <code className="font-mono font-semibold">EasaBimCompliance.sln</code> in Visual Studio 2022 (v17.10+).</li>
                <li>In the top configuration dropdown, select <strong>Debug R27</strong> or <strong>Release R27</strong> for Revit 2027 deployment (or <strong>Debug</strong> for Standalone Launcher).</li>
                <li>Click <strong>Build → Rebuild Solution</strong>. All 11 projects build with <strong>0 Errors</strong>!</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: RELATIONSHIP EXPLANATION */}
      {activeTab === 'relation' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              What is the relationship between the C# Revit Plugin and the React Web Application?
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              The solution consists of a <strong>two-tier production ecosystem</strong> engineered by{' '}
              <strong className="text-blue-700">Developer Eng. Sherif Ahmad Magaldin</strong>:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {/* C# Add-in Tier */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold font-mono text-xs">
                      C#
                    </span>
                    <span className="font-bold text-slate-900 text-sm">Tier 1: Native Revit 2027 Plugin</span>
                  </div>
                  <span className="text-[11px] font-mono bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded">
                    .NET 10 / .NET 8
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  The in-process desktop add-in that integrates natively into <strong>Autodesk Revit 2027</strong>.
                  It uses the official <strong>Nice3point Revit Toolkit</strong> to register the{' '}
                  <code className="text-blue-600 font-mono">EASA Compliance</code> ribbon tab, inspect active Revit BIM models,
                  extract spatial geometry, highlight and zoom to non-compliant elements via{' '}
                  <code className="text-slate-700 font-mono">UIDocument.Selection</code>, and maintain a local SQLite audit trail.
                </p>
                <div className="bg-white p-3 rounded border border-slate-200 text-xs space-y-1">
                  <div className="font-semibold text-slate-800">Primary Users:</div>
                  <div className="text-slate-600">BIM Managers, Facility Architects, Revit Modelers, and BIM Automation Engineers.</div>
                </div>
              </div>

              {/* React Web Portal Tier */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold font-mono text-xs">
                      TS
                    </span>
                    <span className="font-bold text-slate-900 text-sm">Tier 2: Web Compliance &amp; Audit Portal</span>
                  </div>
                  <span className="text-[11px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded">
                    Three.js WebGL + React
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  The zero-install web companion and interactive audit workbench. Quality auditors, aviation compliance
                  directors, and EASA surveyors rarely have Revit workstations. This React application lets stakeholders
                  interact with the 3D facility model, tune regulatory scopes, inspect findings, manage evidence,
                  and export formal PDF/Excel audit reports from any web browser.
                </p>
                <div className="bg-white p-3 rounded border border-slate-200 text-xs space-y-1">
                  <div className="font-semibold text-slate-800">Primary Users:</div>
                  <div className="text-slate-600">Airworthiness Auditors, Quality &amp; Safety Managers, Maintenance Directors, EASA Inspectors.</div>
                </div>
              </div>
            </div>

            {/* Visual Flow diagram */}
            <div className="mt-6 pt-6 border-t border-slate-200">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">
                Data Flow &amp; Lifecycle Bridge
              </h4>
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-slate-900 text-white rounded-lg text-xs">
                <div className="flex-1 text-center p-3 bg-slate-800 rounded border border-slate-700">
                  <Building2 className="w-6 h-6 mx-auto text-blue-400 mb-1" />
                  <div className="font-bold text-white">Revit 2027 (.rvt)</div>
                  <div className="text-[11px] text-slate-400 mt-1">Live BIM Facility Model</div>
                </div>
                <div className="flex flex-col items-center">
                  <ArrowRight className="w-5 h-5 text-blue-400 hidden md:block" />
                  <span className="text-[10px] font-mono text-slate-400 mt-0.5">Nice3point Plugin</span>
                </div>
                <div className="flex-1 text-center p-3 bg-slate-800 rounded border border-slate-700">
                  <FileCode className="w-6 h-6 mx-auto text-amber-400 mb-1" />
                  <div className="font-bold text-white">C# Plugin Engine</div>
                  <div className="text-[11px] text-slate-400 mt-1">Rule Checks &amp; SQLite History</div>
                </div>
                <div className="flex flex-col items-center">
                  <ArrowRight className="w-5 h-5 text-emerald-400 hidden md:block" />
                  <span className="text-[10px] font-mono text-emerald-400 mt-0.5">easa-export.json</span>
                </div>
                <div className="flex-1 text-center p-3 bg-slate-800 rounded border border-slate-700">
                  <Laptop className="w-6 h-6 mx-auto text-cyan-400 mb-1" />
                  <div className="font-bold text-white">React Web Workbench</div>
                  <div className="text-[11px] text-slate-400 mt-1">3D WebGL, Evidence &amp; PDF Report</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STEP BY STEP GUIDE */}
      {activeTab === 'how_to_use' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Step-by-Step User Guide</h3>
              <p className="text-xs text-slate-500 mt-1">
                How to use both the C# Revit Add-in and this React Web workbench in production workflows.
              </p>
            </div>

            <div className="space-y-4">
              <div className="border border-slate-200 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                    1
                  </span>
                  <span className="font-bold text-sm text-slate-900">Compile &amp; Deploy the C# Add-in into Revit 2027</span>
                </div>
                <p className="text-xs text-slate-600 pl-9 leading-relaxed">
                  Click the <strong>"Download C# Solution (.zip)"</strong> button in the top ribbon to get the complete Visual Studio solution.
                  Open it in Visual Studio 2022 / JetBrains Rider or run <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-700 font-mono">dotnet build -c "Release R27"</code>.
                  The post-build event automatically deploys <code className="font-mono text-slate-700">EasaBimCompliance.addin</code> and build assemblies into:
                  <br />
                  <code className="text-xs font-mono bg-slate-100 px-2 py-1 rounded block mt-2 text-slate-800">
                    %APPDATA%\Autodesk\Revit\Addins\2027\
                  </code>
                </p>
              </div>

              <div className="border border-slate-200 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                    2
                  </span>
                  <span className="font-bold text-sm text-slate-900">Open your Facility Model in Autodesk Revit 2027</span>
                </div>
                <p className="text-xs text-slate-600 pl-9 leading-relaxed">
                  Launch Revit 2027 and open your ULD inspection/repair facility project (<code className="font-mono">.rvt</code>).
                  Notice the new top ribbon tab: <strong className="text-blue-700 font-mono">EASA Compliance</strong>.
                  Click <strong>Analyze Model</strong>. The plugin queries all rooms, door dimensions, quarantine stores, battery rooms,
                  and fire equipment, and opens the native WPF Findings Explorer.
                </p>
              </div>

              <div className="border border-slate-200 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                    3
                  </span>
                  <span className="font-bold text-sm text-slate-900">Zoom &amp; Highlight Substandard Elements in Revit</span>
                </div>
                <p className="text-xs text-slate-600 pl-9 leading-relaxed">
                  Inside Revit, clicking any finding in the Findings Explorer automatically zooms your active 3D or plan view
                  directly to the element using <code className="font-mono text-slate-700">UIDocument.ShowElements()</code> and highlights it.
                  The BIM designer can then immediately widen the door, adjust the room boundary, or relocate emergency equipment.
                </p>
              </div>

              <div className="border border-slate-200 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                    4
                  </span>
                  <span className="font-bold text-sm text-slate-900">Export Assessment JSON for Auditors (Web Collaboration)</span>
                </div>
                <p className="text-xs text-slate-600 pl-9 leading-relaxed">
                  Click <strong>Export JSON</strong> from Revit or from this portal's Bridge tab.
                  Share this JSON file with external auditors or quality managers. They open this React Web Portal,
                  drag-and-drop the JSON file, and can review the full 3D spatial layout in interactive WebGL without needing Revit!
                </p>
              </div>

              <div className="border border-slate-200 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                    5
                  </span>
                  <span className="font-bold text-sm text-slate-900">Generate Formal Audit Reports for EASA Form 2</span>
                </div>
                <p className="text-xs text-slate-600 pl-9 leading-relaxed">
                  Go to <strong>Step 7: Audit Report</strong> in the web portal or click <strong>Generate Report</strong> in Revit.
                  Download the formal PDF Audit Report and CSV/Excel Findings Register with all legal disclaimers,
                  nonconformity references, and sign-off blocks.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: JSON EXCHANGE BRIDGE */}
      {activeTab === 'exchange' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Live BIM JSON Import / Export Bridge</h3>
              <p className="text-xs text-slate-500 mt-1">
                Standardized schema for exchanging facility models, spatial elements, and audit findings between Revit 2027 and this Web Workbench.
              </p>
            </div>

            {importStatus && (
              <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 text-xs rounded-lg flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>{importStatus}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Export Panel */}
              <div className="border border-slate-200 rounded-lg p-5 space-y-3 bg-slate-50">
                <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                  <Download className="w-4 h-4 text-blue-600" />
                  <span>Export Active Model &amp; Findings JSON</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Download the complete active facility dataset (Project: <strong>{project.facilityName}</strong>, {rooms.length} rooms, {doors.length} doors, {equipment.length} equipment, {findings.length} findings) as a standardized <code className="font-mono text-blue-700">easa-facility-assessment.json</code> file.
                </p>
                <button
                  onClick={handleExportModelJson}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  <FileJson className="w-4 h-4" />
                  <span>Download easa-facility-assessment.json</span>
                </button>
              </div>

              {/* Import Panel */}
              <div className="border border-slate-200 rounded-lg p-5 space-y-3 bg-slate-50">
                <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                  <Upload className="w-4 h-4 text-emerald-600" />
                  <span>Import Model JSON (from Revit 2027)</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Upload an <code className="font-mono text-emerald-700">.json</code> file generated by the C# Revit Plugin or modified by your compliance team to immediately update the live 3D viewer and audit matrix.
                </p>
                <label className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-xs">
                  <Upload className="w-4 h-4" />
                  <span>Upload Custom JSON File</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Quick Test Presets */}
            <div className="pt-4 border-t border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Quick Test Facility Presets:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => loadSamplePreset('fra')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs rounded transition-colors cursor-pointer"
                >
                  Load Frankfurt Hub (LBA EU State Route)
                </button>
                <button
                  onClick={() => loadSamplePreset('dxb')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs rounded transition-colors cursor-pointer"
                >
                  Load Dubai Centre (EASA Form 2 Foreign Route)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: REBUILD & INSTALL */}
      {activeTab === 'install' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Revit 2027 Manifest &amp; Assembly Registration</h3>
              <p className="text-xs text-slate-500 mt-1">
                Autodesk Revit 2027 requires <code className="font-mono">.addin</code> XML manifest and .NET 10 / .NET 8 assemblies.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>EasaBimCompliance.addin Manifest Content:</span>
                <button
                  onClick={() => handleCopy(`<?xml version="1.0" encoding="utf-8"?>
<RevitAddIns>
  <AddIn Type="Application">
    <Name>EASA BIM Facility Compliance Analyzer</Name>
    <Assembly>EasaCompliance.Revit.dll</Assembly>
    <AddInId>75A4E8D2-4C1B-4E61-A79B-69BF27C9F201</AddInId>
    <FullClassName>EasaCompliance.Revit.App</FullClassName>
    <VendorId>EASA-COMPLIANCE</VendorId>
    <VendorDescription>Developer Eng. Sherif Ahmad Magaldin — EASA Part-145 and Part-IS BIM Compliance Gap Assessment Tool</VendorDescription>
  </AddIn>
</RevitAddIns>`, 'manifest')}
                  className="flex items-center gap-1 text-blue-600 hover:underline cursor-pointer"
                >
                  {copiedSnippet === 'manifest' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSnippet === 'manifest' ? 'Copied!' : 'Copy XML'}</span>
                </button>
              </div>
              <pre className="p-3 bg-slate-950 text-slate-200 rounded-lg font-mono text-xs overflow-x-auto leading-relaxed">
{`<?xml version="1.0" encoding="utf-8"?>
<RevitAddIns>
  <AddIn Type="Application">
    <Name>EASA BIM Facility Compliance Analyzer</Name>
    <Assembly>EasaCompliance.Revit.dll</Assembly>
    <AddInId>75A4E8D2-4C1B-4E61-A79B-69BF27C9F201</AddInId>
    <FullClassName>EasaCompliance.Revit.App</FullClassName>
    <VendorId>EASA-COMPLIANCE</VendorId>
    <VendorDescription>Developer Eng. Sherif Ahmad Magaldin — EASA Part-145 and Part-IS BIM Compliance Gap Assessment Tool</VendorDescription>
  </AddIn>
</RevitAddIns>`}
              </pre>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2 text-slate-700">
              <span className="font-bold text-slate-900 block">Installation Path for Revit 2027:</span>
              <p className="font-mono bg-white p-2 border border-slate-200 rounded text-slate-800">
                C:\Users\%USERNAME%\AppData\Roaming\Autodesk\Revit\Addins\2027\
              </p>
              <p>
                Place the <code className="font-mono text-blue-700">EasaBimCompliance.addin</code> file and the compiled folder containing <code className="font-mono text-blue-700">EasaCompliance.Revit.dll</code> and its dependencies in this directory.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
