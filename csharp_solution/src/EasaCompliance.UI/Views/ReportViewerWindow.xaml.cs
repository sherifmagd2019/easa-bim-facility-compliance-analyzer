using System;
using System.IO;
using System.Linq;
using System.Windows;
using EasaCompliance.Core.Enums;
using EasaCompliance.Reporting.Services;
using Microsoft.Win32;

namespace EasaCompliance.UI.Views
{
    public partial class ReportViewerWindow : Window
    {
        private readonly string _textContent;
        private readonly string _csvContent;
        private readonly ReportModel _reportModel;

        public ReportViewerWindow(string textContent, string csvContent, ReportModel reportModel)
        {
            InitializeComponent();
            _textContent = textContent;
            _csvContent = csvContent;
            _reportModel = reportModel;

            TxtReportContent.Text = _textContent;

            var total = _reportModel.Findings.Count;
            var gaps = _reportModel.Findings.Count(f => f.Status == ComplianceStatus.GapFound);
            var review = _reportModel.Findings.Count(f => f.Status == ComplianceStatus.NeedsHumanReview);
            var meets = _reportModel.Findings.Count(f => f.Status == ComplianceStatus.MeetsModeledCheck);

            TxtTotalFindings.Text = $"Findings: {total}";
            TxtGapsCount.Text = $"Gaps: {gaps}";
            TxtReviewCount.Text = $"Review Req: {review}";
            TxtMeetsCount.Text = $"Meets Modeled: {meets}";

            TxtSubtitle.Text = $"Facility: {_reportModel.Project.FacilityName} | Model: {_reportModel.Project.ModelFileName} | {_reportModel.RuleLibraryVersion}";
            TxtStatusMessage.Text = $"Generated {DateTime.Now:yyyy-MM-dd HH:mm:ss} UTC — Ready to export.";
        }

