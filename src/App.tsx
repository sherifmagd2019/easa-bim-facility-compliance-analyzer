import React, { useState } from 'react';
import { RibbonNav, RibbonTab } from './components/RibbonNav';
import { BimViewer3D } from './components/BimViewer3D';
import { ProjectSetupView } from './components/ProjectSetupView';
import { ModelCompletenessView } from './components/ModelCompletenessView';
import { RegulatoryScopeView } from './components/RegulatoryScopeView';
import { RequirementsLibraryView } from './components/RequirementsLibraryView';
import { RuleEngineView } from './components/RuleEngineView';
import { FindingsExplorerView } from './components/FindingsExplorerView';
import { UldRouteAnalyzer } from './components/UldRouteAnalyzer';
import { EvidenceManagerView } from './components/EvidenceManagerView';
import { ReportExportView } from './components/ReportExportView';
import { AssessmentHistoryView } from './components/AssessmentHistoryView';
import { SolutionExplorerView } from './components/SolutionExplorerView';
import { ArchitectureGuideView } from './components/ArchitectureGuideView';
import { downloadSolutionZip } from './utils/zipExporter';
import {
  initialProject,
  syntheticRooms,
  syntheticDoors,
  syntheticEquipment,
  defaultRequirementsLibrary,
  defaultRules,
  defaultFindings,
  defaultEvidenceItems,
  defaultCorrectiveActions,
  defaultModelCompleteness,
  standardUldProfiles
} from './data/syntheticFacilityData';
import {
  AssessmentProject,
  BimElement,
  Finding,
  RequirementRecord,
  RuleDefinition,
  EvidenceItem,
  CorrectiveAction,
  SeverityLevel
} from './types';
import {
  Building2,
  CheckCircle2,
  Layers,
  Focus,
  Eye,
  HelpCircle,
  Flame,
  AlertTriangle,
  Boxes,
  ShieldAlert,
  Upload,
  RefreshCw,
  Cpu
} from 'lucide-react';

