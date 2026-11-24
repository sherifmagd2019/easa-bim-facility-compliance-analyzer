using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using System.Windows;
using System.Windows.Controls;
using EasaCompliance.Core.Enums;
using EasaCompliance.Regulations.Models;
using EasaCompliance.Rules.Engine;
using EasaCompliance.Rules.Models;
using EasaCompliance.UI.ViewModels;

namespace EasaCompliance.UI.Views
{
    public partial class RuleEditorWindow : Window
    {
        private readonly MainViewModel _mainViewModel;
        private readonly ObservableCollection<RuleDefinition> _rulesCollection = new();
        private RuleDefinition? _selectedRule;
        private bool _isCreatingNew = false;
        private bool _isInitialized = false;

        public RuleEditorWindow(MainViewModel mainViewModel)
        {
            InitializeComponent();
            _mainViewModel = mainViewModel;
            _isInitialized = true;
            LoadRules();
        }

        private void LoadRules()
        {
            if (!_isInitialized) return;
            _rulesCollection.Clear();
            foreach (var rule in _mainViewModel.RuleEngineInstance.Rules)
            {
                _rulesCollection.Add(rule);
            }

            if (DgRules != null) DgRules.ItemsSource = _rulesCollection;
            if (TxtRuleCountBadge != null) TxtRuleCountBadge.Text = $"{_rulesCollection.Count} Rules Active";

            if (_rulesCollection.Any() && DgRules != null)
            {
                DgRules.SelectedItem = _rulesCollection.First();
            }
        }

        private void DgRules_SelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            if (!_isInitialized || _isCreatingNew || DgRules == null) return;

            _selectedRule = DgRules.SelectedItem as RuleDefinition;
            if (_selectedRule == null || TxtRuleId == null) return;

            if (TxtEditorModeTitle != null) TxtEditorModeTitle.Text = $"EDITING RULE: {_selectedRule.RuleId}";
            if (TxtEditorStatus != null) TxtEditorStatus.Text = $"Version: {_selectedRule.Version}";

            TxtRuleId.Text = _selectedRule.RuleId;
            TxtRuleId.IsReadOnly = true;
            TxtRuleName.Text = _selectedRule.Name;
            TxtApplicableClause.Text = _selectedRule.ApplicableClause;
            TxtRegulatoryReference.Text = _selectedRule.RegulatoryReference;

            // Select Classification
            foreach (ComboBoxItem item in CmbClassification.Items)
            {
                if (item.Content.ToString() == _selectedRule.Classification.ToString())
                {
                    CmbClassification.SelectedItem = item;
                    break;
                }
            }

            // Select Evaluation Type
            foreach (ComboBoxItem item in CmbEvaluationType.Items)
            {
                if (item.Content.ToString() == _selectedRule.EvaluationType.ToString())
                {
                    CmbEvaluationType.SelectedItem = item;
                    break;
                }
            }

            // Select Severity
            foreach (ComboBoxItem item in CmbSeverity.Items)
            {
                if (item.Content.ToString() == _selectedRule.DefaultSeverity.ToString())
                {
                    CmbSeverity.SelectedItem = item;
                    break;
                }
            }

            ChkIsEnabled.IsChecked = _selectedRule.IsEnabled;
            ChkRequiresHumanReview.IsChecked = _selectedRule.RequiresHumanReview;

            // Display primary parameter
            if (_selectedRule.Parameters.Any())
            {
                var first = _selectedRule.Parameters.First();
                TxtParamKey.Text = first.Key;
                TxtParamValue.Text = first.Value?.ToString() ?? string.Empty;
            }
            else
            {
                TxtParamKey.Text = "None";
                TxtParamValue.Text = "";
            }

            TxtDescription.Text = _selectedRule.Description;
            TxtExpectedOutcome.Text = _selectedRule.ExpectedOutcome;
            TxtLimitations.Text = _selectedRule.Limitations;
            TxtSourceDocument.Text = _selectedRule.SourceDocument;
            TxtSourceUrl.Text = _selectedRule.SourceUrl ?? "";
        }

