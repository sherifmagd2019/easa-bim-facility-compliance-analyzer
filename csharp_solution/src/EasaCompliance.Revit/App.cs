using System;
using Autodesk.Revit.UI;
using Nice3point.Revit.Toolkit.External;
using EasaCompliance.Revit.Commands;

namespace EasaCompliance.Revit
{
    /// <summary>
    /// EASA BIM Facility Compliance Analyzer - Main Application Entry Point
    /// Built on Nice3point Revit Toolkit for Autodesk Revit 2027 (.NET 10 / .NET 8)
    /// Developer: Eng. Sherif Ahmad Magaldin
    /// </summary>
    public class App : ExternalApplication
    {
        public override void OnStartup()
        {
            CreateRibbon();
        }

        public override void OnShutdown()
        {
            // Clean up any external event handlers or active highlights
        }

        private void CreateRibbon()
        {
            const string tabName = "EASA Compliance";
            
            try
            {
                Application.CreateRibbonTab(tabName);
            }
            catch
            {
                // Tab may already exist if reloaded
            }

            var panel = Application.CreateRibbonPanel(tabName, "Assessment Operations");
            var libraryPanel = Application.CreateRibbonPanel(tabName, "Standards & Findings");
            var outputPanel = Application.CreateRibbonPanel(tabName, "Output & Configuration");

            // Panel 1: Assessment Operations
            panel.AddPushButton<FacilityAnalyzerCommand>("Facility\nAnalyzer")
                 .SetToolTip("Opens the primary EASA ULD Facility Compliance Assessment workspace.");
            panel.AddPushButton<AnalyzeModelCommand>("Analyze\nModel")
                 .SetToolTip("Extracts active BIM model entities and evaluates all configured EASA Part-145 and Part-IS rules.");

            // Panel 2: Standards & Findings
            libraryPanel.AddPushButton<RegulatoryRequirementsCommand>("Regulatory\nRequirements")
                        .SetToolTip("Browse and audit the versioned EASA Part-145, Part-IS, and AMC/GM requirement library.");
            libraryPanel.AddPushButton<FindingsExplorerCommand>("Findings\nExplorer")
                        .SetToolTip("Explore compliance findings, filter by severity, and zoom/isolate affected Revit elements in the active view.");

            // Panel 3: Output & Configuration
            outputPanel.AddPushButton<GenerateReportCommand>("Generate\nReport")
                       .SetToolTip("Compiles and exports comprehensive PDF audit report and Excel findings register.");
            outputPanel.AddPushButton<AssessmentHistoryCommand>("Assessment\nHistory")
                       .SetToolTip("Review historical assessment sessions, model revisions, and audit trails.");
            outputPanel.AddPushButton<SettingsCommand>("Settings")
                       .SetToolTip("Configure project parameters, regulatory scope, rule thresholds, and database paths.");
        }
    }

    /// <summary>
    /// Fluent Ribbon extensions for Revit API RibbonPanel and PushButton.
    /// Provides bulletproof compatibility across Nice3point Toolkit versions.
    /// </summary>
    public static class RibbonExtensions
    {
        public static PushButton AddPushButton<TCommand>(this RibbonPanel panel, string text)
            where TCommand : IExternalCommand
        {
            var commandType = typeof(TCommand);
            var assemblyLocation = commandType.Assembly.Location;
            var className = commandType.FullName ?? commandType.Name;
            var buttonName = $"{commandType.Name}Button";

            var pushButtonData = new PushButtonData(buttonName, text, assemblyLocation, className);
            return (PushButton)panel.AddItem(pushButtonData);
        }

        public static PushButton SetToolTip(this PushButton button, string toolTip)
        {
            button.ToolTip = toolTip;
            return button;
        }
    }
}
