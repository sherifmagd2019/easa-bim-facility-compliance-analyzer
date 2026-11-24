using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;
using EasaCompliance.Core.Enums;
using EasaCompliance.Core.Models;
using EasaCompliance.Regulations.Models;
using EasaCompliance.Reporting.Services;
using EasaCompliance.UI.ViewModels;
using Microsoft.Win32;

namespace EasaCompliance.UI.Views
{
    public partial class RegulationsStatusWindow : Window
    {
        private readonly MainViewModel _mainViewModel;
        private List<RequirementRecord> _allRegulations = new();
        private List<RequirementRecord> _filteredRegulations = new();
        private RequirementRecord? _selectedRecord;
        private bool _isInitialized = false;

        public RegulationsStatusWindow(MainViewModel mainViewModel)
        {
            InitializeComponent();
            _mainViewModel = mainViewModel;
            _isInitialized = true;
            LoadData();
        }

        private void LoadData()
        {
            if (!_isInitialized) return;
            _allRegulations = _mainViewModel.Requirements.ToList();
            if (CmbStatusFilter != null && CmbStatusFilter.SelectedIndex < 0)
            {
                CmbStatusFilter.SelectedIndex = 0;
            }
            UpdateMetrics();
            ApplyFilters();
        }

        private void UpdateMetrics()
        {
            if (!_isInitialized || TxtTotalRegs == null) return;

            var total = _allRegulations.Count;
            var compliant = _allRegulations.Count(r => r.EvaluatedComplianceStatus == ComplianceStatus.MeetsModeledCheck);
            var gaps = _allRegulations.Count(r => r.EvaluatedComplianceStatus == ComplianceStatus.GapFound);
            var review = _allRegulations.Count(r => r.EvaluatedComplianceStatus == ComplianceStatus.NeedsHumanReview);
            var doc = _allRegulations.Count(r => r.EvaluatedComplianceStatus == ComplianceStatus.NotAssessed);

            if (TxtTotalRegs != null) TxtTotalRegs.Text = $"Clauses: {total}";
            if (TxtCompliantCount != null) TxtCompliantCount.Text = $"Meets Modeled: {compliant}";
            if (TxtGapsCount != null) TxtGapsCount.Text = $"Gaps Found: {gaps}";
            if (TxtReviewCount != null) TxtReviewCount.Text = $"Needs Review: {review}";
            if (TxtDocCount != null) TxtDocCount.Text = $"Documentary Req'd: {doc}";
        }

        private void ApplyFilters()
        {
            if (!_isInitialized || DgRegulations == null) return;

            var search = TxtSearchBox?.Text?.Trim() ?? string.Empty;
            var selectedItem = (CmbStatusFilter?.SelectedItem as ComboBoxItem)?.Content?.ToString() ?? "ALL";

            _filteredRegulations = _allRegulations.Where(r =>
            {
                var matchesSearch = string.IsNullOrWhiteSpace(search) ||
                    r.SectionReference.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                    r.Summary.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                    r.RegulationName.Contains(search, StringComparison.OrdinalIgnoreCase);

                var matchesStatus = true;
                if (selectedItem.StartsWith("MeetsModeledCheck"))
                    matchesStatus = r.EvaluatedComplianceStatus == ComplianceStatus.MeetsModeledCheck;
                else if (selectedItem.StartsWith("GapFound"))
                    matchesStatus = r.EvaluatedComplianceStatus == ComplianceStatus.GapFound;
                else if (selectedItem.StartsWith("NeedsHumanReview"))
                    matchesStatus = r.EvaluatedComplianceStatus == ComplianceStatus.NeedsHumanReview;
                else if (selectedItem.StartsWith("NotAssessed"))
                    matchesStatus = r.EvaluatedComplianceStatus == ComplianceStatus.NotAssessed;

                return matchesSearch && matchesStatus;
            }).ToList();

            DgRegulations.ItemsSource = _filteredRegulations;

            if (_filteredRegulations.Any())
            {
                DgRegulations.SelectedItem = _filteredRegulations.First();
            }
        }

        private void DgRegulations_SelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            if (!_isInitialized || DgRegulations == null) return;

            _selectedRecord = DgRegulations.SelectedItem as RequirementRecord;
            if (_selectedRecord == null || TxtDetailClause == null) return;

            TxtDetailClause.Text = _selectedRecord.SectionReference;
            TxtDetailRegulation.Text = $"{_selectedRecord.RegulationName} ({_selectedRecord.Hierarchy})";
            TxtDetailStatus.Text = _selectedRecord.EvaluatedComplianceStatus.ToString();

