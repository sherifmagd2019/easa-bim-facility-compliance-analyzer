using System;
using System.Collections.Generic;
using EasaCompliance.Core.Enums;
using EasaCompliance.Regulations.Models;

namespace EasaCompliance.Rules.Models
{
    public enum RuleEvaluationType
    {
        RoomExistenceCheck,
        DoorClearanceCheck,
        EquipmentAssetPresenceCheck,
        SpatialDistanceCheck,
        ParameterCompletenessCheck,
        CirculationPathCheck,
        SecurityAccessControlCheck,
        DocumentaryReviewCheck
    }

    public class RuleDefinition
    {
        public string RuleId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string ApplicableClause { get; set; } = string.Empty;
        public string RegulatoryReference { get; set; } = string.Empty;
        public RegulatoryClassification Classification { get; set; } = RegulatoryClassification.Regulatory;
        public string SourceDocument { get; set; } = string.Empty;
        public string? SourceUrl { get; set; }
        public string SourceRevisionDate { get; set; } = "2024-06-15";
        public string LastVerifiedDate { get; set; } = "2026-10-23";
        public bool IsUnverified { get; set; } = false;
        public string Description { get; set; } = string.Empty;
        public RuleEvaluationType EvaluationType { get; set; }
        public SeverityLevel DefaultSeverity { get; set; } = SeverityLevel.High;
        public bool IsEnabled { get; set; } = true;
        public bool RequiresHumanReview { get; set; } = true;
        public string Version { get; set; } = "v2026.10-EASA-145-R3";
        public string? PriorVersion { get; set; } = "v2024.11-REV27";
        public Dictionary<string, object> Parameters { get; set; } = new();
        public string ExpectedOutcome { get; set; } = string.Empty;
        public string Limitations { get; set; } = string.Empty;
        public string VerificationMethod { get; set; } = string.Empty;
    }
}
