using System;
using System.Collections.Generic;
using System.Linq;
using EasaCompliance.Core.Enums;
using EasaCompliance.Core.Models;
using EasaCompliance.Regulations.Models;
using EasaCompliance.Rules.Models;

namespace EasaCompliance.Rules.Engine
{
    /// <summary>
    /// EASA Part-145 Facility Compliance-Assistance Rule Engine.
    /// Decision-support aid for qualified human reviewers.
    /// Does NOT certify or guarantee EASA compliance.
    /// </summary>
    public class RuleEngine
    {
        public List<RuleDefinition> Rules { get; } = new();

        public RuleEngine(IEnumerable<RuleDefinition>? initialRules = null)
        {
            if (initialRules != null)
            {
                Rules.AddRange(initialRules);
            }
            else
            {
                Rules.AddRange(BuiltInBimRules.GetDefaultRules());
            }
        }

        public List<Finding> EvaluateModel(
            AssessmentProject project,
            List<BimElementData> rooms,
            List<BimElementData> doors,
            List<BimElementData> equipment,
            List<RequirementRecord> activeRequirements)
        {
            var findings = new List<Finding>();
            var reqMap = activeRequirements.ToDictionary(r => r.SectionReference, StringComparer.OrdinalIgnoreCase);

            foreach (var rule in Rules.Where(r => r.IsEnabled))
            {
                reqMap.TryGetValue(rule.RegulatoryReference, out var relatedReq);

                switch (rule.EvaluationType)
                {
                    case RuleEvaluationType.RoomExistenceCheck:
                        EvaluateRoomExistence(rule, rooms, findings);
                        break;
                    case RuleEvaluationType.DoorClearanceCheck:
                        EvaluateDoorClearances(rule, doors, findings);
                        break;
                    case RuleEvaluationType.EquipmentAssetPresenceCheck:
                        EvaluateEquipmentPresence(rule, equipment, findings);
                        break;
                    case RuleEvaluationType.ParameterCompletenessCheck:
                        EvaluateParameterCompleteness(rule, rooms, equipment, findings);
                        break;
                    case RuleEvaluationType.SecurityAccessControlCheck:
                        EvaluateSecurityAccessControl(rule, rooms, doors, findings);
                        break;
                    case RuleEvaluationType.SpatialDistanceCheck:
                        EvaluateSpatialProximity(rule, equipment, rooms, findings);
                        break;
                    case RuleEvaluationType.DocumentaryReviewCheck:
                    default:
                        findings.Add(new Finding
                        {
                            FindingId = $"FND-{rule.RuleId}-DOC",
                            RuleId = rule.RuleId,
                            RequirementId = relatedReq?.RequirementId ?? rule.RuleId,
                            RegulatoryReference = rule.RegulatoryReference,
                            SourceDocument = rule.SourceDocument,
                            SourceUrl = rule.SourceUrl,
                            Classification = rule.Classification,
                            Category = "Documentary / Physical Verification",
                            Status = ComplianceStatus.NotAssessed,
                            Severity = SeverityLevel.Informational,
                            Description = $"{rule.Name} cannot be reliably verified from BIM geometry alone.",
                            Explanation = "Physical environmental protection (weather sealing, dust ingress control, ambient HVAC temperature/humidity stability) must be validated through continuous sensor datalogger logs and on-site audit.",
                            VerificationMethod = "On-site audit & environmental monitoring records",
                            ConfidenceAndLimitations = rule.Limitations,
                            AssessorOrRule = rule.RuleId,
                            ReviewerDecision = ReviewerDecision.PendingReview
                        });
                        break;
                }
            }
            return findings;
        }

