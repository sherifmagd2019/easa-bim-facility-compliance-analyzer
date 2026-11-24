-- EASA BIM Facility Compliance Analyzer SQLite Schema
CREATE TABLE IF NOT EXISTS AssessmentProjects (
    ProjectId TEXT PRIMARY KEY,
    ProjectName TEXT NOT NULL,
    ProjectNumber TEXT,
    FacilityName TEXT NOT NULL,
    FacilityAddress TEXT,
    CountryOfOperation TEXT,
    PrincipalPlaceOfBusiness TEXT,
    FacilityManager TEXT,
    OrganizationDetails TEXT,
    AssessmentDate TEXT,
    Revision TEXT,
    IntendedMaintenanceActivities TEXT,
    IntendedApprovalScope TEXT,
    ApprovalStatus TEXT,
    IntendedAuthorityRoute TEXT,
    AuthorityDeterminationVerified INTEGER DEFAULT 0,
    AssessmentLimitations TEXT,
    Assumptions TEXT,
    ModelFingerprint TEXT,
    ModelFileName TEXT,
    CreatedAt TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS Findings (
    FindingId TEXT PRIMARY KEY,
    ProjectId TEXT NOT NULL,
    RequirementId TEXT NOT NULL,
    RegulatoryReference TEXT NOT NULL,
    Category TEXT,
    Status TEXT NOT NULL,
    Severity TEXT NOT NULL,
    AffectedRoomOrZone TEXT,
    RevitElementId INTEGER,
    RevitUniqueId TEXT,
    Description TEXT NOT NULL,
    Explanation TEXT,
    EvidenceReviewed TEXT,
    RecommendedCorrectiveAction TEXT,
    VerificationMethod TEXT,
    ConfidenceAndLimitations TEXT,
    AssessorOrRule TEXT,
    Timestamp TEXT,
    FOREIGN KEY(ProjectId) REFERENCES AssessmentProjects(ProjectId) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS EvidenceItems (
    EvidenceId TEXT PRIMARY KEY,
    FindingId TEXT,
    Type TEXT NOT NULL,
    Title TEXT NOT NULL,
    FileReferenceOrLocation TEXT NOT NULL,
    SourceDate TEXT,
    Reviewer TEXT,
    VerificationStatus TEXT,
    RelatedRequirementId TEXT,
    RelatedRevitUniqueId TEXT,
    Comments TEXT,
    CreatedAt TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS CorrectiveActions (
    ActionId TEXT PRIMARY KEY,
    FindingId TEXT NOT NULL,
    Description TEXT NOT NULL,
    ResponsiblePerson TEXT,
    TargetDate TEXT,
    Status TEXT NOT NULL,
    RequiredCompletionEvidence TEXT,
    VerificationMethod TEXT,
    RetestResult TEXT,
    ClosureReviewer TEXT,
    ClosureDate TEXT,
    FOREIGN KEY(FindingId) REFERENCES Findings(FindingId) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS AssessmentSessions (
    SessionId TEXT PRIMARY KEY,
    ProjectId TEXT NOT NULL,
    ModelFingerprint TEXT,
    RevitVersion TEXT,
    RegulatoryLibraryVersion TEXT,
    RulesExecutedCount INTEGER,
    PassCount INTEGER,
    FailCount INTEGER,
    NeedsReviewCount INTEGER,
    Timestamp TEXT DEFAULT (datetime('now')),
    FOREIGN KEY(ProjectId) REFERENCES AssessmentProjects(ProjectId)
);
