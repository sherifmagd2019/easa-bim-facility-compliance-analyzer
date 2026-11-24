using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.IO;
using System.Linq;
using System.Windows;
using System.Windows.Input;
using EasaCompliance.Core.Enums;
using EasaCompliance.Core.Interfaces;
using EasaCompliance.Core.Models;
using EasaCompliance.Regulations.Models;
using EasaCompliance.Reporting.Services;
using EasaCompliance.Rules.Engine;
using EasaCompliance.UI.Views;

namespace EasaCompliance.UI.ViewModels
{
    public class MainViewModel : ViewModelBase
    {
        private readonly IRevitNavigator? _revitNavigator;
        private AssessmentProject _project;
        private ModelCompletenessReport _completenessReport;
        private Finding? _selectedFinding;
        private string _statusFilter = "ALL";
        private string _severityFilter = "ALL";
        private string _searchText = string.Empty;
        private string _modelStatusBadge = string.Empty;

        public AssessmentProject Project
        {
            get => _project;
            set { _project = value; OnPropertyChanged(); }
        }

        public ModelCompletenessReport CompletenessReport
        {
            get => _completenessReport;
            set { _completenessReport = value; OnPropertyChanged(); }
        }

        public string ModelStatusBadge
        {
            get => _modelStatusBadge;
            set { _modelStatusBadge = value; OnPropertyChanged(); }
        }

        public ObservableCollection<Finding> AllFindings { get; } = new();
        public ObservableCollection<Finding> FilteredFindings { get; } = new();
        public ObservableCollection<RequirementRecord> Requirements { get; } = new();

        public Finding? SelectedFinding
        {
            get => _selectedFinding;
            set
            {
                _selectedFinding = value;
                OnPropertyChanged();
                OnPropertyChanged(nameof(HasSelectedFinding));
            }
        }

        public bool HasSelectedFinding => SelectedFinding != null;

        public string StatusFilter
        {
            get => _statusFilter;
            set { _statusFilter = value; OnPropertyChanged(); ApplyFilters(); }
        }

        public string SeverityFilter
        {
            get => _severityFilter;
            set { _severityFilter = value; OnPropertyChanged(); ApplyFilters(); }
        }

        public string SearchText
        {
            get => _searchText;
            set { _searchText = value; OnPropertyChanged(); ApplyFilters(); }
        }

        public RuleEngine RuleEngineInstance { get; } = new();

        public ICommand RunFullAssessmentCommand { get; }
        public ICommand ZoomToElementCommand { get; }
        public ICommand IsolateElementCommand { get; }
        public ICommand ExportReportCommand { get; }
        public ICommand OpenRegulationsCommand { get; }
        public ICommand OpenRuleEditorCommand { get; }

        public MainViewModel(IRevitNavigator? revitNavigator = null)
        {
            _revitNavigator = revitNavigator;
            var docTitle = _revitNavigator?.ActiveDocumentTitle;
            var isLive = _revitNavigator?.HasActiveDocument == true;

            _project = new AssessmentProject
            {
                ProjectName = isLive ? (docTitle ?? "Active Revit Document") : "Frankfurt Cargo ULD Overhaul Facility",
                ProjectNumber = isLive ? "REVIT-2027-LIVE" : "EASA-2027-ULD-004",
                FacilityName = isLive ? (docTitle ?? "Active Revit Facility") : "AeroCargo ULD Inspection & Maintenance Center",
                FacilityAddress = isLive ? "Extracted from active BIM Project Information" : "Cargo City South, Bldg 542, 60549 Frankfurt am Main",
                CountryOfOperation = isLive ? "Third Country (Non-EU)" : "Germany",
                PrincipalPlaceOfBusiness = isLive ? "Operating Station" : "Frankfurt am Main, Germany",
                FacilityManager = isLive ? "Airworthiness Quality Lead" : "Hans Meier, Head of Quality",
                OrganizationDetails = isLive ? $"Auditing live Revit model: {docTitle}" : "Independent Maintenance Organization preparing for EASA Part-145 C20 Approval",
                IntendedApprovalScope = "Part-145 Rating C20 (Structural Components - ULD)",
                ModelFileName = docTitle ?? "FRA-ULD-MNT-2027-R03.rvt"
            };

            _modelStatusBadge = isLive 
                ? $"● LIVE REVIT MODEL: {docTitle} (Auto-Audited)" 
                : "STANDALONE MODE (Sample Facility Data)";

            _completenessReport = new ModelCompletenessReport();

            RunFullAssessmentCommand = new RelayCommand(RunAssessment);
            ZoomToElementCommand = new RelayCommand(ZoomToSelectedElement, _ => SelectedFinding?.RevitElementId.HasValue == true);
            IsolateElementCommand = new RelayCommand(IsolateSelectedElement, _ => SelectedFinding?.RevitElementId.HasValue == true);
            ExportReportCommand = new RelayCommand(ExportReport);
            OpenRegulationsCommand = new RelayCommand(OpenRegulations);
            OpenRuleEditorCommand = new RelayCommand(OpenRuleEditor);

            LoadInitialData();

            // Run assessment immediately on the active model upon launching
            RunAssessment();
        }