        private void EvaluateRoomExistence(RuleDefinition rule, List<BimElementData> rooms, List<Finding> findings)
        {
            var requiredRoomKeyword = rule.Parameters.TryGetValue("RoomKeyword", out var kw) ? kw.ToString() ?? "" : "";
            var matchingRooms = rooms.Where(r => r.RoomName.IndexOf(requiredRoomKeyword, StringComparison.OrdinalIgnoreCase) >= 0).ToList();

            if (!matchingRooms.Any())
            {
                findings.Add(new Finding
                {
                    FindingId = $"FND-{rule.RuleId}-MISSING",
                    RuleId = rule.RuleId,
                    RequirementId = rule.RuleId,
                    RegulatoryReference = rule.RegulatoryReference,
                    SourceDocument = rule.SourceDocument,
                    SourceUrl = rule.SourceUrl,
                    Classification = rule.Classification,
                    Category = "Facility Segregation",
                    Status = ComplianceStatus.GapFound,
                    Severity = rule.DefaultSeverity,
                    AffectedRoomOrZone = "Entire Facility Model",
                    MeasuredValue = "No room matching keyword found",
                    RequiredValue = $"Dedicated partitioned room matching '{requiredRoomKeyword}'",
                    Description = $"Required functional area matching '{requiredRoomKeyword}' not modeled in facility.",
                    Explanation = $"Under EASA 145.A.25(d) and 145.A.42, segregated storage areas (such as Quarantine and Bonded Stores) must be physically partitioned from active work bays to prevent mixing of unserviceable and serviceable parts.",
                    RecommendedCorrectiveAction = $"Designate and model dedicated {requiredRoomKeyword} with appropriate partition boundaries and controlled door access.",
                    ConfidenceAndLimitations = "Evaluated room spatial schedules. Operational procedures require MOE review.",
                    AssessorOrRule = rule.RuleId,
                    ReviewerDecision = ReviewerDecision.PendingReview
                });
            }
            else
            {
                foreach (var rm in matchingRooms)
                {
                    findings.Add(new Finding
                    {
                        FindingId = $"FND-{rule.RuleId}-{rm.ElementId}-MEETS",
                        RuleId = rule.RuleId,
                        RequirementId = rule.RuleId,
                        RegulatoryReference = rule.RegulatoryReference,
                        SourceDocument = rule.SourceDocument,
                        SourceUrl = rule.SourceUrl,
                        Classification = rule.Classification,
                        Category = "Facility Segregation",
                        Status = ComplianceStatus.MeetsModeledCheck,
                        Severity = SeverityLevel.Low,
                        AffectedRoomOrZone = rm.RoomName,
                        RevitElementId = rm.ElementId,
                        RevitUniqueId = rm.UniqueId,
                        MeasuredValue = $"Enclosed Room Area: {rm.AreaSqM:F1} m²",
                        RequiredValue = "Physically partitioned boundary per 145.A.25(d)",
                        Description = $"Designated functional area '{rm.RoomName}' is modeled with physical partition boundaries.",
                        Explanation = "Meets modeled architectural check for physical room boundary. Operational tag custody and access protocols must be verified by on-site audit.",
                        RecommendedCorrectiveAction = "Maintain physical partition boundaries during construction; verify MOE Chapter 2.2 procedures on-site.",
                        ConfidenceAndLimitations = "Model verifies spatial boundary; does not certify daily operational security.",
                        AssessorOrRule = rule.RuleId,
                        ReviewerDecision = ReviewerDecision.Accepted
                    });
                }
            }
        }