        private void BtnAddNewRule_Click(object sender, RoutedEventArgs e)
        {
            _isCreatingNew = true;
            _selectedRule = null;
            DgRules.SelectedItem = null;

            var newIndex = _rulesCollection.Count + 1;
            var newId = $"RULE-145-CUSTOM-{newIndex:D2}";

            TxtEditorModeTitle.Text = $"CREATING NEW RULE: {newId}";
            TxtEditorStatus.Text = "Fill in parameters and click 'Save / Apply Rule Changes'";

            TxtRuleId.Text = newId;
            TxtRuleId.IsReadOnly = false;
            TxtRuleName.Text = "New Facility Compliance Check";
            TxtApplicableClause.Text = "145.A.25(c)";
            TxtRegulatoryReference.Text = "145.A.25(c)";
            CmbClassification.SelectedIndex = 0;
            CmbEvaluationType.SelectedIndex = 0;
            CmbSeverity.SelectedIndex = 1;
            ChkIsEnabled.IsChecked = true;
            ChkRequiresHumanReview.IsChecked = true;
            TxtParamKey.Text = "RoomKeyword";
            TxtParamValue.Text = "Workshop";
            TxtDescription.Text = "Verifies facility provision for the specified activity.";
            TxtExpectedOutcome.Text = "Dedicated zone modeled with physical partition boundaries.";
            TxtLimitations.Text = "Requires qualified reviewer verification of operational procedures.";
            TxtSourceDocument.Text = "Regulation (EU) No 1321/2014 Annex II (Part-145)";
            TxtSourceUrl.Text = "https://www.easa.europa.eu";
        }

        private void BtnDeleteRule_Click(object sender, RoutedEventArgs e)
        {
            var rule = DgRules.SelectedItem as RuleDefinition;
            if (rule == null)
            {
                MessageBox.Show("Please select a rule to delete.", "No Selection", MessageBoxButton.OK, MessageBoxImage.Warning);
                return;
            }

            var result = MessageBox.Show($"Are you sure you want to delete rule '{rule.RuleId} - {rule.Name}'?", "Confirm Delete", MessageBoxButton.YesNo, MessageBoxImage.Question);
            if (result == MessageBoxResult.Yes)
            {
                _mainViewModel.RuleEngineInstance.Rules.RemoveAll(r => r.RuleId == rule.RuleId);
                _rulesCollection.Remove(rule);
                TxtRuleCountBadge.Text = $"{_rulesCollection.Count} Rules Active";
                _selectedRule = _rulesCollection.FirstOrDefault();
                DgRules.SelectedItem = _selectedRule;
            }
        }

        private void BtnResetDefaults_Click(object sender, RoutedEventArgs e)
        {
            var result = MessageBox.Show("Reset rule catalog to standard EASA Part-145 defaults?", "Reset Defaults", MessageBoxButton.YesNo, MessageBoxImage.Question);
            if (result == MessageBoxResult.Yes)
            {
                _mainViewModel.RuleEngineInstance.Rules.Clear();
                _mainViewModel.RuleEngineInstance.Rules.AddRange(BuiltInBimRules.GetDefaultRules());
                LoadRules();
            }
        }