        private void LoadInitialData()
        {
            Requirements.Clear();
            foreach (var reg in DefaultRegulationsCatalog.GetDefaultRegulations())
            {
                Requirements.Add(reg);
            }
        }

        public void RunAssessment()
        {
            List<BimElementData> rooms;
            List<BimElementData> doors;
            List<BimElementData> equipment;

            if (_revitNavigator != null && _revitNavigator.HasActiveDocument)
            {
                // LIVE EXTRACTION FROM THE ACTIVE REVIT DOCUMENT
                var extraction = _revitNavigator.ExtractActiveModelData();
                rooms = extraction.Rooms;
                doors = extraction.Doors;
                equipment = extraction.Equipment;

                Project.ProjectName = !string.IsNullOrWhiteSpace(extraction.ProjectName) ? extraction.ProjectName : extraction.DocumentTitle;
                Project.FacilityName = extraction.DocumentTitle;
                Project.ModelFileName = extraction.DocumentTitle;
                Project.ModelFingerprint = extraction.DocumentFingerprint;
                OnPropertyChanged(nameof(Project));

                ModelStatusBadge = $"● LIVE MODEL AUDITED: {extraction.DocumentTitle} ({rooms.Count} Rooms, {doors.Count} Doors, {equipment.Count} Equipment)";

                var unassignedRooms = rooms.Where(r => string.IsNullOrWhiteSpace(r.RoomName) || r.RoomName.StartsWith("Room", StringComparison.OrdinalIgnoreCase)).Select(r => $"Room #{r.RoomNumber}: '{r.RoomName}'").ToList();
                var missingParamEq = equipment.Where(e => e.IsMissingRequiredParameters).Select(e => $"Equipment '{e.Name}' (ID {e.ElementId}): Missing AssetID").ToList();
                var totalElements = rooms.Count + doors.Count + equipment.Count;
                var rawScore = totalElements > 0 ? Math.Max(10.0, 100.0 - (unassignedRooms.Count * 3 + missingParamEq.Count * 2)) : 0.0;

                CompletenessReport = new ModelCompletenessReport
                {
                    ElementsInspected = totalElements,
                    RoomsInspected = rooms.Count,
                    DoorsInspected = doors.Count,
                    EquipmentInspected = equipment.Count,
                    MissingRequiredParameterCount = missingParamEq.Count,
                    UnidentifiedRooms = unassignedRooms,
                    UnidentifiedEquipment = missingParamEq,
                    OverallCompletenessScore = Math.Round(rawScore, 1),
                    ModelLimitations = new List<string>
                    {
                        $"Live Revit Model: {extraction.DocumentTitle}",
                        $"Extracted {rooms.Count} Rooms, {doors.Count} Doors, and {equipment.Count} Equipment assets directly from active Revit document.",
                        "Door clear opening widths calculated from Revit geometric instance/type parameters.",
                        "Storage containment and physical security procedures must be substantiated via MOE documentary review."
                    }
                };
            }
            else
            {
                // Standalone fallback when running outside Revit
                rooms = new List<BimElementData>
                {
                    new() { ElementId = 10101, UniqueId = "u-rm-101", RoomName = "ULD Repair Workshop", RoomNumber = "101", AreaSqM = 320.0 },
                    new() { ElementId = 10102, UniqueId = "u-rm-102", RoomName = "ULD Inspection & Inbound Bay", RoomNumber = "102", AreaSqM = 180.0 },
                    new() { ElementId = 10103, UniqueId = "u-rm-103", RoomName = "Quarantine Holding Area", RoomNumber = "103", AreaSqM = 24.5 },
                    new() { ElementId = 10104, UniqueId = "u-rm-104", RoomName = "Bonded Parts Store", RoomNumber = "104", AreaSqM = 45.0 },
                    new() { ElementId = 10105, UniqueId = "u-rm-105", RoomName = "Battery Service & Charging", RoomNumber = "105", AreaSqM = 22.0 },
                    new() { ElementId = 10106, UniqueId = "u-rm-106", RoomName = "NDT Testing Booth", RoomNumber = "106", AreaSqM = 18.0 }
                };

                doors = new List<BimElementData>
                {
                    new() { ElementId = 20201, UniqueId = "u-dr-201", Name = "Bay Door North (Rollup)", FamilyName = "Overhead Rollup Door", ClearWidthMm = 2800, RoomName = "ULD Inspection & Inbound Bay" },
                    new() { ElementId = 20202, UniqueId = "u-dr-202", Name = "Bay Door South (Substandard)", FamilyName = "Overhead Rollup Door", ClearWidthMm = 2200, RoomName = "ULD Repair Workshop" },
                    new() { ElementId = 20203, UniqueId = "u-dr-203", Name = "Bonded Store Door", FamilyName = "Single Flush Door", ClearWidthMm = 900, RoomName = "Bonded Parts Store" }
                };

                equipment = new List<BimElementData>
                {
                    new() { ElementId = 30301, UniqueId = "u-eq-301", Name = "Hydraulic Squeezer Riveter #1", FamilyName = "Riveter", TypeName = "Aero Riveter Model C", RoomName = "ULD Repair Workshop", Parameters = new() { { "AssetID", "EQ-RIV-01" }, { "CalibrationDue", "2027-04-15" } } },
                    new() { ElementId = 30302, UniqueId = "u-eq-302", Name = "Pneumatic Riveter #2", FamilyName = "Riveter", TypeName = "Hand Riveter Model B", RoomName = "ULD Repair Workshop", Parameters = new() }
                };

                CompletenessReport = new ModelCompletenessReport
                {
                    ElementsInspected = 48,
                    RoomsInspected = 6,
                    DoorsInspected = 3,
                    EquipmentInspected = 2,
                    OverallCompletenessScore = 91.5
                };
            }

            var results = RuleEngineInstance.EvaluateModel(_project, rooms, doors, equipment, Requirements.ToList());

            AllFindings.Clear();
            foreach (var f in results)
            {
                AllFindings.Add(f);
            }

            // Cross-reference model findings against EASA regulations catalog
            RegulationComplianceEvaluator.EvaluateRegulationsCompliance(Requirements, AllFindings);

            ApplyFilters();
        }