        private void EvaluateDoorClearances(RuleDefinition rule, List<BimElementData> doors, List<Finding> findings)
        {
            // Standard ULD PMC pallet base (2,438 mm) + handling transporter envelope (2,650 mm) + lateral margin (300 mm) = 2,950 mm
            var uldBaseWidthMm = rule.Parameters.TryGetValue("UldBaseWidthMm", out var uldObj) && double.TryParse(uldObj.ToString(), out var ub) ? ub : 2438.0;
            var transporterEnvelopeMm = rule.Parameters.TryGetValue("TransporterEnvelopeMm", out var trObj) && double.TryParse(trObj.ToString(), out var te) ? te : 2650.0;
            var lateralMarginMm = rule.Parameters.TryGetValue("LateralMarginMm", out var lmObj) && double.TryParse(lmObj.ToString(), out var lm) ? lm : 300.0;
            var requiredClearWidthMm = Math.Max(uldBaseWidthMm, transporterEnvelopeMm) + lateralMarginMm;

            foreach (var door in doors)
            {
                if (door.FamilyName.Contains("Rollup", StringComparison.OrdinalIgnoreCase) ||
                    door.FamilyName.Contains("Overhead", StringComparison.OrdinalIgnoreCase) ||
                    door.FamilyName.Contains("Hangar", StringComparison.OrdinalIgnoreCase) ||
                    door.Name.Contains("ULD", StringComparison.OrdinalIgnoreCase) ||
                    door.Name.Contains("Bay", StringComparison.OrdinalIgnoreCase))
                {
                    var clearWidth = door.ClearWidthMm > 0 ? door.ClearWidthMm : door.WidthMm;
                    if (clearWidth < requiredClearWidthMm)
                    {
                        findings.Add(new Finding
                        {
                            FindingId = $"FND-{rule.RuleId}-{door.ElementId}",
                            RuleId = rule.RuleId,
                            RequirementId = rule.RuleId,
                            RegulatoryReference = rule.RegulatoryReference,
                            SourceDocument = rule.SourceDocument,
                            SourceUrl = rule.SourceUrl,
                            Classification = rule.Classification,
                            Category = "ULD Access Clearances",
                            Status = ComplianceStatus.GapFound,
                            Severity = SeverityLevel.Critical,
                            AffectedRoomOrZone = door.RoomName ?? "Main Access",
                            RevitElementId = door.ElementId,
                            RevitUniqueId = door.UniqueId,
                            MeasuredValue = $"Clear Width: {clearWidth} mm (Nominal: {door.WidthMm} mm)",
                            RequiredValue = $"Required Clear Width: {requiredClearWidthMm} mm",
                            AssumptionsApplied = $"ULD Base: {uldBaseWidthMm} mm; Transporter Envelope: {transporterEnvelopeMm} mm; Lateral Buffer: {lateralMarginMm} mm per IATA AHM 911",
                            Description = $"Bay cargo door '{door.Name}' clear opening width ({clearWidth} mm) is less than required ULD handling envelope ({requiredClearWidthMm} mm).",
                            Explanation = $"Standard PMC / PAG cargo pallets have a base width of 2,438 mm (96 in). Transporting pallets through a {clearWidth} mm aperture causes direct physical collision risk with vertical door guides and structural frame.",
                            RecommendedCorrectiveAction = $"Issue Engineering Change Order to widen door clear opening to at least {requiredClearWidthMm} mm and install protective bollards.",
                            ConfidenceAndLimitations = "Evaluated from door family Clear Width parameter; on-site laser dimension check required.",
                            AssessorOrRule = rule.RuleId,
                            ReviewerDecision = ReviewerDecision.PendingReview
                        });
                    }
                    else
                    {
                        findings.Add(new Finding
                        {
                            FindingId = $"FND-{rule.RuleId}-{door.ElementId}-MEETS",
                            RuleId = rule.RuleId,
                            RequirementId = rule.RuleId,
                            RegulatoryReference = rule.RegulatoryReference,
                            SourceDocument = rule.SourceDocument,
                            SourceUrl = rule.SourceUrl,
                            Classification = rule.Classification,
                            Category = "ULD Access Clearances",
                            Status = ComplianceStatus.MeetsModeledCheck,
                            Severity = SeverityLevel.Low,
                            AffectedRoomOrZone = door.RoomName ?? "Main Access",
                            RevitElementId = door.ElementId,
                            RevitUniqueId = door.UniqueId,
                            MeasuredValue = $"Clear Width: {clearWidth} mm",
                            RequiredValue = $"Required Clear Width: {requiredClearWidthMm} mm",
                            AssumptionsApplied = $"ULD Base: {uldBaseWidthMm} mm; Transporter Envelope: {transporterEnvelopeMm} mm; Lateral Buffer: {lateralMarginMm} mm",
                            Description = $"Door '{door.Name}' verified clear width ({clearWidth} mm) meets modeled clearance for 96-in ULD pallets.",
                            Explanation = "Clear opening provides safe transit margin for selected ULD handling transporter envelope.",
                            RecommendedCorrectiveAction = "Maintain floor threshold markings during operations.",
                            ConfidenceAndLimitations = "Parameter check verified against family geometry.",
                            AssessorOrRule = rule.RuleId,
                            ReviewerDecision = ReviewerDecision.Accepted
                        });
                    }
                }
            }
        }

