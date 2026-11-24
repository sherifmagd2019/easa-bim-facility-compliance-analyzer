using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using EasaCompliance.Core.Enums;
using EasaCompliance.Core.Models;
using EasaCompliance.Regulations.Models;

namespace EasaCompliance.Reporting.Services
{
    public class ReportModel
    {
        public AssessmentProject Project { get; set; } = new();
        public ModelCompletenessReport Completeness { get; set; } = new();
        public List<Finding> Findings { get; set; } = new();
        public List<RequirementRecord> Regulations { get; set; } = new();
        public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
        public string RuleLibraryVersion { get; set; } = "v2026.10-EASA-145-R3";
        public string Disclaimer { get; set; } = "This document is a software-assisted compliance-assistance review report generated to support a qualified human reviewer. It does NOT constitute an EASA Part-145 approval, certificate, or guarantee of regulatory compliance. Official approval requires on-site audit and direct authorization by the competent authority.";
    }

    public class PdfReportBuilder
    {
        public static string GenerateTextReport(ReportModel model)
        {
            var sb = new StringBuilder();
            sb.AppendLine("================================================================================");
            sb.AppendLine("DEVELOPER: Developer Eng. Sherif Ahmad Magdaldin");
            sb.AppendLine("================================================================================");
            sb.AppendLine("    EASA PART-145 FACILITY COMPLIANCE-ASSISTANCE REVIEW REPORT");
            sb.AppendLine("         Annex II to Regulation (EU) No 1321/2014 & Part-IS (EU 2023/203)");
            sb.AppendLine($"                    Rule Library: {model.RuleLibraryVersion}");
            sb.AppendLine("================================================================================");
            sb.AppendLine($"Facility Name:            {model.Project.FacilityName}");
            sb.AppendLine($"Facility Address:         {model.Project.FacilityAddress}");
            sb.AppendLine($"Country of Operation:     {model.Project.CountryOfOperation}");
            sb.AppendLine($"Intended Approval Scope:  {model.Project.IntendedApprovalScope}");
            sb.AppendLine($"Intended Authority Route: {model.Project.IntendedAuthorityRoute}");
            sb.AppendLine($"Assessment Date:          {model.Project.AssessmentDate:yyyy-MM-dd HH:mm:ss} UTC");
            sb.AppendLine($"Model File:               {model.Project.ModelFileName}");
            sb.AppendLine($"Model Fingerprint:        {model.Project.ModelFingerprint}");
            sb.AppendLine("--------------------------------------------------------------------------------");
            sb.AppendLine("MANDATORY REGULATORY DISCLAIMER:");
            sb.AppendLine(model.Disclaimer);
            sb.AppendLine("--------------------------------------------------------------------------------");

            // Complete Regulations Status Matrix & Executive Summary
            var regs = model.Regulations;
            var compliantCount = regs.Count(r => r.EvaluatedComplianceStatus == ComplianceStatus.MeetsModeledCheck);
            var gapCount = regs.Count(r => r.EvaluatedComplianceStatus == ComplianceStatus.GapFound);
            var reviewCount = regs.Count(r => r.EvaluatedComplianceStatus == ComplianceStatus.NeedsHumanReview);
            var docCount = regs.Count(r => r.EvaluatedComplianceStatus == ComplianceStatus.NotAssessed);

            sb.AppendLine("EXECUTIVE REGULATORY COMPLIANCE STATUS SUMMARY:");
            sb.AppendLine($"  Total EASA Clauses Tracked:          {regs.Count}");
            sb.AppendLine($"  Meets Modeled Check (Compliant):     {compliantCount}");
            sb.AppendLine($"  Modeled Gaps Found (Non-Compliant):  {gapCount}");
            sb.AppendLine($"  Human / Engineering Review Required: {reviewCount}");
            sb.AppendLine($"  Documentary / Physical Audit Req'd:  {docCount}");
            sb.AppendLine("--------------------------------------------------------------------------------");

            sb.AppendLine("COMPLETE EASA PART-145 & PART-IS REGULATORY COMPLIANCE CHECKLIST:");
            sb.AppendLine("--------------------------------------------------------------------------------");
            if (regs.Any())
            {
                foreach (var req in regs)
                {
                    var statusTag = req.EvaluatedComplianceStatus switch
                    {
                        ComplianceStatus.MeetsModeledCheck => "[COMPLIANT - MEETS MODELED CHECK]",
                        ComplianceStatus.GapFound => "[NON-COMPLIANT - GAP FOUND]",
                        ComplianceStatus.NeedsHumanReview => "[NEEDS HUMAN REVIEW]",
                        _ => "[NOT ASSESSED / DOCUMENTARY REQUIRED]"
                    };

                    sb.AppendLine($"{req.SectionReference,-16} | {statusTag,-38} | Method: {req.AssessmentMethod}");
                    sb.AppendLine($"  Clause Title:   {req.Summary}");
                    sb.AppendLine($"  Regulation:     {req.RegulationName} ({req.Hierarchy})");
                    sb.AppendLine($"  Status Details: {req.ComplianceNotes}");
                    sb.AppendLine($"  Required Proof: {req.RequiredEvidence}");
                    if (!string.IsNullOrWhiteSpace(req.ReviewerDecisionNotes))
                    {
                        sb.AppendLine($"  Reviewer Notes: {req.ReviewerDecisionNotes}");
                    }
                    sb.AppendLine();
                }
            }
            else
            {
                sb.AppendLine("  No regulations registered in current audit profile.");
            }

            sb.AppendLine("--------------------------------------------------------------------------------");
            sb.AppendLine("CONFIGURED ENGINEERING ASSUMPTIONS:");
            sb.AppendLine("  1. ULD Handling Envelope: PMC (96 in) transporter envelope 2,650 mm + 300 mm lateral");
            sb.AppendLine("     maneuvering clearance = 2,950 mm required clear opening (Source: IATA AHM 911).");
            sb.AppendLine("  2. Emergency Eyewash: 15.0 m maximum walking travel distance (Source: ANSI Z358.1).");
            sb.AppendLine("--------------------------------------------------------------------------------");
            sb.AppendLine("FINDINGS MATRIX & TRACEABILITY REGISTER:");
            sb.AppendLine("--------------------------------------------------------------------------------");
            foreach (var f in model.Findings)
            {
                sb.AppendLine($"[{f.FindingId}] | Status: {f.Status} | Severity: {f.Severity} | Clause: {f.RegulatoryReference}");
                sb.AppendLine($"  Classification:  {f.Classification}");
                sb.AppendLine($"  Zone / Element:  {f.AffectedRoomOrZone} (Revit Element ID: {f.RevitElementId?.ToString() ?? "N/A"})");
                sb.AppendLine($"  Measured Value:  {f.MeasuredValue}");
                sb.AppendLine($"  Required Value:  {f.RequiredValue}");
                if (!string.IsNullOrWhiteSpace(f.AssumptionsApplied))
                    sb.AppendLine($"  Assumptions:     {f.AssumptionsApplied}");
                sb.AppendLine($"  Description:     {f.Description}");
                sb.AppendLine($"  Explanation:     {f.Explanation}");
                sb.AppendLine($"  Action:          {f.RecommendedCorrectiveAction}");
                sb.AppendLine($"  Reviewer Status: {f.ReviewerDecision}");
                sb.AppendLine();
            }
            sb.AppendLine("--------------------------------------------------------------------------------");
            sb.AppendLine("UNASSESSED PROVISIONS REQUIRING DOCUMENTARY / ON-SITE AUDIT:");
            sb.AppendLine("  - 145.A.25(a)/(c): Sand/dust ingress sealing, weather tightness, and ambient HVAC");
            sb.AppendLine("    stability require 30-day sensor datalogger records and TAB commissioning logs.");
            sb.AppendLine("  - 145.A.40(a): Tooling calibration validity requires ISO 17025 certificate audit.");
            sb.AppendLine("  - 145.A.25(d): Physical quarantine key custody requires MOE Chapter 2.2 audit.");
            sb.AppendLine("--------------------------------------------------------------------------------");
            sb.AppendLine("REVIEWER SIGN-OFF BLOCKS (Formal Human Decision Record):");
            sb.AppendLine();
            sb.AppendLine("  _____________________________________     _____________________________________");
            sb.AppendLine("  Lead Airworthiness Surveyor               Facility Quality & Safety Director");
            sb.AppendLine("  Date & Professional License               Date & Management Acceptance");
            sb.AppendLine("================================================================================");
            return sb.ToString();
        }
    }

