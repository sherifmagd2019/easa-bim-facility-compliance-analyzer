using System;
using System.Collections.Generic;
using EasaCompliance.Core.Enums;

namespace EasaCompliance.Core.Models
{
    public class AssessmentProject
    {
        public string ProjectId { get; set; } = Guid.NewGuid().ToString("N");
        public string ProjectName { get; set; } = string.Empty;
        public string ProjectNumber { get; set; } = string.Empty;
        public string FacilityName { get; set; } = string.Empty;
        public string FacilityAddress { get; set; } = string.Empty;
        public string CountryOfOperation { get; set; } = string.Empty;
        public string PrincipalPlaceOfBusiness { get; set; } = string.Empty;
        public string FacilityManager { get; set; } = string.Empty;
        public string OrganizationDetails { get; set; } = string.Empty;
        public DateTime AssessmentDate { get; set; } = DateTime.UtcNow;
        public string Revision { get; set; } = "1.0";
        public string IntendedMaintenanceActivities { get; set; } = "ULD Inspection, Minor/Major Structural Repair, Netting & Hardware Replacement";
        public List<string> UldTypesHandled { get; set; } = new() { "PMC (96x125 in Pallet)", "PAG (88x125 in Pallet)", "AKE (LD3)", "AMF" };
        public string ActiveUldProfileId { get; set; } = "uld-pmc";
        public string IntendedApprovalScope { get; set; } = "Part-145 Rating C20 (Structural Components - ULD)";
        public string ApprovalStatus { get; set; } = "Applicant - Pre-Audit Gap Phase";
        public string IntendedAuthorityRoute { get; set; } = "EASA Third-Country Part-145 (Foreign Part-145 Section A/Section B)";
        public bool AuthorityDeterminationVerified { get; set; } = false;
        public string AssessmentLimitations { get; set; } = "Decision-support aid for qualified human reviewers. Does NOT certify or guarantee EASA compliance. Non-BIM operational procedures, airworthiness management, and environmental logs require on-site documentary inspection.";
        public string Assumptions { get; set; } = "Assume standard EASA Part-145 Annex II (Regulation EU No 1321/2014) and Information Security Management (Regulation EU 2023/203) regulatory applicability thresholds. Door clearance envelopes derived from ULD handling profile + lateral buffer.";
        public string ModelFingerprint { get; set; } = string.Empty;
        public string ModelFileName { get; set; } = string.Empty;
        public bool IsDemoData { get; set; } = false;
    }