        private void EvaluateEquipmentPresence(RuleDefinition rule, List<BimElementData> equipment, List<Finding> findings)
        {
            var requiredEqType = rule.Parameters.TryGetValue("RequiredType", out var eqObj) ? eqObj.ToString() ?? "" : "";
            var matches = equipment.Where(e => e.TypeName.Contains(requiredEqType, StringComparison.OrdinalIgnoreCase) || e.FamilyName.Contains(requiredEqType, StringComparison.OrdinalIgnoreCase)).ToList();

            if (!matches.Any())
            {
                findings.Add(new Finding
                {
                    FindingId = $"FND-{rule.RuleId}-EQ-MISSING",
                    RuleId = rule.RuleId,
                    RequirementId = rule.RuleId,
                    RegulatoryReference = rule.RegulatoryReference,
                    SourceDocument = rule.SourceDocument,
                    SourceUrl = rule.SourceUrl,
                    Classification = rule.Classification,
                    Category = "Tools & Equipment (145.A.40)",
                    Status = ComplianceStatus.NeedsHumanReview,
                    Severity = SeverityLevel.High,
                    AffectedRoomOrZone = "Workshops",
                    MeasuredValue = "No equipment modeled with keyword",
                    RequiredValue = $"Presence of {requiredEqType} maintenance tooling",
                    Description = $"Expected maintenance equipment family matching '{requiredEqType}' was not found in the model.",
                    Explanation = "Under EASA 145.A.40, organizations must have the necessary equipment, tools, and material to perform the approved scope of work.",
                    RecommendedCorrectiveAction = $"Model required {requiredEqType} instances or verify tooling availability in the tool register.",
                    ConfidenceAndLimitations = "Equipment model check only; tools may be held off-model.",
                    AssessorOrRule = rule.RuleId,
                    ReviewerDecision = ReviewerDecision.PendingReview
                });
            }
            else
            {
                foreach (var eq in matches)
                {
                    var hasAssetId = eq.Parameters.ContainsKey("AssetID") || eq.Parameters.ContainsKey("Mark");
                    if (!hasAssetId)
                    {
                        findings.Add(new Finding
                        {
                            FindingId = $"FND-{rule.RuleId}-{eq.ElementId}-NOID",
                            RuleId = rule.RuleId,
                            RequirementId = rule.RuleId,
                            RegulatoryReference = rule.RegulatoryReference,
                            SourceDocument = rule.SourceDocument,
                            SourceUrl = rule.SourceUrl,
                            Classification = rule.Classification,
                            Category = "Tool Traceability (145.A.40)",
                            Status = ComplianceStatus.NeedsHumanReview,
                            Severity = SeverityLevel.Medium,
                            AffectedRoomOrZone = eq.RoomName ?? "Workshop",
                            RevitElementId = eq.ElementId,
                            RevitUniqueId = eq.UniqueId,
                            MeasuredValue = "AssetID parameter is empty",
                            RequiredValue = "Populated AssetID or Mark parameter",
                            Description = $"Equipment '{eq.Name}' lacks unique AssetID parameter for calibration traceability.",
                            Explanation = "Tools subject to calibration must be uniquely tagged and recorded in a master calibration index.",
                            RecommendedCorrectiveAction = "Populate AssetID parameter on Revit family instance and link to calibration software.",
                            ConfidenceAndLimitations = "Parameter completeness check only; calibration certificate must be reviewed in Evidence module.",
                            AssessorOrRule = rule.RuleId,
                            ReviewerDecision = ReviewerDecision.PendingReview
                        });
                    }
                    else
                    {
                        findings.Add(new Finding
                        {
                            FindingId = $"FND-{rule.RuleId}-{eq.ElementId}-MEETS",
                            RuleId = rule.RuleId,
                            RequirementId = rule.RuleId,
                            RegulatoryReference = rule.RegulatoryReference,
                            SourceDocument = rule.SourceDocument,
                            SourceUrl = rule.SourceUrl,
                            Classification = rule.Classification,
                            Category = "Tool Traceability (145.A.40)",
                            Status = ComplianceStatus.MeetsModeledCheck,
                            Severity = SeverityLevel.Low,
                            AffectedRoomOrZone = eq.RoomName ?? "Workshop",
                            RevitElementId = eq.ElementId,
                            RevitUniqueId = eq.UniqueId,
                            MeasuredValue = $"AssetID: {eq.Parameters.GetValueOrDefault("AssetID", eq.Parameters.GetValueOrDefault("Mark", ""))}",
                            RequiredValue = "Populated unique AssetID tag",
                            Description = $"Equipment instance '{eq.Name}' has populated asset identification parameters.",
                            Explanation = "Instance parameter verified for calibration tracking.",
                            RecommendedCorrectiveAction = "Verify physical calibration sticker during on-site audit.",
                            ConfidenceAndLimitations = "Model tag verified; calibration accuracy requires certificate review.",
                            AssessorOrRule = rule.RuleId,
                            ReviewerDecision = ReviewerDecision.Accepted
                        });
                    }
                }
            }
        }

