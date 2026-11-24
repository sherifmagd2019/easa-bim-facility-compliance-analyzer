using System.Collections.Generic;
using System.Linq;
using Xunit;
using FluentAssertions;
using EasaCompliance.Core.Enums;
using EasaCompliance.Core.Models;
using EasaCompliance.Regulations.Models;
using EasaCompliance.Regulations.Services;
using EasaCompliance.Rules.Engine;
using EasaCompliance.Rules.Models;

namespace EasaCompliance.Tests
{
    public class RuleEngineTests
    {
        [Fact]
        public void EvaluateDoorClearances_WhenDoorWidthUnderRequiredEnvelope_GeneratesGapFound()
        {
            // Arrange
            var engine = new RuleEngine();
            var project = new AssessmentProject();
            var rooms = new List<BimElementData>();
            var doors = new List<BimElementData>
            {
                new()
                {
                    ElementId = 1001,
                    UniqueId = "u-door-substandard",
                    Name = "Bay Cargo Door South",
                    FamilyName = "Overhead Rollup Door",
                    WidthMm = 2100,
                    ClearWidthMm = 2100,
                    RoomName = "Main Maintenance Bay"
                }
            };
            var equipment = new List<BimElementData>();
            var requirements = new List<RequirementRecord>();

            // Act
            var findings = engine.EvaluateModel(project, rooms, doors, equipment, requirements);

            // Assert
            var doorFinding = findings.FirstOrDefault(f => f.FindingId.Contains("RULE-145-FAC-03"));
            doorFinding.Should().NotBeNull();
            doorFinding!.Status.Should().Be(ComplianceStatus.GapFound);
            doorFinding.Severity.Should().Be(SeverityLevel.Critical);
            doorFinding.Explanation.Should().Contain("PMC / PAG cargo pallets have a base width of 2,438 mm");
        }

        [Fact]
        public void EvaluateRoomExistence_WhenQuarantineMissing_GeneratesGapFound()
        {
            // Arrange
            var engine = new RuleEngine();
            var project = new AssessmentProject();
            var rooms = new List<BimElementData>
            {
                new() { ElementId = 2001, RoomName = "General Workshop", AreaSqM = 150.0 }
            };
            var doors = new List<BimElementData>();
            var equipment = new List<BimElementData>();
            var requirements = new List<RequirementRecord>();

            // Act
            var findings = engine.EvaluateModel(project, rooms, doors, equipment, requirements);

            // Assert
            var quarantineFinding = findings.FirstOrDefault(f => f.FindingId.Contains("RULE-145-FAC-01-MISSING"));
            quarantineFinding.Should().NotBeNull();
            quarantineFinding!.Status.Should().Be(ComplianceStatus.GapFound);
            quarantineFinding.Severity.Should().Be(SeverityLevel.Critical);
        }
    }

    public class ApplicabilityEngineTests
    {
        [Fact]
        public void ValidateRoute_ThirdCountryApplyingToMemberStateNAA_FlagsError()
        {
            // Arrange
            var validator = new AuthorityRouteValidator();

            // Act
            var (isValid, note, requiresVerification) = validator.ValidateRoute("United States", "Member State NAA Direct Application (LBA)");

            // Assert
            isValid.Should().BeFalse();
            note.Should().Contain("FLAGGED REGULATORY ROUTE ERROR");
            requiresVerification.Should().BeTrue();
        }

        [Fact]
        public void EvaluateScope_PartIS_WithoutOrgDetails_ReturnsUnresolved()
        {
            // Arrange
            var engine = new RegulatoryApplicabilityEngine();
            var project = new AssessmentProject { OrganizationDetails = "" };
            var library = new List<RequirementRecord>
            {
                new()
                {
                    RequirementId = "REQ-IS.I.OR.200",
                    RegulationName = "Commission Implementing Regulation (EU) 2023/203",
                    SectionReference = "IS.I.OR.200"
                }
            };

            // Act
            var results = engine.EvaluateScope(project, library);

            // Assert
            results.First().State.Should().Be(ApplicabilityState.UNRESOLVED);
            results.First().NeedsClarification.Should().BeTrue();
        }
    }
}
