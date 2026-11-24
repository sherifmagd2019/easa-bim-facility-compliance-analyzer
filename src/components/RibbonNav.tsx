import React from 'react';
import {
  Building2,
  Play,
  BookOpen,
  AlertTriangle,
  FileText,
  History,
  Settings as SettingsIcon,
  Code2,
  Download,
  HelpCircle,
  Bug
} from 'lucide-react';

export type RibbonTab = 
  | 'analyzer'
  | 'analyze_model'
  | 'requirements'
  | 'findings'
  | 'report'
  | 'history'
  | 'settings'
  | 'solution'
  | 'guide';

interface RibbonNavProps {
  activeTab: RibbonTab;
  onSelectTab: (tab: RibbonTab) => void;
  onRunAnalysis: () => void;
  isAnalyzing: boolean;
  onDownloadZip: () => void;
}

export const RibbonNav: React.FC<RibbonNavProps> = ({
  activeTab,
  onSelectTab,
  onRunAnalysis,
  isAnalyzing,
  onDownloadZip
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white select-none">
      {/* Top Ribbon Banner - Developer Eng. Sherif Ahmad Magaldin */}
      <div className="bg-slate-950 border-b border-slate-800 px-6 py-2 flex items-center justify-between text-xs shadow-inner">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wider">
            Lead Developer
          </span>
          <span className="text-slate-300 font-semibold tracking-wide text-xs sm:text-sm">
            Developer Eng. Sherif Ahmad Magaldin
          </span>
        </div>
        <div className="text-[11px] text-slate-400 font-mono hidden sm:flex items-center gap-3">
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Revit 2027 (.NET 10 &amp; .NET 8 Multi-Targeted Fixed)
          </span>
          <span>•</span>
          <span className="text-blue-400 font-medium">Nice3point Toolkit</span>
          <span>•</span>
          <span>EASA Part-145 &amp; Part-IS</span>
        </div>
      </div>

      {/* Top Application Bar */}
      <div className="flex items-center justify-between px-6 py-2.5 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-blue-600 rounded flex items-center justify-center font-bold text-sm tracking-wider text-white shadow-sm">
            E
          </div>
          <div>
            <div className="text-sm font-semibold tracking-wide text-slate-100 flex items-center gap-2">
              <span>EASA BIM Facility Compliance Analyzer</span>
              <span className="text-[11px] font-mono text-emerald-400 font-normal bg-emerald-950/60 border border-emerald-700/50 px-1.5 py-0.2 rounded">
                Revit 2027 API Ready
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              Part-145 (Regulation EU 1321/2014) &amp; Part-IS (Regulation EU 2023/203) Readiness Assessment
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              onSelectTab('solution');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-mono font-medium rounded border border-emerald-600/40 transition-colors shadow-sm cursor-pointer whitespace-nowrap"
            title="Inspect the CS1705 Compiler Fix for Revit 2027"
          >
            <Code2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>CS1705 Fix Details</span>
          </button>
          <button
            onClick={onDownloadZip}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded transition-colors shadow-sm cursor-pointer whitespace-nowrap"
            title="Download the updated C# / .NET 10 & 8 / Revit 2027 Solution (.ZIP)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download C# Solution (.zip)</span>
          </button>
        </div>
      </div>

      {/* Revit Ribbon Tabs Header */}
      <div className="flex items-center px-6 bg-slate-950/60 border-b border-slate-800/60 text-xs">
        <div className="px-4 py-2 border-b-2 border-blue-500 font-semibold text-slate-100 uppercase tracking-wider">
          EASA Compliance
        </div>
        <div className="px-4 py-2 text-slate-500 hover:text-slate-400 cursor-not-allowed">
          Architecture
        </div>
        <div className="px-4 py-2 text-slate-500 hover:text-slate-400 cursor-not-allowed">
          Structure
        </div>
        <div className="px-4 py-2 text-slate-500 hover:text-slate-400 cursor-not-allowed">
          Manage
        </div>
      </div>

      {/* Revit Ribbon Command Shelf */}
      <div className="flex items-stretch px-6 py-2 gap-2 overflow-x-auto bg-slate-900">
        {/* Panel 1: Main Assessment Operations */}
        <div className="flex items-center gap-1 pr-3 border-r border-slate-800 shrink-0">
          <button
            onClick={() => onSelectTab('analyzer')}
            className={`flex flex-col items-center justify-center px-3 py-1.5 rounded min-w-[76px] transition-colors ${
              activeTab === 'analyzer'
                ? 'bg-blue-600/30 text-blue-200 border border-blue-500/40'
                : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <Building2 className="w-5 h-5 mb-1 text-blue-400" />
            <span className="text-[11px] font-medium leading-tight text-center">Facility<br />Analyzer</span>
          </button>
          <button
            onClick={() => {
              onRunAnalysis();
              onSelectTab('analyze_model');
            }}
            disabled={isAnalyzing}
            className={`flex flex-col items-center justify-center px-3 py-1.5 rounded min-w-[76px] transition-colors ${
              activeTab === 'analyze_model'
                ? 'bg-blue-600/30 text-blue-200 border border-blue-500/40'
                : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <Play className={`w-5 h-5 mb-1 ${isAnalyzing ? 'animate-spin text-amber-400' : 'text-emerald-400'}`} />
            <span className="text-[11px] font-medium leading-tight text-center">
              {isAnalyzing ? 'Auditing...' : 'Analyze\nModel'}
            </span>
          </button>
        </div>

        {/* Panel 2: Regulatory Library & Explorer */}
        <div className="flex items-center gap-1 px-3 border-r border-slate-800 shrink-0">
          <button
            onClick={() => onSelectTab('requirements')}
            className={`flex flex-col items-center justify-center px-3 py-1.5 rounded min-w-[80px] transition-colors ${
              activeTab === 'requirements'
                ? 'bg-blue-600/30 text-blue-200 border border-blue-500/40'
                : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <BookOpen className="w-5 h-5 mb-1 text-indigo-400" />
            <span className="text-[11px] font-medium leading-tight text-center">Regulatory<br />Requirements</span>
          </button>
          <button
            onClick={() => onSelectTab('findings')}
            className={`flex flex-col items-center justify-center px-3 py-1.5 rounded min-w-[80px] transition-colors ${
              activeTab === 'findings'
                ? 'bg-blue-600/30 text-blue-200 border border-blue-500/40'
                : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <AlertTriangle className="w-5 h-5 mb-1 text-amber-400" />
            <span className="text-[11px] font-medium leading-tight text-center">Findings<br />Explorer</span>
          </button>
        </div>

        {/* Panel 3: Outputs & Audit Reports */}
        <div className="flex items-center gap-1 px-3 border-r border-slate-800 shrink-0">
          <button
            onClick={() => onSelectTab('report')}
            className={`flex flex-col items-center justify-center px-3 py-1.5 rounded min-w-[76px] transition-colors ${
              activeTab === 'report'
                ? 'bg-blue-600/30 text-blue-200 border border-blue-500/40'
                : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <FileText className="w-5 h-5 mb-1 text-sky-400" />
            <span className="text-[11px] font-medium leading-tight text-center">Generate<br />Report</span>
          </button>
          <button
            onClick={() => onSelectTab('history')}
            className={`flex flex-col items-center justify-center px-3 py-1.5 rounded min-w-[76px] transition-colors ${
              activeTab === 'history'
                ? 'bg-blue-600/30 text-blue-200 border border-blue-500/40'
                : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <History className="w-5 h-5 mb-1 text-slate-400" />
            <span className="text-[11px] font-medium leading-tight text-center">Assessment<br />History</span>
          </button>
          <button
            onClick={() => onSelectTab('settings')}
            className={`flex flex-col items-center justify-center px-3 py-1.5 rounded min-w-[76px] transition-colors ${
              activeTab === 'settings'
                ? 'bg-blue-600/30 text-blue-200 border border-blue-500/40'
                : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <SettingsIcon className="w-5 h-5 mb-1 text-slate-400" />
            <span className="text-[11px] font-medium leading-tight text-center">Settings</span>
          </button>
        </div>

        {/* Panel 4: Revit 2027 Solution Browser & Architecture Guide */}
        <div className="flex items-center gap-1 pl-3 shrink-0">
          <button
            onClick={() => onSelectTab('solution')}
            className={`flex flex-col items-center justify-center px-3.5 py-1.5 rounded min-w-[90px] transition-colors cursor-pointer ${
              activeTab === 'solution'
                ? 'bg-blue-600/30 text-blue-200 border border-blue-500/40'
                : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <Code2 className="w-5 h-5 mb-1 text-teal-400" />
            <span className="text-[11px] font-medium leading-tight text-center">Revit 2027<br />C# Solution</span>
          </button>
          <button
            onClick={() => onSelectTab('guide')}
            className={`flex flex-col items-center justify-center px-3.5 py-1.5 rounded min-w-[90px] transition-colors cursor-pointer ${
              activeTab === 'guide'
                ? 'bg-amber-500/30 text-amber-200 border border-amber-500/50'
                : 'hover:bg-slate-800 text-slate-300'
            }`}
            title="View relationship between C# Revit Add-in and React Web Workbench & step-by-step user guide"
          >
            <HelpCircle className="w-5 h-5 mb-1 text-amber-400" />
            <span className="text-[11px] font-medium leading-tight text-center font-bold text-amber-300">C# ⇄ React<br />User Guide</span>
          </button>
        </div>
      </div>
    </header>
  );
};
