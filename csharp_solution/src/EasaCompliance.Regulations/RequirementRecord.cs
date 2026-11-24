using System;
using System.Collections.Generic;
using System.Linq;
using EasaCompliance.Core.Enums;
using EasaCompliance.Core.Models;

namespace EasaCompliance.Regulations.Models
{
    public enum AssessmentMethodType
    {
        BimAutomated,
        DocumentaryReview,
        PhysicalInspection,
        HybridBimAndDocumentary
    }

    public enum RegulatoryHierarchy
    {
        HardLaw_ImplementingRule, // Binding Regulation (EU) 1321/2014, (EU) 2023/203
        SoftLaw_AMC,             // Acceptable Means of Compliance
        SoftLaw_GM,              // Guidance Material
        EngineeringCheck,        // Best practice / operational guideline
        OrganizationProcedure    // MOE / Internal requirement
    }

    public class RequirementRecord
    {
        public string RequirementId { get; set; } = string.Empty;
        public string RegulationName { get; set; } = string.Empty;
        public string SectionReference { get; set; } = string.Empty;
        public RegulatoryHierarchy Hierarchy { get; set; }
        public string SourceDocumentTitle { get; set; } = string.Empty;
        public string SourceRevisionDate { get; set; } = string.Empty;
        public string OfficialSourceUrl { get; set; } = string.Empty;
        public string Summary { get; set; } = string.Empty;
        public string OriginalTextExtract { get; set; } = string.Empty;
        public string ApplicabilityConditions { get; set; } = string.Empty;
        public AssessmentMethodType AssessmentMethod { get; set; }
        public string RequiredEvidence { get; set; } = string.Empty;
        public List<string> RelatedBimCategories { get; set; } = new();
        public List<string> RelatedBimParameters { get; set; } = new();
        public List<string> NonBimEvidenceSources { get; set; } = new();
        public ApplicabilityState Applicability { get; set; } = ApplicabilityState.APPLICABLE;
        public string ApplicabilityJustification { get; set; } = string.Empty;
        public bool RequiresHumanReview { get; set; } = true;
        public string ConfidenceStatus { get; set; } = "High - Directly grounded in official Easy Access Rules";
        public string RuleRevision { get; set; } = "2024.11-R01";
        public DateTime LastVerificationDate { get; set; } = DateTime.UtcNow;

        // Evaluated compliance status computed from model findings
        public ComplianceStatus EvaluatedComplianceStatus { get; set; } = ComplianceStatus.NotAssessed;
        public string ComplianceNotes { get; set; } = "Not yet evaluated";
        public int AssociatedFindingsCount { get; set; } = 0;
        public int AssociatedGapsCount { get; set; } = 0;
        public string ReviewerDecisionNotes { get; set; } = string.Empty;
    }