        private void ApplyFilters()
        {
            FilteredFindings.Clear();
            foreach (var f in AllFindings)
            {
                var matchesStatus = _statusFilter == "ALL" || f.Status.ToString() == _statusFilter;
                var matchesSeverity = _severityFilter == "ALL" || f.Severity.ToString() == _severityFilter;
                var matchesSearch = string.IsNullOrWhiteSpace(_searchText) ||
                                    f.Description.Contains(_searchText, StringComparison.OrdinalIgnoreCase) ||
                                    f.RegulatoryReference.Contains(_searchText, StringComparison.OrdinalIgnoreCase) ||
                                    f.AffectedRoomOrZone.Contains(_searchText, StringComparison.OrdinalIgnoreCase);

                if (matchesStatus && matchesSeverity && matchesSearch)
                {
                    FilteredFindings.Add(f);
                }
            }

            if (FilteredFindings.Any() && SelectedFinding == null)
            {
                SelectedFinding = FilteredFindings.First();
            }
        }

        private void ZoomToSelectedElement(object? _)
        {
            if (_revitNavigator != null && SelectedFinding?.RevitElementId.HasValue == true)
            {
                _revitNavigator.HighlightAndZoomElement(SelectedFinding.RevitElementId.Value);
            }
        }

        private void IsolateSelectedElement(object? _)
        {
            if (_revitNavigator != null && SelectedFinding?.RevitElementId.HasValue == true)
            {
                _revitNavigator.IsolateElementTemporary(SelectedFinding.RevitElementId.Value);
            }
        }

