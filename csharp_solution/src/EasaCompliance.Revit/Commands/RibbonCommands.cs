using System;
using System.Collections.Generic;
using System.Linq;
using Autodesk.Revit.Attributes;
using Autodesk.Revit.DB;
using Autodesk.Revit.UI;
using Nice3point.Revit.Toolkit.External;
using EasaCompliance.UI.Views;
using EasaCompliance.UI.ViewModels;
using EasaCompliance.Revit.Services;

namespace EasaCompliance.Revit.Commands
{
    /// <summary>
    /// Base class for all EASA compliance ribbon commands.
    /// Provides safe access to the active UIDocument across Revit API versions.
    /// </summary>
    public abstract class BaseRibbonCommand : ExternalCommand
    {
        protected UIDocument? ActiveUiDocument
        {
            get
            {
                try
                {
                    return UiDocument ?? ExternalCommandData?.Application?.ActiveUIDocument;
                }
                catch
                {
                    return null;
                }
            }
        }
    }

    [Transaction(TransactionMode.Manual)]
    public class FacilityAnalyzerCommand : BaseRibbonCommand
    {
        public override void Execute()
        {
            var uiDoc = ActiveUiDocument;
            var navigator = uiDoc != null ? new RevitBimNavigator(uiDoc) : null;
            var vm = new MainViewModel(navigator);
            var window = new MainWindow(vm);
            window.Show();
        }
    }

    [Transaction(TransactionMode.ReadOnly)]
    public class AnalyzeModelCommand : BaseRibbonCommand
    {
        public override void Execute()
        {
            var uiDoc = ActiveUiDocument;
            var navigator = uiDoc != null ? new RevitBimNavigator(uiDoc) : null;
            var vm = new MainViewModel(navigator);
            vm.RunFullAssessmentCommand.Execute(null);
            var window = new MainWindow(vm);
            window.Show();
        }
    }

    [Transaction(TransactionMode.ReadOnly)]
    public class RegulatoryRequirementsCommand : BaseRibbonCommand
    {
        public override void Execute()
        {
            var vm = new RequirementsViewModel();
            var window = new RequirementsLibraryView(vm);
            window.Show();
        }
    }

    [Transaction(TransactionMode.ReadOnly)]
    public class FindingsExplorerCommand : BaseRibbonCommand
    {
        public override void Execute()
        {
            var uiDoc = ActiveUiDocument;
            var navigator = uiDoc != null ? new RevitBimNavigator(uiDoc) : null;
            var vm = new FindingsViewModel(navigator);
            var window = new FindingsExplorerView(vm);
            window.Show();
        }
    }

    [Transaction(TransactionMode.ReadOnly)]
    public class GenerateReportCommand : BaseRibbonCommand
    {
        public override void Execute()
        {
            var uiDoc = ActiveUiDocument;
            var navigator = uiDoc != null ? new RevitBimNavigator(uiDoc) : null;
            var vm = new MainViewModel(navigator);
            vm.ExportReportCommand.Execute(null);
        }
    }

    [Transaction(TransactionMode.ReadOnly)]
    public class AssessmentHistoryCommand : BaseRibbonCommand
    {
        public override void Execute()
        {
            TaskDialog.Show("Assessment History", "Loading local SQLite assessment database session history...");
        }
    }

    [Transaction(TransactionMode.Manual)]
    public class SettingsCommand : BaseRibbonCommand
    {
        public override void Execute()
        {
            TaskDialog.Show("Settings", "EASA Compliance Engine Settings: Configured for Revit 2027 (.NET 10 / .NET 8 Windows).");
        }
    }
}