export default function App() {
  const [activeRibbonTab, setActiveRibbonTab] = useState<RibbonTab>('analyzer');
  const [activeWorkflowTab, setActiveWorkflowTab] = useState<
    '3d_view' | 'project' | 'completeness' | 'scope' | 'uld_route' | 'rules' | 'findings' | 'evidence' | 'reports' | 'guide'
  >('3d_view');

  // Mode state: Demo mode vs Live Revit inspection mode
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);

  const [project, setProject] = useState<AssessmentProject>(initialProject);
  const [rooms, setRooms] = useState<BimElement[]>(syntheticRooms);
  const [doors, setDoors] = useState<BimElement[]>(syntheticDoors);
  const [equipment, setEquipment] = useState<BimElement[]>(syntheticEquipment);
  const [requirements, setRequirements] = useState<RequirementRecord[]>(defaultRequirementsLibrary);
  const [rules, setRules] = useState<RuleDefinition[]>(defaultRules);
  const [findings, setFindings] = useState<Finding[]>(defaultFindings);
  const [evidence, setEvidence] = useState<EvidenceItem[]>(defaultEvidenceItems);
  const [correctiveActions, setCorrectiveActions] = useState<CorrectiveAction[]>(defaultCorrectiveActions);

  const [selectedElement, setSelectedElement] = useState<BimElement | null>(null);
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(defaultFindings[0]?.findingId || null);
  const [isolatedElementId, setIsolatedElementId] = useState<number | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Switch between Demo and Live Mode
  const handleToggleMode = (demo: boolean) => {
    setIsDemoMode(demo);
    if (!demo && !isLiveConnected) {
      // In live mode without connection, clear synthetic findings so sample data never pollutes live results
      setRooms([]);
      setDoors([]);
      setEquipment([]);
      setFindings([]);
      setSelectedElement(null);
      setProject(prev => ({
        ...prev,
        isDemoData: false,
        facilityName: 'Live Revit Session (Waiting for Document)',
        modelFileName: 'No Active Revit Document Connected',
        modelFingerprint: 'AWAITING_EXTRACTION'
      }));
    } else if (demo) {
      // Restore synthetic demo data
      setRooms(syntheticRooms);
      setDoors(syntheticDoors);
      setEquipment(syntheticEquipment);
      setFindings(defaultFindings);
      setProject(initialProject);
      setSelectedFindingId(defaultFindings[0]?.findingId || null);
    }
  };

  // Handle JSON Import from live Revit Add-in
  const handleImportJson = (imported: any) => {
    setIsDemoMode(false);
    setIsLiveConnected(true);
    if (imported.project) {
      setProject(prev => ({ ...prev, ...imported.project, isDemoData: false }));
    }
    if (imported.bimEntities?.rooms || Array.isArray(imported.rooms)) {
      setRooms(imported.bimEntities?.rooms || imported.rooms);
    }
    if (imported.bimEntities?.doors || Array.isArray(imported.doors)) {
      setDoors(imported.bimEntities?.doors || imported.doors);
    }
    if (imported.bimEntities?.equipment || Array.isArray(imported.equipment)) {
      setEquipment(imported.bimEntities?.equipment || imported.equipment);
    }
    if (Array.isArray(imported.findings)) {
      setFindings(imported.findings);
    }
    setSelectedElement(null);
  };

  // Trigger analysis simulation
  const handleRunAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setActiveWorkflowTab('findings');
    }, 700);
  };

  // Select finding and zoom to element in 3D
  const handleSelectFinding = (finding: Finding) => {
    setSelectedFindingId(finding.findingId);
    if (finding.revitElementId) {
      const el = [...rooms, ...doors, ...equipment].find(e => e.elementId === finding.revitElementId) || null;
      setSelectedElement(el);
    }
  };

  // Zoom directly to an element
  const handleZoomToElement = (elementId: number) => {
    const el = [...rooms, ...doors, ...equipment].find(e => e.elementId === elementId) || null;
    setSelectedElement(el);
    setActiveWorkflowTab('3d_view');
  };

  // Toggle isolate mode
  const handleToggleIsolate = () => {
    if (isolatedElementId != null) {
      setIsolatedElementId(null);
    } else if (selectedElement) {
      setIsolatedElementId(selectedElement.elementId);
    }
  };

  const handleIsolateElement = (elementId: number) => {
    setIsolatedElementId(elementId);
    setActiveWorkflowTab('3d_view');
  };

  const handleToggleRule = (ruleId: string) => {
    setRules(prev => prev.map(r => r.ruleId === ruleId ? { ...r, isEnabled: !r.isEnabled } : r));
  };

  const handleUpdateRuleSeverity = (ruleId: string, severity: SeverityLevel) => {
    setRules(prev => prev.map(r => r.ruleId === ruleId ? { ...r, defaultSeverity: severity } : r));
  };

  const handleUpdateRuleParameter = (ruleId: string, paramKey: string, newValue: any) => {
    setRules(prev => prev.map(r => {
      if (r.ruleId !== ruleId || !r.configurableParameters || !r.configurableParameters[paramKey]) return r;
      return {
        ...r,
        configurableParameters: {
          ...r.configurableParameters,
          [paramKey]: {
            ...r.configurableParameters[paramKey],
            value: newValue
          }
        }
      };
    }));
  };

  const handleUpdateFinding = (updated: Finding) => {
    setFindings(prev => prev.map(f => f.findingId === updated.findingId ? updated : f));
  };

  const handleUpdateRequirement = (updated: RequirementRecord) => {
    setRequirements(prev => prev.map(r => r.requirementId === updated.requirementId ? updated : r));
  };

  const handleAddEvidence = (item: EvidenceItem) => {
    setEvidence(prev => [item, ...prev]);
  };

  const handleUpdateActionStatus = (actionId: string, status: CorrectiveAction['status'], reviewer: string) => {
    setCorrectiveActions(prev => prev.map(a => a.actionId === actionId ? {
      ...a,
      status,
      closureReviewer: reviewer,
      closureDate: new Date().toISOString().split('T')[0],
      retestResult: 'Verified Modeled Check'
    } : a));
  };

  // Element related findings
  const elementFindings = selectedElement
    ? findings.filter(f => f.revitElementId === selectedElement.elementId)
    : [];

  // Selected element compliance severity for heat map overlay
  const selectedElementSeverity: SeverityLevel | 'Compliant' = (() => {
    if (!selectedElement) return 'Compliant';
    const active = elementFindings.filter(f => f.status === 'Gap found' || f.status === 'Needs human review');
    if (active.some(f => f.severity === 'Critical')) return 'Critical';
    if (active.some(f => f.severity === 'High')) return 'High';
    if (active.some(f => f.severity === 'Medium')) return 'Medium';
    if (active.some(f => f.severity === 'Low')) return 'Low';
    if (active.some(f => f.severity === 'Informational')) return 'Informational';
    return 'Compliant';
  })();

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900">
      {/* Top Ribbon Navigation */}
      <RibbonNav
        activeTab={activeRibbonTab}
        onSelectTab={tab => {
          setActiveRibbonTab(tab);
          if (tab === 'analyzer') setActiveWorkflowTab('3d_view');
          if (tab === 'analyze_model') handleRunAnalysis();
          if (tab === 'requirements') setActiveWorkflowTab('scope');
          if (tab === 'findings') setActiveWorkflowTab('findings');
          if (tab === 'report') setActiveWorkflowTab('reports');
          if (tab === 'settings') setActiveWorkflowTab('project');
          if (tab === 'guide') setActiveWorkflowTab('guide');
        }}
        onRunAnalysis={handleRunAnalysis}
        isAnalyzing={isAnalyzing}
        onDownloadZip={downloadSolutionZip}
      />

      {/* Prominent Demo Mode vs Live Revit Inspection Banner */}
      <div className={`px-6 py-2.5 flex flex-wrap items-center justify-between text-xs gap-3 border-b ${
        isDemoMode
          ? 'bg-amber-500/10 border-amber-300 text-amber-950'
          : 'bg-emerald-950 text-white border-emerald-800'
      }`}>
        <div className="flex items-center gap-3">
          <span className={`px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[10px] ${
            isDemoMode
              ? 'bg-amber-200 text-amber-900 border border-amber-400'
              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
          }`}>
            {isDemoMode ? 'Demo / Sample Mode' : 'Live Revit Inspection Mode'}
          </span>
          <span className="font-medium">
            {isDemoMode
              ? 'Displaying synthetic ULD overhaul facility dataset (FRA-ULD-MNT-2027-R03.rvt) for evaluation. No live Revit model connected.'
              : isLiveConnected
              ? `Auditing active live model: ${project.facilityName} (${rooms.length} rooms, ${doors.length} doors, ${findings.length} findings).`
              : 'Live inspection active. Waiting for active Revit session data or exported JSON import.'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isDemoMode ? (
            <button
              onClick={() => handleToggleMode(false)}
              className="px-3 py-1 bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold rounded text-xs transition-colors cursor-pointer border border-amber-400"
            >
              Switch to Live Revit Inspection
            </button>
          ) : (
            <button
              onClick={() => handleToggleMode(true)}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded text-xs transition-colors cursor-pointer border border-slate-700"
            >
              Load Demo Dataset
            </button>
          )}
        </div>
      </div>

      {/* Active Model Context Strip */}
      <div className="bg-white border-b border-slate-200 px-6 py-2.5 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-4 shadow-2xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-slate-900">{project.facilityName}</span>
          </div>
          <span className="text-slate-300">|</span>
          <span className="font-mono text-slate-500">{project.modelFileName}</span>
          <span className="text-slate-300">|</span>
          <span>Scope: <strong>{project.intendedApprovalScope}</strong></span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-slate-500">
            Route: <strong className="text-slate-700">{project.intendedAuthorityRoute.split('(')[0]}</strong>
          </span>
          <span className="text-slate-300">|</span>
          <button
            onClick={() => {
              setActiveRibbonTab('guide');
              setActiveWorkflowTab('guide');
            }}
            className="text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-1 cursor-pointer bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded border border-blue-200 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
            <span>How to Connect Revit Add-in</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-6">
        {/* If in Live mode without connected model, show clean waiting state with zero sample values */}
        {!isDemoMode && !isLiveConnected ? (
          <div className="bg-white border-2 border-dashed border-slate-300 rounded-xl p-12 text-center max-w-2xl mx-auto space-y-5 my-8">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
              <Cpu className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-slate-900">
                Awaiting Live Revit 2025 / 2026 / 2027 Connection
              </h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Sample values have been removed from live results. Connect the Revit add-in directly via the ribbon or drop an exported JSON file from your active Revit session.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-left text-xs text-slate-700 space-y-2 max-w-md mx-auto">
              <div className="font-bold text-slate-900">How to Audit Live Revit Project:</div>
              <ol className="list-decimal pl-4 space-y-1 text-slate-600">
                <li>Download and build the C# solution (<code>EasaBimCompliance.sln</code>).</li>
                <li>In Autodesk Revit, click the <strong>EASA Compliance</strong> ribbon tab.</li>
                <li>Click <strong>Analyze Model</strong> to extract live rooms, doors, and equipment.</li>
                <li>Or export model JSON from Revit and drop it below.</li>
              </ol>
            </div>

            <div className="pt-2 flex justify-center gap-3">
              <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-sm">
                <Upload className="w-4 h-4" />
                <span>Import Revit JSON Export</span>
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = ev => {
                        try {
                          const json = JSON.parse(ev.target?.result as string);
                          handleImportJson(json);
                        } catch (err) {
                          alert('Invalid JSON file format.');
                        }
                      };
                      reader.readAsText(file);
                    }
                  }}
                />
              </label>
              <button
                onClick={() => handleToggleMode(true)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer border border-slate-300"
              >
                Return to Demo Mode
              </button>
            </div>
          </div>
        ) : activeRibbonTab === 'solution' ? (
          <SolutionExplorerView onDownloadZip={downloadSolutionZip} />
        ) : activeRibbonTab === 'requirements' ? (
          <RequirementsLibraryView library={requirements} />
        ) : activeRibbonTab === 'history' ? (
          <AssessmentHistoryView />
        ) : activeRibbonTab === 'guide' ? (
          <ArchitectureGuideView
            project={project}
            rooms={rooms}
            doors={doors}
            equipment={equipment}
            findings={findings}
            onImportJson={handleImportJson}
            onDownloadZip={downloadSolutionZip}
          />
        ) : (
          <div className="space-y-6">
            {/* Workflow Step Navigation Tabs */}
            <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto pb-1 text-xs">
              {[
                { id: '3d_view', label: '3D BIM Facility Model' },
                { id: 'project', label: '1. Project Setup' },
                { id: 'completeness', label: '2. Model Completeness' },
                { id: 'scope', label: '3. Regulatory Scope' },
                { id: 'uld_route', label: '4. ULD Route & Door Clearances' },
                { id: 'rules', label: '5. BIM Rule Engine' },
                { id: 'findings', label: '6. Findings Explorer' },
                { id: 'evidence', label: '7. Evidence & Actions' },
                { id: 'reports', label: '8. Audit Report' },
                { id: 'guide', label: '9. C# ⇄ React Guide' }
              ].map(step => (
                <button
                  key={step.id}
                  onClick={() => {
                    setActiveWorkflowTab(step.id as any);
                    if (step.id === 'guide') setActiveRibbonTab('guide');
                  }}
                  className={`px-3.5 py-2 font-semibold rounded-t transition-colors cursor-pointer whitespace-nowrap ${
                    activeWorkflowTab === step.id
                      ? 'bg-white text-blue-600 border-t-2 border-t-blue-600 border-x border-slate-200 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  {step.label}
                </button>
              ))}
            </div>

            {/* Step Content Renders */}
            {activeWorkflowTab === '3d_view' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left: 3D BIM Viewer (8 cols) */}
                  <div className="lg:col-span-8 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 flex items-center gap-2">
                        <Layers className="w-4 h-4 text-blue-600" />
                        <span>Interactive 3D Facility Spatial Model</span>
                      </span>
                      <span className="text-slate-500">
                        Select any room, door, or equipment to inspect properties.
                      </span>
                    </div>

                    <BimViewer3D
                      rooms={rooms}
                      doors={doors}
                      equipment={equipment}
                      findings={findings}
                      selectedElementId={selectedElement?.elementId}
                      onSelectElement={el => {
                        setSelectedElement(el);
                        if (el) {
                          const f = findings.find(find => find.revitElementId === el.elementId);
                          if (f) setSelectedFindingId(f.findingId);
                        }
                      }}
                      isolatedElementId={isolatedElementId}
                      onToggleIsolate={handleToggleIsolate}
                    />
                  </div>

                  {/* Right: Selected Element Inspector (4 cols) */}
                  <div className="lg:col-span-4 bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                        <div>
                          <span className="text-[11px] font-mono text-blue-600 font-bold uppercase">
                            {selectedElement ? `${selectedElement.category} Element` : 'Revit Context'}
                          </span>
                          <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                            {selectedElement ? selectedElement.name : 'Click any model element to inspect'}
                          </h3>
                        </div>
                        {selectedElement && (
                          <span className="text-[11px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                            ID: {selectedElement.elementId}
                          </span>
                        )}
                      </div>

                      {selectedElement ? (
                        <>
                          {/* Heat Map Severity Card */}
                          <div className={`p-2.5 rounded-lg border flex items-center justify-between text-xs ${
                            selectedElementSeverity === 'Critical'
                              ? 'bg-red-500/10 border-red-500/30 text-red-700'
                              : selectedElementSeverity === 'High'
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-700'
                              : selectedElementSeverity === 'Medium'
                              ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-800'
                              : selectedElementSeverity === 'Low' || selectedElementSeverity === 'Informational'
                              ? 'bg-blue-500/10 border-blue-500/30 text-blue-700'
                              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700'
                          }`}>
                            <div className="flex items-center gap-2">
                              <Flame className="w-4 h-4 shrink-0" />
                              <div>
                                <span className="font-bold block text-[11px] leading-tight">
                                  Compliance Heat Map Status
                                </span>
                                <span className="text-[10px] opacity-85">
                                  {selectedElementSeverity === 'Compliant'
                                    ? 'Meets modeled check'
                                    : `${selectedElementSeverity} severity gap detected`}
                                </span>
                              </div>
                            </div>
                            <span className="font-bold font-mono px-2 py-0.5 rounded text-[11px] uppercase bg-white/70 shadow-2xs">
                              {selectedElementSeverity}
                            </span>
                          </div>

                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between py-1 border-b border-slate-50">
                              <span className="text-slate-500">Family:</span>
                              <span className="font-semibold text-slate-800">{selectedElement.familyName}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-50">
                              <span className="text-slate-500">Type:</span>
                              <span className="font-semibold text-slate-800">{selectedElement.typeName}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-50">
                              <span className="text-slate-500">Level:</span>
                              <span className="text-slate-800">{selectedElement.level}</span>
                            </div>
                            {selectedElement.roomName && (
                              <div className="flex justify-between py-1 border-b border-slate-50">
                                <span className="text-slate-500">Associated Room:</span>
                                <span className="font-semibold text-slate-800">{selectedElement.roomName}</span>
                              </div>
                            )}
                            {selectedElement.areaSqM != null && (
                              <div className="flex justify-between py-1 border-b border-slate-50">
                                <span className="text-slate-500">Spatial Area:</span>
                                <span className="font-mono font-bold text-blue-600">{selectedElement.areaSqM.toFixed(1)} m²</span>
                              </div>
                            )}
                            {selectedElement.clearWidthMm != null && (
                              <div className="flex justify-between py-1 border-b border-slate-50">
                                <span className="text-slate-500">Verified Clear Width:</span>
                                <span className={`font-mono font-bold ${
                                  selectedElement.clearWidthMm < 2950 ? 'text-red-600' : 'text-emerald-600'
                                }`}>
                                  {selectedElement.clearWidthMm} mm
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Element Parameters List */}
                          <div className="space-y-1.5 pt-2 border-t border-slate-100">
                            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wide block">
                              Instance Parameters
                            </span>
                            <div className="bg-slate-50 rounded p-2.5 border border-slate-200 max-h-32 overflow-y-auto space-y-1">
                              {Object.entries(selectedElement.parameters).map(([key, val]) => (
                                <div key={key} className="flex justify-between text-[11px] font-mono">
                                  <span className="text-slate-500">{key}:</span>
                                  <span className="text-slate-900 font-semibold">{val}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Element Linked Findings */}
                          {elementFindings.length > 0 && (
                            <div className="space-y-1.5 pt-2 border-t border-slate-100">
                              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide block">
                                Linked EASA Findings ({elementFindings.length})
                              </span>
                              {elementFindings.map(f => (
                                <div
                                  key={f.findingId}
                                  onClick={() => {
                                    setSelectedFindingId(f.findingId);
                                    setActiveWorkflowTab('findings');
                                  }}
                                  className={`p-2 rounded border text-xs cursor-pointer transition-colors ${
                                    f.status === 'Gap found'
                                      ? 'bg-red-50/80 border-red-200 text-red-900 hover:bg-red-100'
                                      : f.status === 'Needs human review'
                                      ? 'bg-amber-50/80 border-amber-200 text-amber-900 hover:bg-amber-100'
                                      : 'bg-emerald-50/80 border-emerald-200 text-emerald-900 hover:bg-emerald-100'
                                  }`}
                                >
                                  <div className="flex justify-between font-mono font-bold text-[11px]">
                                    <span>{f.regulatoryReference}</span>
                                    <span>{f.status}</span>
                                  </div>
                                  <p className="mt-1 line-clamp-2 leading-tight">{f.description}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="py-16 text-center text-xs text-slate-400 space-y-2">
                          <Eye className="w-8 h-8 text-slate-300 mx-auto" />
                          <p>Click any room, cargo door, or riveter in the 3D model to inspect instance parameters and associated EASA Part-145 findings.</p>
                        </div>
                      )}
                    </div>

                    {selectedElement && (
                      <div className="pt-4 border-t border-slate-100 flex items-center gap-2">
                        <button
                          onClick={handleToggleIsolate}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <Focus className="w-3.5 h-3.5" />
                          <span>{isolatedElementId != null ? 'Show All Elements' : 'Isolate Element'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeWorkflowTab === 'project' && (
              <ProjectSetupView project={project} onUpdateProject={setProject} />
            )}

            {activeWorkflowTab === 'completeness' && (
              <ModelCompletenessView
                report={defaultModelCompleteness}
                rooms={rooms}
                doors={doors}
                equipment={equipment}
                onSelectElement={(el: BimElement) => handleZoomToElement(el.elementId)}
              />
            )}

            {activeWorkflowTab === 'scope' && (
              <RegulatoryScopeView
                requirements={requirements}
                onUpdateRequirement={handleUpdateRequirement}
              />
            )}

            {activeWorkflowTab === 'uld_route' && (
              <UldRouteAnalyzer
                doors={doors}
                onZoomToDoor={handleZoomToElement}
                selectedUldId={project.activeUldProfileId || 'uld-pmc'}
                onSelectUld={id => setProject(prev => ({ ...prev, activeUldProfileId: id }))}
              />
            )}

            {activeWorkflowTab === 'rules' && (
              <RuleEngineView
                rules={rules}
                onToggleRule={handleToggleRule}
                onUpdateRuleSeverity={handleUpdateRuleSeverity}
                onUpdateRuleParameter={handleUpdateRuleParameter}
                onRunEngine={handleRunAnalysis}
                isRunning={isAnalyzing}
              />
            )}

            {activeWorkflowTab === 'findings' && (
              <FindingsExplorerView
                findings={findings}
                selectedFindingId={selectedFindingId}
                onSelectFinding={handleSelectFinding}
                onZoomToElement={handleZoomToElement}
                onIsolateElement={handleIsolateElement}
                onUpdateFinding={handleUpdateFinding}
              />
            )}

            {activeWorkflowTab === 'evidence' && (
              <EvidenceManagerView
                evidence={evidence}
                actions={correctiveActions}
                onAddEvidence={handleAddEvidence}
                onUpdateActionStatus={handleUpdateActionStatus}
              />
            )}

            {activeWorkflowTab === 'reports' && (
              <ReportExportView
                project={project}
                findings={findings}
                completeness={defaultModelCompleteness}
              />
            )}

            {activeWorkflowTab === 'guide' && (
              <ArchitectureGuideView
                project={project}
                rooms={rooms}
                doors={doors}
                equipment={equipment}
                findings={findings}
                onImportJson={handleImportJson}
                onDownloadZip={downloadSolutionZip}
              />
            )}
          </div>
        )}
      </main>

      {/* Global Status Bar Footer */}
      <footer className="bg-white border-t border-slate-200 px-6 py-2.5 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="font-bold text-slate-800">EASA Part-145 Compliance-Assistance Tool</span>
          <span className="text-slate-300">|</span>
          <span>Autodesk Revit 2025 / 2026 / 2027 (.NET 8 LTS &amp; .NET 10)</span>
          <span>•</span>
          <span>Regulation (EU) No 1321/2014 &amp; (EU) 2023/203</span>
        </div>
        <div className="text-[11px] text-slate-400">
          Decision-Support Aid for Qualified Auditors — Does not certify or guarantee regulatory compliance
        </div>
      </footer>
    </div>
  );
}