        private void EvaluateParameterCompleteness(RuleDefinition rule, List<BimElementData> rooms, List<BimElementData> equipment, List<Finding> findings)
        {
            foreach (var rm in rooms.Where(r => r.IsMissingRequiredParameters))
            {
                findings.Add(new Finding
                {
                    FindingId = $"FND-{rule.RuleId}-RM-{rm.ElementId}",
                    RuleId = rule.RuleId,
                    RequirementId = rule.RuleId,
                    RegulatoryReference = rule.RegulatoryReference,
                    SourceDocument = rule.SourceDocument,
                    SourceUrl = rule.SourceUrl,
                    Classification = rule.Classification,
                    Category = "BIM Model Quality",
                    Status = ComplianceStatus.NeedsHumanReview,
                    Severity = SeverityLevel.Low,
                    AffectedRoomOrZone = rm.RoomName,
                    RevitElementId = rm.ElementId,
                    RevitUniqueId = rm.UniqueId,
                    MeasuredValue = $"Missing: {string.Join(", ", rm.MissingParameterNames)}",
                    RequiredValue = "Fully populated room parameters",
                    Description = $"Room '{rm.RoomName}' is missing required audit parameters ({string.Join(", ", rm.MissingParameterNames)}).",
                    Explanation = "Model parameters are required for automated regulatory categorization.",
                    RecommendedCorrectiveAction = "Populate missing parameters in Revit project schedule.",
                    AssessorOrRule = rule.RuleId,
                    ReviewerDecision = ReviewerDecision.PendingReview
                });
            }
        }