    public static class DefaultRegulationsCatalog
    {
        public static List<RequirementRecord> GetDefaultRegulations()
        {
            return new List<RequirementRecord>
            {
                new()
                {
                    RequirementId = "REQ-145.A.25-A",
                    RegulationName = "Regulation (EU) No 1321/2014 Annex II (Part-145)",
                    SectionReference = "145.A.25(a)",
                    Hierarchy = RegulatoryHierarchy.HardLaw_ImplementingRule,
                    SourceDocumentTitle = "EASA Easy Access Rules for Continuing Airworthiness (Part-145)",
                    OfficialSourceUrl = "https://www.easa.europa.eu/en/document-library/easy-access-rules/easy-access-rules-continuing-airworthiness-regulation-eu-no-13212014",
                    SourceRevisionDate = "2024-06-15 (ED Decision 2024/008/R)",
                    Summary = "Facilities are suited to all planned work, ensuring in particular, protection from the weather elements and environmental contamination.",
                    OriginalTextExtract = "Facilities are suited to all planned work, ensuring in particular, protection from the weather elements. Specialized workshops and bays are segregated as appropriate, to ensure that environmental and work area contamination is unlikely to occur.",
                    ApplicabilityConditions = "Universal baseline for all approved maintenance organizations.",
                    AssessmentMethod = AssessmentMethodType.HybridBimAndDocumentary,
                    RequiredEvidence = "Enclosed facility envelope in BIM; weather sealing details; continuous temperature and environmental datalogger logs.",
                    RelatedBimCategories = new() { "Rooms", "Walls", "Doors", "Roofs" },
                    Applicability = ApplicabilityState.APPLICABLE,
                    ApplicabilityJustification = "Universal baseline for component repair shops; dust and environmental ingress must be prevented.",
                    RequiresHumanReview = true
                },
                new()
                {
                    RequirementId = "REQ-145.A.25-B",
                    RegulationName = "Regulation (EU) No 1321/2014 Annex II (Part-145)",
                    SectionReference = "145.A.25(b)",
                    Hierarchy = RegulatoryHierarchy.HardLaw_ImplementingRule,
                    SourceDocumentTitle = "EASA Easy Access Rules for Continuing Airworthiness (Part-145)",
                    OfficialSourceUrl = "https://www.easa.europa.eu/en/document-library/easy-access-rules/easy-access-rules-continuing-airworthiness-regulation-eu-no-13212014",
                    SourceRevisionDate = "2024-06-15 (ED Decision 2024/008/R)",
                    Summary = "Office accommodation is provided for management of planned work and certifying staff without excessive distraction.",
                    OriginalTextExtract = "Office accommodation is provided for the management of the planned work referred to in point (a), and certifying staff so that they may carry out their designated tasks in a manner that contributes to good aircraft maintenance standards.",
                    ApplicabilityConditions = "Universal Part-145 requirement for production planners and certifying staff.",
                    AssessmentMethod = AssessmentMethodType.BimAutomated,
                    RequiredEvidence = "BIM room schedule identifying dedicated planning and certifying staff offices segregated from noisy repair bays.",
                    RelatedBimCategories = new() { "Rooms" },
                    Applicability = ApplicabilityState.APPLICABLE,
                    ApplicabilityJustification = "Planning and airworthiness release personnel require dedicated office spaces.",
                    RequiresHumanReview = false
                },
                new()
                {
                    RequirementId = "REQ-145.A.25-C",
                    RegulationName = "Regulation (EU) No 1321/2014 Annex II (Part-145)",
                    SectionReference = "145.A.25(c)",
                    Hierarchy = RegulatoryHierarchy.HardLaw_ImplementingRule,
                    SourceDocumentTitle = "EASA Easy Access Rules for Continuing Airworthiness (Part-145)",
                    OfficialSourceUrl = "https://www.easa.europa.eu/en/document-library/easy-access-rules/easy-access-rules-continuing-airworthiness-regulation-eu-no-13212014",
                    SourceRevisionDate = "2024-06-15 (ED Decision 2024/008/R)",
                    Summary = "The working environment shall be appropriate for the task (temperature, humidity, lighting, noise, dust).",
                    OriginalTextExtract = "The working environment including aircraft hangars, component workshops and office accommodation shall be appropriate for the task carried out and in particular with respect to temperatures, humidity, lighting, noise, dust and airborne contamination.",
                    ApplicabilityConditions = "Applies to all maintenance workshops, NDT testing booths, and visual inspection areas.",
                    AssessmentMethod = AssessmentMethodType.HybridBimAndDocumentary,
                    RequiredEvidence = "Continuous 30-day temperature & humidity sensor logs; photometer survey report (750 Lux for visual ULD inspection); acoustic noise survey.",
                    RelatedBimCategories = new() { "Rooms", "Equipment" },
                    Applicability = ApplicabilityState.APPLICABLE,
                    ApplicabilityJustification = "Environmental parameters cannot be evaluated solely from BIM geometry and require physical sensor log evidence.",
                    RequiresHumanReview = true
                },
                new()
                {
                    RequirementId = "REQ-145.A.25-D",
                    RegulationName = "Regulation (EU) No 1321/2014 Annex II (Part-145)",
                    SectionReference = "145.A.25(d)",
                    Hierarchy = RegulatoryHierarchy.HardLaw_ImplementingRule,
                    SourceDocumentTitle = "EASA Easy Access Rules for Continuing Airworthiness (Part-145)",
                    OfficialSourceUrl = "https://www.easa.europa.eu/en/document-library/easy-access-rules/easy-access-rules-continuing-airworthiness-regulation-eu-no-13212014",
                    SourceRevisionDate = "2024-06-15 (ED Decision 2024/008/R)",
                    Summary = "Secure storage facilities ensuring physical segregation of serviceable from unserviceable components and materials.",
                    OriginalTextExtract = "Secure storage facilities shall be provided for components, equipment, tools and material. Storage conditions shall ensure segregation of serviceable components and material from unserviceable aircraft components, material, equipment and tools. Access to storage facilities shall be restricted to authorized personnel.",
                    ApplicabilityConditions = "Universal Part-145 requirement for component stores and quarantine holding.",
                    AssessmentMethod = AssessmentMethodType.HybridBimAndDocumentary,
                    RequiredEvidence = "BIM model showing dedicated enclosed storage room boundaries for Bonded Store and Quarantine; access control hardware parameters; MOE Chapter 2.2 storekeeper procedures.",
                    RelatedBimCategories = new() { "Rooms", "Doors" },
                    Applicability = ApplicabilityState.APPLICABLE,
                    ApplicabilityJustification = "Physical segregation of serviceable from unserviceable parts is a mandatory airworthiness safeguard.",
                    RequiresHumanReview = true
                },
                new()
                {
                    RequirementId = "REQ-AMC-145.A.25-A",
                    RegulationName = "Acceptable Means of Compliance to Part-145 (AMC 145.A.25(a))",
                    SectionReference = "AMC 145.A.25(a)",
                    Hierarchy = RegulatoryHierarchy.SoftLaw_AMC,
                    SourceDocumentTitle = "ED Decision 2015/029/R & Consolidated AMC to Part-145",
                    OfficialSourceUrl = "https://www.easa.europa.eu/en/document-library/easy-access-rules/easy-access-rules-continuing-airworthiness-regulation-eu-no-13212014",
                    SourceRevisionDate = "2024-06-15",
                    Summary = "Door openings and transit routes should provide adequate clearance for component dimensions plus handling equipment envelope and lateral margins.",
                    OriginalTextExtract = "Hangar and workshop door openings and internal transit routes should provide adequate clearance for the largest component or unit handled, taking into account the dimensions of handling equipment and maneuvering margins.",
                    ApplicabilityConditions = "Applies to ULD maintenance facilities handling PMC/PAG pallets and AKE containers.",
                    AssessmentMethod = AssessmentMethodType.BimAutomated,
                    RequiredEvidence = "Verified door clear opening width parameter (not nominal width); comparison against selected ULD envelope + handling transporter + lateral clearance margin.",
                    RelatedBimCategories = new() { "Doors", "Rooms" },
                    Applicability = ApplicabilityState.APPLICABLE,
                    ApplicabilityJustification = "Preventing collision and structural impact damage to ULD frames or door framing during transit.",
                    RequiresHumanReview = false
                },
                new()
                {
                    RequirementId = "REQ-AMC-145.A.25-D",
                    RegulationName = "Acceptable Means of Compliance to Part-145 (AMC 145.A.25(d))",
                    SectionReference = "AMC 145.A.25(d)",
                    Hierarchy = RegulatoryHierarchy.SoftLaw_AMC,
                    SourceDocumentTitle = "ED Decision 2015/029/R & Consolidated AMC to Part-145",
                    OfficialSourceUrl = "https://www.easa.europa.eu/en/document-library/easy-access-rules/easy-access-rules-continuing-airworthiness-regulation-eu-no-13212014",
                    SourceRevisionDate = "2024-06-15",
                    Summary = "Storage facility security, lock custody, environmental protection, shelf-life monitoring, and electrostatic discharge protection.",
                    OriginalTextExtract = "Storage facilities should be clean, well-ventilated and maintained at an even dry temperature. Segregation of parts should be physical. Access should be controlled by a designated storekeeper.",
                    ApplicabilityConditions = "Applies to bonded aeronautical parts store, hardware storage, and shelf-life consumables.",
                    AssessmentMethod = AssessmentMethodType.HybridBimAndDocumentary,
                    RequiredEvidence = "BIM lock/access control parameters; shelf life log; ESD protection certification for electronic ULD tracking tags.",
                    RelatedBimCategories = new() { "Rooms", "Doors" },
                    Applicability = ApplicabilityState.APPLICABLE,
                    ApplicabilityJustification = "Protection of high-value certified replacement extrusions and avionics tracking hardware.",
                    RequiresHumanReview = true
                },
                new()
                {
                    RequirementId = "REQ-145.A.40-A",
                    RegulationName = "Regulation (EU) No 1321/2014 Annex II (Part-145)",
                    SectionReference = "145.A.40(a)",
                    Hierarchy = RegulatoryHierarchy.HardLaw_ImplementingRule,
                    SourceDocumentTitle = "EASA Easy Access Rules for Continuing Airworthiness (Part-145)",
                    OfficialSourceUrl = "https://www.easa.europa.eu/en/document-library/easy-access-rules/easy-access-rules-continuing-airworthiness-regulation-eu-no-13212014",
                    SourceRevisionDate = "2024-06-15 (ED Decision 2024/008/R)",
                    Summary = "Equipment, tools and material availability and control. Calibrated tools controlled to an officially recognized standard.",
                    OriginalTextExtract = "The organization shall have available and use the necessary equipment, tools and material to perform the approved scope of work. Where necessary, tools and equipment shall be controlled and calibrated to an officially recognized standard.",
                    ApplicabilityConditions = "Mandatory for all tooling used in ULD maintenance (riveters, scales, net load testers, torque wrenches).",
                    AssessmentMethod = AssessmentMethodType.HybridBimAndDocumentary,
                    RequiredEvidence = "BIM equipment instances with populated AssetID / Mark parameters; ISO 17025 accredited calibration certificates; Master tool calibration register.",
                    RelatedBimCategories = new() { "Equipment" },
                    Applicability = ApplicabilityState.APPLICABLE,
                    ApplicabilityJustification = "Tool traceability is essential for EASA release to service privileges.",
                    RequiresHumanReview = true
                },
                new()
                {
                    RequirementId = "REQ-145.A.42-A",
                    RegulationName = "Regulation (EU) No 1321/2014 Annex II (Part-145)",
                    SectionReference = "145.A.42(a)",
                    Hierarchy = RegulatoryHierarchy.HardLaw_ImplementingRule,
                    SourceDocumentTitle = "EASA Easy Access Rules for Continuing Airworthiness (Part-145)",
                    OfficialSourceUrl = "https://www.easa.europa.eu/en/document-library/easy-access-rules/easy-access-rules-continuing-airworthiness-regulation-eu-no-13212014",
                    SourceRevisionDate = "2024-06-15 (ED Decision 2024/008/R)",
                    Summary = "Classification and segregation of components. Serviceable components must be stored in secure bonded store.",
                    OriginalTextExtract = "All components shall be classified and segregated into the following categories: (1) Components in a satisfactory condition, released on an EASA Form 1 or equivalent; (2) Unserviceable components; (3) Unsalvageable components; (4) Standard parts; (5) Raw and consumable material.",
                    ApplicabilityConditions = "Applies to ULD hardware (corners, extrusions, panels, nets, rivets).",
                    AssessmentMethod = AssessmentMethodType.HybridBimAndDocumentary,
                    RequiredEvidence = "BIM model showing dedicated enclosed storage room boundaries for Bonded Store; access control hardware parameters; receiving inspection protocol.",
                    RelatedBimCategories = new() { "Rooms", "Doors" },
                    Applicability = ApplicabilityState.APPLICABLE,
                    ApplicabilityJustification = "Serviceable parts must never mix with unserviceable or uncertified materials.",
                    RequiresHumanReview = true
                },
                new()
                {
                    RequirementId = "REQ-145.A.42-B",
                    RegulationName = "Regulation (EU) No 1321/2014 Annex II (Part-145)",
                    SectionReference = "145.A.42(b)",
                    Hierarchy = RegulatoryHierarchy.HardLaw_ImplementingRule,
                    SourceDocumentTitle = "EASA Easy Access Rules for Continuing Airworthiness (Part-145)",
                    OfficialSourceUrl = "https://www.easa.europa.eu/en/document-library/easy-access-rules/easy-access-rules-continuing-airworthiness-regulation-eu-no-13212014",
                    SourceRevisionDate = "2024-06-15",
                    Summary = "Segregation and quarantine of unserviceable and unsalvageable components until disposal or overhaul decision.",
                    OriginalTextExtract = "Unserviceable and unsalvageable components shall be segregated to a quarantine area or scrap holding area under the control of the authorized person until a decision is made on their future status.",
                    ApplicabilityConditions = "Mandatory physical quarantine segregation in all component repair facilities.",
                    AssessmentMethod = AssessmentMethodType.BimAutomated,
                    RequiredEvidence = "Dedicated quarantine holding area modeled in BIM with restricted access boundary.",
                    RelatedBimCategories = new() { "Rooms", "Doors" },
                    Applicability = ApplicabilityState.APPLICABLE,
                    ApplicabilityJustification = "Prevents accidental installation of cracked or defective ULD structural components.",
                    RequiresHumanReview = false
                },
                new()
                {
                    RequirementId = "REQ-IS.I.OR.200",
                    RegulationName = "Commission Implementing Regulation (EU) 2023/203 (Part-IS)",
                    SectionReference = "IS.I.OR.200",
                    Hierarchy = RegulatoryHierarchy.HardLaw_ImplementingRule,
                    SourceDocumentTitle = "Information Security Management Systems in Civil Aviation",
                    OfficialSourceUrl = "https://www.easa.europa.eu/en/document-library/regulations/commission-implementing-regulation-eu-2023203",
                    SourceRevisionDate = "2023-02-17 (Mandatory since 2025/2026)",
                    Summary = "Information security management system (ISMS). Physical access control to records and aviation IT servers.",
                    OriginalTextExtract = "The organization shall implement and maintain an information security management system (ISMS) to manage risks which may impact aviation safety, including physical security protection of server facilities and archive rooms holding maintenance release records.",
                    ApplicabilityConditions = "Applies to organizations maintaining digital airworthiness records or ERP release systems.",
                    AssessmentMethod = AssessmentMethodType.HybridBimAndDocumentary,
                    RequiredEvidence = "BIM server/records room door with electronic access control parameters (RFID/Biometric); ISMS physical security policy.",
                    RelatedBimCategories = new() { "Rooms", "Doors" },
                    Applicability = ApplicabilityState.CONDITIONAL,
                    ApplicabilityJustification = "Applies to facilities hosting electronic EASA Form 1 databases and release records.",
                    RequiresHumanReview = true
                },
                new()
                {
                    RequirementId = "REQ-145.A.47-A",
                    RegulationName = "Regulation (EU) No 1321/2014 Annex II (Part-145)",
                    SectionReference = "145.A.47(a)",
                    Hierarchy = RegulatoryHierarchy.HardLaw_ImplementingRule,
                    SourceDocumentTitle = "EASA Easy Access Rules for Continuing Airworthiness (Part-145)",
                    OfficialSourceUrl = "https://www.easa.europa.eu/en/document-library/easy-access-rules/easy-access-rules-continuing-airworthiness-regulation-eu-no-13212014",
                    SourceRevisionDate = "2024-06-15",
                    Summary = "Production planning system taking into account human performance limitations and facility ergonomic workflow.",
                    OriginalTextExtract = "The organization shall have a system appropriate to the amount and complexity of work to plan the availability of all necessary personnel, tools, equipment, material, maintenance data and facilities in order to ensure the safe completion of the maintenance work.",
                    ApplicabilityConditions = "Universal requirement for workload and facility flow planning.",
                    AssessmentMethod = AssessmentMethodType.DocumentaryReview,
                    RequiredEvidence = "Production planning software integration; MOE Chapter 2.8 procedures; shift planning records.",
                    RelatedBimCategories = new() { "Rooms" },
                    Applicability = ApplicabilityState.APPLICABLE,
                    ApplicabilityJustification = "Requires organizational audit of planning procedures.",
                    RequiresHumanReview = true
                },
                new()
                {
                    RequirementId = "REQ-145.A.65-A",
                    RegulationName = "Regulation (EU) No 1321/2014 Annex II (Part-145)",
                    SectionReference = "145.A.65(a)",
                    Hierarchy = RegulatoryHierarchy.HardLaw_ImplementingRule,
                    SourceDocumentTitle = "EASA Easy Access Rules for Continuing Airworthiness (Part-145)",
                    OfficialSourceUrl = "https://www.easa.europa.eu/en/document-library/easy-access-rules/easy-access-rules-continuing-airworthiness-regulation-eu-no-13212014",
                    SourceRevisionDate = "2024-06-15",
                    Summary = "Safety management and independent quality audit system with unhindered physical access to all facility zones.",
                    OriginalTextExtract = "The organization shall establish an independent quality audit system to monitor compliance with the required aircraft/aircraft component standards and adequacy of procedures.",
                    ApplicabilityConditions = "Universal Part-145 requirement for internal safety and quality audits.",
                    AssessmentMethod = AssessmentMethodType.DocumentaryReview,
                    RequiredEvidence = "Independent quality audit plan, audit schedules, auditor authorization credentials.",
                    RelatedBimCategories = new() { "Rooms" },
                    Applicability = ApplicabilityState.APPLICABLE,
                    ApplicabilityJustification = "Quality audit schedule and independence require review of MOE Chapter 3.",
                    RequiresHumanReview = true
                }
            };
        }
    }

