using System;
using System.Collections.Generic;
using EasaCompliance.Core.Enums;
using EasaCompliance.Core.Models;
using EasaCompliance.Regulations.Models;

namespace EasaCompliance.Regulations.Services
{
    public class ApplicabilityEvaluationResult
    {
        public string RequirementId { get; set; } = string.Empty;
        public ApplicabilityState State { get; set; }
        public string Justification { get; set; } = string.Empty;
        public bool NeedsClarification { get; set; }
        public string MissingInformation { get; set; } = string.Empty;
    }

    public class RegulatoryApplicabilityEngine
    {
        public List<ApplicabilityEvaluationResult> EvaluateScope(AssessmentProject project, List<RequirementRecord> library)
        {
            var results = new List<ApplicabilityEvaluationResult>();
            foreach (var req in library)
            {
                var eval = new ApplicabilityEvaluationResult
                {
                    RequirementId = req.RequirementId
                };

                // Part-IS Scoping (Regulation EU 2023/203)
                if (req.RegulationName.Contains("2023/203") || req.SectionReference.StartsWith("IS."))
                {
                    if (string.IsNullOrWhiteSpace(project.OrganizationDetails))
                    {
                        eval.State = ApplicabilityState.UNRESOLVED;
                        eval.Justification = "Part-IS applicability cannot be finalized: Organization digital infrastructure and connection to airworthiness records not declared.";
                        eval.NeedsClarification = true;
                        eval.MissingInformation = "IT architecture and connectivity to airworthiness records / digital release certificates.";
                    }
                    else
                    {
                        eval.State = ApplicabilityState.CONDITIONAL;
                        eval.Justification = "Part-IS (Regulation EU 2023/203) applies conditionally if digital maintenance records or electronic EASA Form 1 systems are operated.";
                    }
                }
                // Standard Part-145 Facility Requirements (145.A.25)
                else if (req.SectionReference.StartsWith("145.A.25"))
                {
                    eval.State = ApplicabilityState.APPLICABLE;
                    eval.Justification = "145.A.25 Facility requirements apply universally to all approved maintenance organizations holding rating C20 (ULD components).";
                }
                // Equipment and Tools (145.A.40)
                else if (req.SectionReference.StartsWith("145.A.40"))
                {
                    eval.State = ApplicabilityState.APPLICABLE;
                    eval.Justification = "145.A.40 Equipment and tools apply to ULD inspection, riveting, composite repair, and load testing activities.";
                }
                // Component Control & Storage (145.A.42)
                else if (req.SectionReference.StartsWith("145.A.42"))
                {
                    eval.State = ApplicabilityState.APPLICABLE;
                    eval.Justification = "145.A.42 Acceptance of components applies to ULD hardware (corners, extrusions, panels, nets, rivets). Bonded and quarantine segregation mandatory.";
                }
                else
                {
                    eval.State = ApplicabilityState.APPLICABLE;
                    eval.Justification = "Standard requirement applicable to EASA Part-145 maintenance organization approval.";
                }

                results.Add(eval);
            }
            return results;
        }
    }

    public class AuthorityRouteValidator
    {
        public (bool IsValid, string Note, bool RequiresVerification) ValidateRoute(string countryOfOperation, string intendedRoute)
        {
            if (string.IsNullOrWhiteSpace(countryOfOperation))
            {
                return (false, "Country of operation is not specified. EASA authority competence depends on whether the facility is within an EU Member State or a Third Country.", true);
            }

            var isEuMemberState = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                "Austria", "Belgium", "Bulgaria", "Croatia", "Cyprus", "Czech Republic", "Czechia",
                "Denmark", "Estonia", "Finland", "France", "Germany", "Greece", "Hungary", "Ireland",
                "Italy", "Latvia", "Lithuania", "Luxembourg", "Malta", "Netherlands", "Poland",
                "Portugal", "Romania", "Slovakia", "Slovenia", "Spain", "Sweden", "Switzerland", "Norway", "Iceland"
            }.Contains(countryOfOperation);

            if (!isEuMemberState)
            {
                if (intendedRoute.Contains("National Aviation Authority") || intendedRoute.Contains("Member State"))
                {
                    return (false, "FLAGGED REGULATORY ROUTE ERROR: Facilities located outside EU Member States cannot seek direct Part-145 approval from an individual EU Member State NAA. Application must be submitted directly to EASA Foreign Part-145 Approvals Section via EASA Form 2 or under an applicable bilateral agreement (e.g., FAA BASA/MAG or TCCA CAR 573).", true);
                }
                return (true, "Valid Route: Direct EASA Foreign Part-145 Organization Approval (EASA Flight Standards Directorate) or applicable Bilateral Aviation Safety Agreement (BASA).", true);
            }

            return (true, $"Facility located in EU/EFTA state ({countryOfOperation}). Competent authority is the National Aviation Authority (NAA) of the principal place of business under Regulation (EU) 1321/2014 Article 4.", false);
        }
    }
}