        private void EvaluateSecurityAccessControl(RuleDefinition rule, List<BimElementData> rooms, List<BimElementData> doors, List<Finding> findings)
        {
            var secureRooms = rooms.Where(r =>
                r.RoomName.Contains("Server", StringComparison.OrdinalIgnoreCase) ||
                r.RoomName.Contains("Records", StringComparison.OrdinalIgnoreCase) ||
                r.RoomName.Contains("Archive", StringComparison.OrdinalIgnoreCase) ||
                r.RoomName.Contains("Bonded", StringComparison.OrdinalIgnoreCase)).ToList();

            foreach (var sRoom in secureRooms)
            {
                var relatedDoors = doors.Where(d => d.RoomName.Contains(sRoom.RoomName, StringComparison.OrdinalIgnoreCase)).ToList();
                foreach (var d in relatedDoors)
                {
                    var hasElectronicAccess = d.Parameters.ContainsKey("AccessControl") &&
                        (d.Parameters["AccessControl"].Contains("Card", StringComparison.OrdinalIgnoreCase) ||
                         d.Parameters["AccessControl"].Contains("Biometric", StringComparison.OrdinalIgnoreCase) ||
                         d.Parameters["AccessControl"].Contains("RFID", StringComparison.OrdinalIgnoreCase));

                    if (!hasElectronicAccess)
                    {
                        findings.Add(new Finding
                        {
                            FindingId = $"FND-{rule.RuleId}-{d.ElementId}",
                            RuleId = rule.RuleId,
                            RequirementId = rule.RuleId,
                            RegulatoryReference = rule.RegulatoryReference,
                            SourceDocument = rule.SourceDocument,
                            SourceUrl = rule.SourceUrl,
                            Classification = rule.Classification,
                            Category = "Part-IS & Physical Security",
                            Status = ComplianceStatus.NeedsHumanReview,
                            Severity = SeverityLevel.High,
                            AffectedRoomOrZone = $"{sRoom.RoomName} ({d.Name})",
                            RevitElementId = d.ElementId,
                            RevitUniqueId = d.UniqueId,
                            MeasuredValue = d.Parameters.GetValueOrDefault("AccessControl", "Mechanical Lock / Unassigned"),
                            RequiredValue = "Electronic Access Control (RFID/Biometric) or documented MOE 2.2 controlled key custody",
                            Description = $"Secure room access door '{d.Name}' lacks electronic access control or audit-trail parameters.",
                            Explanation = "Under Part-IS (EU 2023/203) and 145.A.42, access to airworthiness server infrastructure and certified replacement parts must be restricted and logged.",
                            RecommendedCorrectiveAction = "Specify electronic card access hardware on door or submit MOE Chapter 2.2 key control log for reviewer acceptance.",
                            ConfidenceAndLimitations = "Requires reviewer acceptance of procedural controls if mechanical locks are retained.",
                            AssessorOrRule = rule.RuleId,
                            ReviewerDecision = ReviewerDecision.PendingReview
                        });
                    }
                    else
                    {
                        findings.Add(new Finding
                        {
                            FindingId = $"FND-{rule.RuleId}-{d.ElementId}-MEETS",
                            RuleId = rule.RuleId,
                            RequirementId = rule.RuleId,
                            RegulatoryReference = rule.RegulatoryReference,
                            SourceDocument = rule.SourceDocument,
                            SourceUrl = rule.SourceUrl,
                            Classification = rule.Classification,
                            Category = "Part-IS & Physical Security",
                            Status = ComplianceStatus.MeetsModeledCheck,
                            Severity = SeverityLevel.Low,
                            AffectedRoomOrZone = $"{sRoom.RoomName} ({d.Name})",
                            RevitElementId = d.ElementId,
                            RevitUniqueId = d.UniqueId,
                            MeasuredValue = d.Parameters["AccessControl"],
                            RequiredValue = "Electronic Access Control Hardware",
                            Description = $"Secure access door '{d.Name}' is modeled with electronic access control.",
                            Explanation = "Hardware parameter meets modeled security check.",
                            RecommendedCorrectiveAction = "Verify badge issuance and audit logging procedure during on-site audit.",
                            ConfidenceAndLimitations = "Hardware parameter verified in BIM; organizational custody policy required.",
                            AssessorOrRule = rule.RuleId,
                            ReviewerDecision = ReviewerDecision.Accepted
                        });
                    }
                }
            }
        }

        private void EvaluateSpatialProximity(RuleDefinition rule, List<BimElementData> equipment, List<BimElementData> rooms, List<Finding> findings)
        {
            var maxDistance = rule.Parameters.TryGetValue("MaxDistanceM", out var dObj) && double.TryParse(dObj.ToString(), out var d) ? d : 15.0;
            var hazardousRooms = rooms.Where(r =>
                r.RoomName.Contains("Battery", StringComparison.OrdinalIgnoreCase) ||
                r.RoomName.Contains("Chemical", StringComparison.OrdinalIgnoreCase) ||
                r.RoomName.Contains("NDT", StringComparison.OrdinalIgnoreCase)).ToList();

            var eyewashUnits = equipment.Where(e =>
                e.TypeName.Contains("Eyewash", StringComparison.OrdinalIgnoreCase) ||
                e.FamilyName.Contains("Eyewash", StringComparison.OrdinalIgnoreCase) ||
                e.Name.Contains("Eyewash", StringComparison.OrdinalIgnoreCase)).ToList();

            foreach (var hRoom in hazardousRooms)
            {
                var hasEyewashNearby = eyewashUnits.Any(e => (e.RoomName?.Equals(hRoom.RoomName, StringComparison.OrdinalIgnoreCase) ?? false));
                if (!hasEyewashNearby)
                {
                    findings.Add(new Finding
                    {
                        FindingId = $"FND-{rule.RuleId}-{hRoom.ElementId}",
                        RuleId = rule.RuleId,
                        RequirementId = rule.RuleId,
                        RegulatoryReference = rule.RegulatoryReference,
                        SourceDocument = rule.SourceDocument,
                        SourceUrl = rule.SourceUrl,
                        Classification = rule.Classification,
                        Category = "Industrial Hygiene & Safety",
                        Status = ComplianceStatus.GapFound,
                        Severity = SeverityLevel.High,
                        AffectedRoomOrZone = hRoom.RoomName,
                        RevitElementId = hRoom.ElementId,
                        RevitUniqueId = hRoom.UniqueId,
                        MeasuredValue = "Travel distance > 15 meters through partition doors",
                        RequiredValue = $"Eyewash within {maxDistance} m travel distance",
                        AssumptionsApplied = $"Industrial Hygiene Assumption citing ANSI/ISEA Z358.1-2014 & EN 15154. EASA Part-145 mandates safety under 145.A.25(c), but distance is an engineering assumption.",
                        Description = $"No emergency eyewash unit modeled within configured {maxDistance}m travel distance of hazardous chemical bench in '{hRoom.RoomName}'.",
                        Explanation = "Corrosive chemical exposure requires immediate decontamination within 10 seconds (approx. 15 m) to mitigate severe eye injury risks.",
                        RecommendedCorrectiveAction = $"Model an ANSI Z358.1 compliant eyewash fixture directly inside or immediately adjacent to '{hRoom.RoomName}'.",
                        ConfidenceAndLimitations = "Spatial distance calculated from model; site water pressure and potable supply require physical verification.",
                        AssessorOrRule = rule.RuleId,
                        ReviewerDecision = ReviewerDecision.PendingReview
                    });
                }
            }
        }
    }