    public static class RegulationComplianceEvaluator
    {
        public static void EvaluateRegulationsCompliance(
            IEnumerable<RequirementRecord> regulations,
            IEnumerable<Finding> findings)
        {
            var findingsList = findings.ToList();

            foreach (var req in regulations)
            {
                var relatedFindings = findingsList.Where(f =>
                    (!string.IsNullOrWhiteSpace(f.RequirementId) && f.RequirementId.Equals(req.RequirementId, StringComparison.OrdinalIgnoreCase)) ||
                    (!string.IsNullOrWhiteSpace(f.RegulatoryReference) && (
                        f.RegulatoryReference.Equals(req.SectionReference, StringComparison.OrdinalIgnoreCase) ||
                        f.RegulatoryReference.Contains(req.SectionReference, StringComparison.OrdinalIgnoreCase) ||
                        req.SectionReference.Contains(f.RegulatoryReference, StringComparison.OrdinalIgnoreCase)
                    ))
                ).ToList();

                req.AssociatedFindingsCount = relatedFindings.Count;
                req.AssociatedGapsCount = relatedFindings.Count(f => f.Status == ComplianceStatus.GapFound);

                if (relatedFindings.Any(f => f.Status == ComplianceStatus.GapFound))
                {
                    req.EvaluatedComplianceStatus = ComplianceStatus.GapFound;
                    var gapDesc = string.Join("; ", relatedFindings.Where(f => f.Status == ComplianceStatus.GapFound).Select(f => f.Description));
                    req.ComplianceNotes = $"NON-COMPLIANT (Modeled Gap Found): {gapDesc}";
                }
                else if (relatedFindings.Any(f => f.Status == ComplianceStatus.NeedsHumanReview))
                {
                    req.EvaluatedComplianceStatus = ComplianceStatus.NeedsHumanReview;
                    req.ComplianceNotes = "NEEDS HUMAN REVIEW: Modeled elements present but require documentary / reviewer validation.";
                }
                else if (relatedFindings.Any(f => f.Status == ComplianceStatus.MeetsModeledCheck))
                {
                    req.EvaluatedComplianceStatus = ComplianceStatus.MeetsModeledCheck;
                    req.ComplianceNotes = "COMPLIANT (Meets modeled check): All active BIM rules evaluated successfully for this clause.";
                }
                else
                {
                    req.EvaluatedComplianceStatus = ComplianceStatus.NotAssessed;
                    req.ComplianceNotes = req.AssessmentMethod == AssessmentMethodType.DocumentaryReview
                        ? "NOT ASSESSED FROM BIM: Requires MOE documentary procedures or on-site physical audit."
                        : "NOT ASSESSED: No direct modeled rule currently active in current pass.";
                }
            }
        }
    }
}