        private void OpenRegulations(object? _)
        {
            try
            {
                var window = new RegulationsStatusWindow(this);
                window.ShowDialog();
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Could not open Regulations Matrix: {ex.Message}", "Error", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        private void OpenRuleEditor(object? _)
        {
            try
            {
                var window = new RuleEditorWindow(this);
                window.ShowDialog();
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Could not open Rule Editor: {ex.Message}", "Error", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        private void ExportReport(object? _)
        {
            try
            {
                var reportModel = new ReportModel
                {
                    Project = Project,
                    Completeness = CompletenessReport,
                    Findings = AllFindings.ToList(),
                    Regulations = Requirements.ToList(),
                    GeneratedAt = DateTime.UtcNow,
                    RuleLibraryVersion = "v2026.10-EASA-145-R3"
                };

                var textContent = PdfReportBuilder.GenerateTextReport(reportModel);
                var csvContent = ExcelFindingsExporter.GenerateCsvRegister(AllFindings.ToList());

                // Launch interactive ReportViewerWindow dialog
                var viewer = new ReportViewerWindow(textContent, csvContent, reportModel);
                viewer.ShowDialog();
            }
            catch (Exception ex)
            {
                // Fallback direct save if window display encounters any issue in Revit host
                try
                {
                    var desktop = Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory);
                    if (string.IsNullOrWhiteSpace(desktop) || !Directory.Exists(desktop))
                    {
                        desktop = Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments);
                    }

                    var timestamp = DateTime.Now.ToString("yyyyMMdd_HHmmss");
                    var txtFile = Path.Combine(desktop, $"EASA_Part145_Report_{timestamp}.txt");
                    var csvFile = Path.Combine(desktop, $"EASA_Part145_Findings_{timestamp}.csv");

                    var reportModel = new ReportModel
                    {
                        Project = Project,
                        Completeness = CompletenessReport,
                        Findings = AllFindings.ToList(),
                        Regulations = Requirements.ToList(),
                        GeneratedAt = DateTime.UtcNow
                    };

                    var textContent = PdfReportBuilder.GenerateTextReport(reportModel);
                    var csvContent = ExcelFindingsExporter.GenerateCsvRegister(AllFindings.ToList());

                    File.WriteAllText(txtFile, textContent);
                    File.WriteAllText(csvFile, csvContent);

                    MessageBox.Show(
                        $"Report successfully generated and saved to your desktop:\n\n1. {txtFile}\n2. {csvFile}\n\nTotal findings: {AllFindings.Count}\nTotal regulations: {Requirements.Count}",
                        "EASA Part-145 Report Generated",
                        MessageBoxButton.OK,
                        MessageBoxImage.Information);
                }
                catch (Exception fallbackEx)
                {
                    MessageBox.Show($"Unable to generate report: {ex.Message}\nFallback error: {fallbackEx.Message}", "Report Generation Error", MessageBoxButton.OK, MessageBoxImage.Error);
                }
            }
        }
    }

    public class FindingsViewModel : ViewModelBase
    {
        public ObservableCollection<Finding> Findings { get; } = new();
        public FindingsViewModel(IRevitNavigator? revitNavigator = null) { }
    }

    public class RequirementsViewModel : ViewModelBase
    {
        public ObservableCollection<RequirementRecord> Requirements { get; } = new();
    }
}
