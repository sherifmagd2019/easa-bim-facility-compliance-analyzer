namespace EasaCompliance.Core.Enums
{
    /// <summary>
    /// 4-tier EASA compliance-assistance status.
    /// Software never certifies or guarantees compliance; it supports a qualified reviewer.
    /// </summary>
    public enum ComplianceStatus
    {
        MeetsModeledCheck,
        GapFound,
        NeedsHumanReview,
        NotAssessed
    }

    public enum RegulatoryClassification
    {
        Regulatory,         // Hard Law: Implementing Regulation (EU) No 1321/2014 Annex II / (EU) 2023/203
        AMC_GM,             // Soft Law: EASA Acceptable Means of Compliance / Guidance Material
        ProjectAssumption   // Engineering / Project Assumption (requires cited external standard & sign-off)
    }

    public enum ReviewerDecision
    {
        PendingReview,
        Accepted,
        Overridden,
        UnderRemediation
    }

    public enum SeverityLevel
    {
        Critical,
        High,
        Medium,
        Low,
        Informational
    }

    public enum ApplicabilityState
    {
        APPLICABLE,
        NOT_APPLICABLE,
        CONDITIONAL,
        UNRESOLVED
    }

    public enum CorrectiveActionStatus
    {
        Open,
        InProgress,
        PendingRetest,
        VerifiedClosed,
        Rejected
    }

    public enum EvidenceType
    {
        ApprovedProcedure,
        CalibrationRecord,
        InspectionRecord,
        MaintenanceLog,
        PersonnelQualification,
        TechnicalManual,
        SitePhotograph,
        PhysicalInspectionResult,
        AuthorityCorrespondence,
        FacilityDrawing
    }
}