            // Set badge color
            switch (_selectedRecord.EvaluatedComplianceStatus)
            {
                case ComplianceStatus.MeetsModeledCheck:
                    if (BadgeDetailStatus != null) BadgeDetailStatus.Background = new SolidColorBrush(Color.FromRgb(6, 78, 59));
                    TxtDetailStatus.Foreground = new SolidColorBrush(Color.FromRgb(110, 231, 183));
                    break;
                case ComplianceStatus.GapFound:
                    if (BadgeDetailStatus != null) BadgeDetailStatus.Background = new SolidColorBrush(Color.FromRgb(127, 29, 29));
                    TxtDetailStatus.Foreground = new SolidColorBrush(Color.FromRgb(252, 165, 165));
                    break;
                case ComplianceStatus.NeedsHumanReview:
                    if (BadgeDetailStatus != null) BadgeDetailStatus.Background = new SolidColorBrush(Color.FromRgb(120, 53, 15));
                    TxtDetailStatus.Foreground = new SolidColorBrush(Color.FromRgb(253, 230, 138));
                    break;
                default:
                    if (BadgeDetailStatus != null) BadgeDetailStatus.Background = new SolidColorBrush(Color.FromRgb(51, 65, 85));
                    TxtDetailStatus.Foreground = new SolidColorBrush(Color.FromRgb(203, 213, 225));
                    break;
            }

            if (TxtDetailNotes != null) TxtDetailNotes.Text = _selectedRecord.ComplianceNotes;
            if (TxtDetailSummary != null) TxtDetailSummary.Text = _selectedRecord.Summary;
            if (TxtDetailExtract != null)
            {
                TxtDetailExtract.Text = string.IsNullOrWhiteSpace(_selectedRecord.OriginalTextExtract)
                    ? "Full legal extract available in EASA Easy Access Rules."
                    : _selectedRecord.OriginalTextExtract;
            }
            if (TxtDetailEvidence != null) TxtDetailEvidence.Text = _selectedRecord.RequiredEvidence;
            if (TxtDetailUrl != null) TxtDetailUrl.Text = _selectedRecord.OfficialSourceUrl;
            if (TxtReviewerNotes != null) TxtReviewerNotes.Text = _selectedRecord.ReviewerDecisionNotes;

            // Find associated model findings
            var relatedFindings = _mainViewModel.AllFindings.Where(f =>
                (!string.IsNullOrWhiteSpace(f.RequirementId) && f.RequirementId.Equals(_selectedRecord.RequirementId, StringComparison.OrdinalIgnoreCase)) ||
                (!string.IsNullOrWhiteSpace(f.RegulatoryReference) && (
                    f.RegulatoryReference.Equals(_selectedRecord.SectionReference, StringComparison.OrdinalIgnoreCase) ||
                    f.RegulatoryReference.Contains(_selectedRecord.SectionReference, StringComparison.OrdinalIgnoreCase) ||
                    _selectedRecord.SectionReference.Contains(f.RegulatoryReference, StringComparison.OrdinalIgnoreCase)
                ))
            ).ToList();

            if (TxtDetailFindings != null)
            {
                if (relatedFindings.Any())
                {
                    var fText = string.Join("\n\n", relatedFindings.Select(f =>
                        $"• [{f.FindingId}] Status: {f.Status} | Severity: {f.Severity}\n" +
                        $"  Element: {f.AffectedRoomOrZone} (ID: {f.RevitElementId?.ToString() ?? "N/A"})\n" +
                        $"  Measured: {f.MeasuredValue} | Required: {f.RequiredValue}\n" +
                        $"  Description: {f.Description}"));
                    TxtDetailFindings.Text = fText;
                }
                else
                {
                    TxtDetailFindings.Text = "No modeled element findings directly linked to this clause in current pass.";
                }
            }
        }

        private void TxtSearchBox_TextChanged(object sender, TextChangedEventArgs e)
        {
            if (!_isInitialized) return;
            ApplyFilters();
        }

        private void CmbStatusFilter_SelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            if (!_isInitialized) return;
            ApplyFilters();
        }

        private void BtnReevaluate_Click(object sender, RoutedEventArgs e)
        {
            _mainViewModel.RunAssessment();
            LoadData();
            MessageBox.Show("Regulations matrix successfully re-evaluated against latest model findings!", "Matrix Re-Evaluated", MessageBoxButton.OK, MessageBoxImage.Information);
        }

        private void BtnSaveNotes_Click(object sender, RoutedEventArgs e)
        {
            if (_selectedRecord != null)
            {
                _selectedRecord.ReviewerDecisionNotes = TxtReviewerNotes.Text;
                MessageBox.Show($"Reviewer notes recorded for clause {_selectedRecord.SectionReference}.", "Notes Saved", MessageBoxButton.OK, MessageBoxImage.Information);
            }
        }

        private void BtnExportCsv_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                var sfd = new SaveFileDialog
                {
                    Title = "Export EASA Regulations Status Checklist",
                    FileName = $"EASA_Part145_Regulations_Status_{DateTime.Now:yyyyMMdd_HHmm}.csv",
                    Filter = "CSV File (*.csv)|*.csv|All Files (*.*)|*.*",
                    DefaultExt = ".csv"
                };

                if (sfd.ShowDialog(this) == true)
                {
                    var csvContent = ExcelFindingsExporter.GenerateRegulationsCsvRegister(_allRegulations);
                    File.WriteAllText(sfd.FileName, csvContent);
                    MessageBox.Show($"Regulations matrix successfully exported to:\n{sfd.FileName}", "Export Successful", MessageBoxButton.OK, MessageBoxImage.Information);
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Error exporting regulations: {ex.Message}", "Export Error", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        private void BtnClose_Click(object sender, RoutedEventArgs e)
        {
            Close();
        }
    }
}