    public class BimElementData
    {
        public long ElementId { get; set; }
        public string UniqueId { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string FamilyName { get; set; } = string.Empty;
        public string TypeName { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string LevelName { get; set; } = string.Empty;
        public string RoomName { get; set; } = string.Empty;
        public string RoomNumber { get; set; } = string.Empty;
        public double AreaSqM { get; set; }
        public double VolumeCuM { get; set; }
        public double WidthMm { get; set; }
        public double HeightMm { get; set; }
        public double ClearWidthMm { get; set; }
        public bool ClearOpeningVerified { get; set; }
        public Dictionary<string, string> Parameters { get; set; } = new();
        public bool IsMissingRequiredParameters { get; set; }
        public List<string> MissingParameterNames { get; set; } = new();
    }

    public class BimExtractionResult
    {
        public string DocumentTitle { get; set; } = string.Empty;
        public string DocumentPath { get; set; } = string.Empty;
        public string ProjectName { get; set; } = string.Empty;
        public string ProjectNumber { get; set; } = string.Empty;
        public string RevitVersion { get; set; } = "Autodesk Revit 2025/2026/2027";
        public string DocumentFingerprint { get; set; } = string.Empty;
        public List<BimElementData> Levels { get; set; } = new();
        public List<BimElementData> Rooms { get; set; } = new();
        public List<BimElementData> Doors { get; set; } = new();
        public List<BimElementData> Equipment { get; set; } = new();
        public List<BimElementData> Walls { get; set; } = new();
        public List<string> Warnings { get; set; } = new();
    }

    public class ReviewerOverrideRecord
    {
        public string OverrideId { get; set; } = Guid.NewGuid().ToString("N");
        public string ReviewerName { get; set; } = string.Empty;
        public string ReviewerRole { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public ComplianceStatus PreviousStatus { get; set; }
        public ComplianceStatus NewStatus { get; set; }
        public string Reason { get; set; } = string.Empty;
        public string JustificationEvidenceRef { get; set; } = string.Empty;
    }

    public class Finding
    {
        public string FindingId { get; set; } = string.Empty;
        public string RuleId { get; set; } = string.Empty;
        public string RequirementId { get; set; } = string.Empty;
        public string RegulatoryReference { get; set; } = string.Empty;
        public string SourceDocument { get; set; } = string.Empty;
        public string? SourceUrl { get; set; }
        public RegulatoryClassification Classification { get; set; } = RegulatoryClassification.Regulatory;
        public string Category { get; set; } = string.Empty;
        public ComplianceStatus Status { get; set; }
        public SeverityLevel Severity { get; set; }
        public string AffectedRoomOrZone { get; set; } = string.Empty;
        public long? RevitElementId { get; set; }
        public string? RevitUniqueId { get; set; }
        public string MeasuredValue { get; set; } = string.Empty;
        public string RequiredValue { get; set; } = string.Empty;
        public string AssumptionsApplied { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Explanation { get; set; } = string.Empty;
        public string EvidenceReviewed { get; set; } = string.Empty;
        public string MissingEvidence { get; set; } = string.Empty;
        public string RecommendedCorrectiveAction { get; set; } = string.Empty;
        public string VerificationMethod { get; set; } = "Re-evaluation of BIM model and documentary review";
        public string ConfidenceAndLimitations { get; set; } = string.Empty;
        public string AssessorOrRule { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public ReviewerDecision ReviewerDecision { get; set; } = ReviewerDecision.PendingReview;
        public List<ReviewerOverrideRecord> ReviewerOverrides { get; set; } = new();
        public List<string> AttachedEvidenceIds { get; set; } = new();
        public List<string> CorrectiveActionIds { get; set; } = new();
    }

    public class EvidenceItem
    {
        public string EvidenceId { get; set; } = Guid.NewGuid().ToString("N");
        public EvidenceType Type { get; set; }
        public string Title { get; set; } = string.Empty;
        public string FileReferenceOrLocation { get; set; } = string.Empty;
        public DateTime SourceDate { get; set; } = DateTime.UtcNow;
        public string Reviewer { get; set; } = string.Empty;
        public string VerificationStatus { get; set; } = "Verified Valid";
        public string RelatedRequirementId { get; set; } = string.Empty;
        public string? RelatedRevitUniqueId { get; set; }
        public string Comments { get; set; } = string.Empty;
    }

    public class CorrectiveAction
    {
        public string ActionId { get; set; } = Guid.NewGuid().ToString("N");
        public string FindingId { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string ResponsiblePerson { get; set; } = string.Empty;
        public DateTime TargetDate { get; set; }
        public CorrectiveActionStatus Status { get; set; } = CorrectiveActionStatus.Open;
        public string RequiredCompletionEvidence { get; set; } = string.Empty;
        public string VerificationMethod { get; set; } = string.Empty;
        public string RetestResult { get; set; } = "Pending Retest";
        public string? ClosureReviewer { get; set; }
        public DateTime? ClosureDate { get; set; }
    }

    public class ModelCompletenessReport
    {
        public int ElementsInspected { get; set; }
        public int ElementsExcluded { get; set; }
        public int RoomsInspected { get; set; }
        public int DoorsInspected { get; set; }
        public int EquipmentInspected { get; set; }
        public int MissingRequiredParameterCount { get; set; }
        public List<string> UnidentifiedRooms { get; set; } = new();
        public List<string> UnidentifiedEquipment { get; set; } = new();
        public List<string> IncompleteChecks { get; set; } = new();
        public List<string> ModelLimitations { get; set; } = new();
        public double OverallCompletenessScore { get; set; }
    }
}