    public class ExcelFindingsExporter
    {
        public static string GenerateCsvRegister(List<Finding> findings)
        {
            var sb = new StringBuilder();
            sb.AppendLine("# EASA PART-145 FACILITY COMPLIANCE-ASSISTANCE GAP ASSESSMENT REPORT");
            sb.AppendLine("# Developer: Developer Eng. Sherif Ahmad Magdaldin");
            sb.AppendLine("# Platform: Autodesk Revit 2025/2026/2027 (.NET 8 LTS / .NET 10)");
            sb.AppendLine("# Disclaimer: Decision-support aid for qualified human reviewers. Does not certify compliance.");
            sb.AppendLine("FindingId,RuleId,RegulatoryReference,Classification,Status,Severity,AffectedZone,RevitElementId,MeasuredValue,RequiredValue,AssumptionsApplied,Description,Explanation,CorrectiveAction,ReviewerDecision");
            foreach (var f in findings)
            {
                var row = $"\"{f.FindingId}\",\"{f.RuleId}\",\"{f.RegulatoryReference}\",\"{f.Classification}\",\"{f.Status}\",\"{f.Severity}\",\"{f.AffectedRoomOrZone}\",\"{f.RevitElementId}\",\"{f.MeasuredValue.Replace("\"", "\"\"")}\",\"{f.RequiredValue.Replace("\"", "\"\"")}\",\"{f.AssumptionsApplied.Replace("\"", "\"\"")}\",\"{f.Description.Replace("\"", "\"\"")}\",\"{f.Explanation.Replace("\"", "\"\"")}\",\"{f.RecommendedCorrectiveAction.Replace("\"", "\"\"")}\",\"{f.ReviewerDecision}\"";
                sb.AppendLine(row);
            }
            return sb.ToString();
        }

        public static string GenerateRegulationsCsvRegister(List<RequirementRecord> regulations)
        {
            var sb = new StringBuilder();
            sb.AppendLine("# EASA PART-145 REGULATORY COMPLIANCE STATUS REGISTER");
            sb.AppendLine("# Developer: Developer Eng. Sherif Ahmad Magdaldin");
            sb.AppendLine("# Platform: Autodesk Revit 2025/2026/2027 (.NET 8 LTS / .NET 10)");
            sb.AppendLine("RequirementId,SectionReference,RegulationName,Hierarchy,EvaluatedComplianceStatus,AssessmentMethod,Summary,ComplianceNotes,AssociatedFindingsCount,AssociatedGapsCount,RequiredEvidence,OfficialSourceUrl");
            foreach (var r in regulations)
            {
                var row = $"\"{r.RequirementId}\",\"{r.SectionReference}\",\"{r.RegulationName}\",\"{r.Hierarchy}\",\"{r.EvaluatedComplianceStatus}\",\"{r.AssessmentMethod}\",\"{r.Summary.Replace("\"", "\"\"")}\",\"{r.ComplianceNotes.Replace("\"", "\"\"")}\",\"{r.AssociatedFindingsCount}\",\"{r.AssociatedGapsCount}\",\"{r.RequiredEvidence.Replace("\"", "\"\"")}\",\"{r.OfficialSourceUrl}\"";
                sb.AppendLine(row);
            }
            return sb.ToString();
        }
    }
}