        private void BtnCopyClipboard_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                Clipboard.SetText(_textContent);
                TxtStatusMessage.Text = "Report copied to system clipboard successfully!";
                TxtStatusMessage.Foreground = System.Windows.Media.Brushes.LightGreen;
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Clipboard copy failed: {ex.Message}", "Error", MessageBoxButton.OK, MessageBoxImage.Warning);
            }
        }

        private void BtnSaveDesktop_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                var desktop = Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory);
                if (string.IsNullOrWhiteSpace(desktop) || !Directory.Exists(desktop))
                {
                    desktop = Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments);
                }

                var timestamp = DateTime.Now.ToString("yyyyMMdd_HHmmss");
                var cleanDoc = CleanFileName(_reportModel.Project.ModelFileName);
                if (string.IsNullOrWhiteSpace(cleanDoc)) cleanDoc = "Facility";

                var txtFile = Path.Combine(desktop, $"EASA_Part145_Report_{cleanDoc}_{timestamp}.txt");
                var csvFile = Path.Combine(desktop, $"EASA_Part145_Findings_{cleanDoc}_{timestamp}.csv");
                var regsFile = Path.Combine(desktop, $"EASA_Part145_Regulations_{cleanDoc}_{timestamp}.csv");

                File.WriteAllText(txtFile, _textContent);
                File.WriteAllText(csvFile, _csvContent);

                if (_reportModel.Regulations.Any())
                {
                    var regsCsv = ExcelFindingsExporter.GenerateRegulationsCsvRegister(_reportModel.Regulations);
                    File.WriteAllText(regsFile, regsCsv);
                }

                TxtStatusMessage.Text = $"Saved to Desktop: {Path.GetFileName(txtFile)}, {Path.GetFileName(csvFile)}, and {Path.GetFileName(regsFile)}";
                TxtStatusMessage.Foreground = System.Windows.Media.Brushes.LightGreen;

                MessageBox.Show(
                    $"Report, Findings Register, and Regulations Matrix saved to Desktop:\n\n1. {txtFile}\n2. {csvFile}\n3. {regsFile}\n\nTotal findings: {_reportModel.Findings.Count} | Total regulations: {_reportModel.Regulations.Count}",
                    "Export Successful",
                    MessageBoxButton.OK,
                    MessageBoxImage.Information);
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Could not save to Desktop: {ex.Message}", "Export Error", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        private void BtnSaveText_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                var timestamp = DateTime.Now.ToString("yyyyMMdd_HHmm");
                var cleanDoc = CleanFileName(_reportModel.Project.ModelFileName);
                var sfd = new SaveFileDialog
                {
                    Title = "Save EASA Compliance Audit Report",
                    FileName = $"EASA_Part145_Report_{cleanDoc}_{timestamp}.txt",
                    Filter = "Text Report (*.txt)|*.txt|All Files (*.*)|*.*",
                    DefaultExt = ".txt"
                };

                if (sfd.ShowDialog(this) == true)
                {
                    File.WriteAllText(sfd.FileName, _textContent);
                    TxtStatusMessage.Text = $"Saved report to: {Path.GetFileName(sfd.FileName)}";
                    TxtStatusMessage.Foreground = System.Windows.Media.Brushes.LightGreen;
                    MessageBox.Show($"Report successfully saved to:\n{sfd.FileName}", "Report Saved", MessageBoxButton.OK, MessageBoxImage.Information);
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Error saving file: {ex.Message}", "Save Error", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        private void BtnSaveCsv_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                var timestamp = DateTime.Now.ToString("yyyyMMdd_HHmm");
                var cleanDoc = CleanFileName(_reportModel.Project.ModelFileName);
                var sfd = new SaveFileDialog
                {
                    Title = "Export EASA Findings Register CSV",
                    FileName = $"EASA_Part145_Findings_{cleanDoc}_{timestamp}.csv",
                    Filter = "CSV Register (*.csv)|*.csv|All Files (*.*)|*.*",
                    DefaultExt = ".csv"
                };

                if (sfd.ShowDialog(this) == true)
                {
                    File.WriteAllText(sfd.FileName, _csvContent);
                    TxtStatusMessage.Text = $"Exported CSV to: {Path.GetFileName(sfd.FileName)}";
                    TxtStatusMessage.Foreground = System.Windows.Media.Brushes.LightGreen;
                    MessageBox.Show($"Findings register exported successfully to:\n{sfd.FileName}", "CSV Exported", MessageBoxButton.OK, MessageBoxImage.Information);
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Error exporting CSV: {ex.Message}", "Export Error", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        private void BtnSaveRegsCsv_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                var timestamp = DateTime.Now.ToString("yyyyMMdd_HHmm");
                var cleanDoc = CleanFileName(_reportModel.Project.ModelFileName);
                var sfd = new SaveFileDialog
                {
                    Title = "Export EASA Regulations Status Checklist CSV",
                    FileName = $"EASA_Part145_Regulations_{cleanDoc}_{timestamp}.csv",
                    Filter = "CSV Register (*.csv)|*.csv|All Files (*.*)|*.*",
                    DefaultExt = ".csv"
                };

                if (sfd.ShowDialog(this) == true)
                {
                    var regsCsv = ExcelFindingsExporter.GenerateRegulationsCsvRegister(_reportModel.Regulations);
                    File.WriteAllText(sfd.FileName, regsCsv);
                    TxtStatusMessage.Text = $"Exported Regulations CSV to: {Path.GetFileName(sfd.FileName)}";
                    TxtStatusMessage.Foreground = System.Windows.Media.Brushes.LightGreen;
                    MessageBox.Show($"Regulations matrix exported successfully to:\n{sfd.FileName}", "CSV Exported", MessageBoxButton.OK, MessageBoxImage.Information);
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Error exporting regulations CSV: {ex.Message}", "Export Error", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        private void BtnClose_Click(object sender, RoutedEventArgs e)
        {
            Close();
        }

        private static string CleanFileName(string name)
        {
            if (string.IsNullOrWhiteSpace(name)) return "Audit";
            var invalidChars = Path.GetInvalidFileNameChars();
            var clean = new string(name.Where(c => !invalidChars.Contains(c) && c != ' ').ToArray());
            return clean.Replace(".rvt", "");
        }
    }
}