        private bool SaveCurrentRule()
        {
            var ruleId = TxtRuleId.Text.Trim();
            if (string.IsNullOrWhiteSpace(ruleId))
            {
                MessageBox.Show("Rule Identifier (Rule ID) cannot be empty.", "Validation Error", MessageBoxButton.OK, MessageBoxImage.Warning);
                return false;
            }

            var ruleName = TxtRuleName.Text.Trim();
            if (string.IsNullOrWhiteSpace(ruleName))
            {
                MessageBox.Show("Rule Name / Title cannot be empty.", "Validation Error", MessageBoxButton.OK, MessageBoxImage.Warning);
                return false;
            }

            var classificationStr = (CmbClassification.SelectedItem as ComboBoxItem)?.Content.ToString() ?? "Regulatory";
            Enum.TryParse<RegulatoryClassification>(classificationStr, out var classification);

            var evalTypeStr = (CmbEvaluationType.SelectedItem as ComboBoxItem)?.Content.ToString() ?? "RoomExistenceCheck";
            Enum.TryParse<RuleEvaluationType>(evalTypeStr, out var evalType);

            var severityStr = (CmbSeverity.SelectedItem as ComboBoxItem)?.Content.ToString() ?? "High";
            Enum.TryParse<SeverityLevel>(severityStr, out var severity);

            var existing = _mainViewModel.RuleEngineInstance.Rules.FirstOrDefault(r => r.RuleId.Equals(ruleId, StringComparison.OrdinalIgnoreCase));
            if (existing == null)
            {
                existing = new RuleDefinition { RuleId = ruleId };
                _mainViewModel.RuleEngineInstance.Rules.Add(existing);
                _rulesCollection.Add(existing);
            }

            existing.Name = ruleName;
            existing.ApplicableClause = TxtApplicableClause.Text.Trim();
            existing.RegulatoryReference = TxtRegulatoryReference.Text.Trim();
            existing.Classification = classification;
            existing.EvaluationType = evalType;
            existing.DefaultSeverity = severity;
            existing.IsEnabled = ChkIsEnabled.IsChecked ?? true;
            existing.RequiresHumanReview = ChkRequiresHumanReview.IsChecked ?? true;
            existing.Description = TxtDescription.Text.Trim();
            existing.ExpectedOutcome = TxtExpectedOutcome.Text.Trim();
            existing.Limitations = TxtLimitations.Text.Trim();
            existing.SourceDocument = TxtSourceDocument.Text.Trim();
            existing.SourceUrl = TxtSourceUrl.Text.Trim();

            // Set configurable parameter
            var pKey = TxtParamKey.Text.Trim();
            var pVal = TxtParamValue.Text.Trim();
            if (!string.IsNullOrWhiteSpace(pKey) && !pKey.Equals("None", StringComparison.OrdinalIgnoreCase))
            {
                existing.Parameters.Clear();
                if (double.TryParse(pVal, out var numVal))
                    existing.Parameters[pKey] = numVal;
                else
                    existing.Parameters[pKey] = pVal;
            }

            _isCreatingNew = false;
            TxtRuleCountBadge.Text = $"{_rulesCollection.Count} Rules Active";
            DgRules.SelectedItem = existing;
            TxtRuleId.IsReadOnly = true;
            TxtEditorModeTitle.Text = $"EDITING RULE: {existing.RuleId}";
            TxtEditorStatus.Text = "Rule updated and applied in engine.";

            return true;
        }

        private void BtnSaveRule_Click(object sender, RoutedEventArgs e)
        {
            if (SaveCurrentRule())
            {
                MessageBox.Show($"Rule '{TxtRuleId.Text}' successfully saved to the active rule library!", "Rule Saved", MessageBoxButton.OK, MessageBoxImage.Information);
            }
        }

        private void BtnSaveAndEvaluate_Click(object sender, RoutedEventArgs e)
        {
            if (SaveCurrentRule())
            {
                _mainViewModel.RunAssessment();
                MessageBox.Show(
                    $"Rule '{TxtRuleId.Text}' saved and live Revit model re-evaluated!\n\nTotal Findings: {_mainViewModel.AllFindings.Count}\nFiltered Findings: {_mainViewModel.FilteredFindings.Count}",
                    "Assessment Updated",
                    MessageBoxButton.OK,
                    MessageBoxImage.Information);
            }
        }

        private void BtnClose_Click(object sender, RoutedEventArgs e)
        {
            Close();
        }
    }
}