    public static class BuiltInBimRules
    {
        public static List<RuleDefinition> GetDefaultRules()
        {
            return new List<RuleDefinition>
            {
                new()
                {
                    RuleId = "RULE-145-FAC-01",
                    Name = "Segregated Quarantine Storage Presence",
                    ApplicableClause = "145.A.25(d)",
                    RegulatoryReference = "145.A.25(d)",
                    Classification = RegulatoryClassification.Regulatory,
                    SourceDocument = "Regulation (EU) No 1321/2014 Annex II (Part-145)",
                    SourceUrl = "https://www.easa.europa.eu/en/document-library/easy-access-rules/easy-access-rules-continuing-airworthiness-regulation-eu-no-13212014",
                    Description = "Verifies existence of physically partitioned quarantine area for unserviceable components.",
                    EvaluationType = RuleEvaluationType.RoomExistenceCheck,
                    DefaultSeverity = SeverityLevel.Critical,
                    IsEnabled = true,
                    Parameters = new() { { "RoomKeyword", "Quarantine" } },
                    ExpectedOutcome = "Dedicated quarantine room modeled with physical partition boundaries.",
                    Limitations = "Physical lock status and procedures require MOE review."
                },
                new()
                {
                    RuleId = "RULE-145-FAC-02",
                    Name = "Bonded Parts Store Presence & Access Control",
                    ApplicableClause = "145.A.25(d) & 145.A.42(a)",
                    RegulatoryReference = "145.A.42(a)",
                    Classification = RegulatoryClassification.Regulatory,
                    SourceDocument = "Regulation (EU) No 1321/2014 Annex II (Part-145)",
                    SourceUrl = "https://www.easa.europa.eu/en/document-library/easy-access-rules/easy-access-rules-continuing-airworthiness-regulation-eu-no-13212014",
                    Description = "Verifies dedicated secure store room for serviceable aeronautical replacement parts.",
                    EvaluationType = RuleEvaluationType.RoomExistenceCheck,
                    DefaultSeverity = SeverityLevel.High,
                    IsEnabled = true,
                    Parameters = new() { { "RoomKeyword", "Bonded" } },
                    ExpectedOutcome = "Dedicated bonded store modeled with access control parameters.",
                    Limitations = "Stock binning traceability requires ERP documentary review."
                },
                new()
                {
                    RuleId = "RULE-145-FAC-03",
                    Name = "Workshop Door Clear Opening Width for ULD Pallet Handling",
                    ApplicableClause = "AMC 145.A.25(a)",
                    RegulatoryReference = "AMC 145.A.25(a)",
                    Classification = RegulatoryClassification.AMC_GM,
                    SourceDocument = "EASA AMC & GM to Part-145 (ED Decision 2015/029/R)",
                    SourceUrl = "https://www.easa.europa.eu/en/document-library/easy-access-rules/easy-access-rules-continuing-airworthiness-regulation-eu-no-13212014",
                    Description = "Verifies cargo bay doors have clear opening width sufficient for ULD base and handling transporter envelope.",
                    EvaluationType = RuleEvaluationType.DoorClearanceCheck,
                    DefaultSeverity = SeverityLevel.Critical,
                    IsEnabled = true,
                    Parameters = new()
                    {
                        { "UldBaseWidthMm", 2438.0 },
                        { "TransporterEnvelopeMm", 2650.0 },
                        { "LateralMarginMm", 300.0 }
                    },
                    ExpectedOutcome = "Clear opening width >= 2,950 mm for PMC 96-in pallets.",
                    Limitations = "Evaluates parametric Clear Opening Width; field threshold clearance must be verified on site."
                },
                new()
                {
                    RuleId = "RULE-145-FAC-04",
                    Name = "Emergency Eyewash Proximity to Chemical / Battery Servicing",
                    ApplicableClause = "ANSI/ISEA Z358.1-2014 / EN 15154",
                    RegulatoryReference = "ANSI Z358.1 / 145.A.25(c)",
                    Classification = RegulatoryClassification.ProjectAssumption,
                    SourceDocument = "ANSI/ISEA Z358.1-2014 / EN 15154 (Project Safety Assumption)",
                    SourceUrl = "https://webstore.ansi.org/standards/isea/ansiiseaz3582014",
                    Description = "Verifies emergency eyewash unit within 15 meters travel distance of battery chemical benches.",
                    EvaluationType = RuleEvaluationType.SpatialDistanceCheck,
                    DefaultSeverity = SeverityLevel.High,
                    IsEnabled = true,
                    Parameters = new() { { "MaxDistanceM", 15.0 } },
                    ExpectedOutcome = "Eyewash unit modeled within 15m travel distance.",
                    Limitations = "EASA Part-145 does not mandate 15m; this is an industrial hygiene assumption citing ANSI Z358.1."
                },
                new()
                {
                    RuleId = "RULE-145-FAC-05",
                    Name = "Maintenance Tooling Asset Identification Parameters",
                    ApplicableClause = "145.A.40(a)",
                    RegulatoryReference = "145.A.40(a)",
                    Classification = RegulatoryClassification.Regulatory,
                    SourceDocument = "Regulation (EU) No 1321/2014 Annex II (Part-145)",
                    SourceUrl = "https://www.easa.europa.eu/en/document-library/easy-access-rules/easy-access-rules-continuing-airworthiness-regulation-eu-no-13212014",
                    Description = "Checks maintenance equipment instances for AssetID or Mark parameters for calibration traceability.",
                    EvaluationType = RuleEvaluationType.EquipmentAssetPresenceCheck,
                    DefaultSeverity = SeverityLevel.Medium,
                    IsEnabled = true,
                    Parameters = new() { { "RequiredType", "Riveter" } },
                    ExpectedOutcome = "Maintenance equipment instances populated with AssetID.",
                    Limitations = "Calibration validity must be verified via ISO 17025 certificate review."
                },
                new()
                {
                    RuleId = "RULE-IS-SEC-01",
                    Name = "Server & Records Physical Access Security Control",
                    ApplicableClause = "IS.I.OR.200 & 145.A.42(a)",
                    RegulatoryReference = "Regulation (EU) 2023/203",
                    Classification = RegulatoryClassification.Regulatory,
                    SourceDocument = "Commission Implementing Regulation (EU) 2023/203 (Part-IS)",
                    SourceUrl = "https://www.easa.europa.eu/en/document-library/regulations/commission-implementing-regulation-eu-2023203",
                    Description = "Verifies physical access security control parameter on records archive or server doors.",
                    EvaluationType = RuleEvaluationType.SecurityAccessControlCheck,
                    DefaultSeverity = SeverityLevel.High,
                    IsEnabled = true,
                    Parameters = new(),
                    ExpectedOutcome = "Card reader or biometric access parameter specified on secure doors.",
                    Limitations = "Key custody procedures require organizational audit."
                }
            };
        }
    }
}
