export type ComplianceStatus = 
  | 'Meets modeled check'
  | 'Gap found'
  | 'Needs human review'
  | 'Not assessed';

export type SeverityLevel = 
  | 'Critical'
  | 'High'
  | 'Medium'
  | 'Low'
  | 'Informational';

export type ApplicabilityState = 
  | 'APPLICABLE'
  | 'NOT_APPLICABLE'
  | 'CONDITIONAL'
  | 'UNRESOLVED';

export type RegulatoryClassification = 
  | 'Regulatory'          // Hard Law - Regulation (EU) No 1321/2014 Annex II (Part-145) or (EU) 2023/203 (Part-IS)
  | 'AMC_GM'               // Soft Law - EASA Acceptable Means of Compliance / Guidance Material (ED Decisions)
  | 'ProjectAssumption';   // Engineering / Project Design Assumption (Requires cited external standard, configurable, reviewer approved)

export type AssessmentMethod = 
  | 'BimAutomated'
  | 'DocumentaryReview'
  | 'PhysicalInspection'
  | 'HybridBimAndDocumentary';

export type ReviewerDecision = 
  | 'PendingReview'
  | 'Accepted'
  | 'Overridden'
  | 'UnderRemediation';

export interface ReviewerOverride {
  overrideId: string;
  reviewerName: string;
  reviewerRole: string;
  timestamp: string;
  previousStatus: ComplianceStatus;
  newStatus: ComplianceStatus;
  reason: string;
  justificationEvidenceRef: string;
}

export interface ConfigurableParameter {
  key: string;
  label: string;
  value: number | string | boolean;
  defaultValue: number | string | boolean;
  unit?: string;
  citedSource: string;
  requiresReviewerApproval: boolean;
  approvedBy?: string;
  approvalDate?: string;
  description: string;
}

export interface UldProfile {
  id: string;
  code: string;
  name: string;
  category: 'Pallet' | 'Container';
  baseWidthMm: number;
  baseLengthMm: number;
  overallHeightMm: number;
  maxGrossWeightKg: number;
  standardHandlingEquipment: string;
  equipmentEnvelopeWidthMm: number;
  recommendedLateralMarginMm: number;
  citedStandard: string;
}

export interface AssessmentProject {
  projectId: string;
  projectName: string;
  projectNumber: string;
  facilityName: string;
  facilityAddress: string;
  countryOfOperation: string;
  principalPlaceOfBusiness: string;
  facilityManager: string;
  organizationDetails: string;
  assessmentDate: string;
  revision: string;
  intendedMaintenanceActivities: string;
  uldTypesHandled: string[];
  activeUldProfileId: string;
  intendedApprovalScope: string;
  approvalStatus: string;
  intendedAuthorityRoute: string;
  authorityDeterminationVerified: boolean;
  assessmentLimitations: string;
  assumptions: string;
  modelFileName: string;
  modelFingerprint: string;
  revitVersion: string;
  isDemoData: boolean;
}

export interface BimElement {
  elementId: number;
  uniqueId: string;
  category: 'Room' | 'Door' | 'Equipment' | 'Wall';
  name: string;
  familyName: string;
  typeName: string;
  level: string;
  roomName?: string;
  roomNumber?: string;
  areaSqM?: number;
  widthMm?: number;
  heightMm?: number;
  clearWidthMm?: number;
  clearOpeningVerified?: boolean;
  clearOpeningMeasurementSource?: 'RevitParameter' | 'FrameDeduction' | 'NominalFallback' | 'LaserVerified';
  coordinates: { x: number; y: number; z: number };
  dimensions: { width: number; depth: number; height: number };
  parameters: Record<string, string>;
  isMissingRequiredParameters?: boolean;
  missingParameterNames?: string[];
}

export interface Finding {
  findingId: string;
  ruleId: string;
  requirementId: string;
  regulatoryReference: string;
  sourceDocument: string;
  sourceUrl?: string;
  classification: RegulatoryClassification;
  category: string;
  status: ComplianceStatus;
  severity: SeverityLevel;
  affectedRoomOrZone: string;
  revitElementId?: number;
  revitUniqueId?: string;
  revitCategory?: string;
  measuredValue?: string;
  requiredValue?: string;
  assumptionsApplied?: string;
  description: string;
  explanation: string;
  evidenceReviewed: string;
  missingEvidence?: string;
  recommendedCorrectiveAction: string;
  verificationMethod: string;
  confidenceAndLimitations: string;
  assessorOrRule: string;
  timestamp: string;
  reviewerDecision: ReviewerDecision;
  reviewerOverrides?: ReviewerOverride[];
  isDemoData?: boolean;
}

export interface RequirementRecord {
  requirementId: string;
  regulationName: string;
  sectionReference: string;
  classification: RegulatoryClassification;
  sourceDocumentTitle: string;
  officialSourceUrl: string;
  sourceRevisionDate: string;
  lastVerifiedDate: string;
  isUnverified: boolean;
  summary: string;
  originalTextExtract: string;
  applicabilityConditions: string;
  assessmentMethod: AssessmentMethod;
  requiredEvidence: string;
  relatedBimCategories: string[];
  applicability: ApplicabilityState;
  applicabilityJustification: string;
  requiresHumanReview: boolean;
  confidenceStatus: string;
}

export interface RuleDefinition {
  ruleId: string;
  title: string;
  applicableClause: string;
  sourceDocument: string;
  sourceUrl: string;
  sourceRevisionDate: string;
  lastVerifiedDate: string;
  classification: RegulatoryClassification;
  isUnverified: boolean;
  approvalScope: string;
  applicabilityConditions: string;
  requiredEvidence: string;
  assessmentMethod: AssessmentMethod;
  limitations: string;
  evaluationType: string;
  defaultSeverity: SeverityLevel;
  isEnabled: boolean;
  version: string;
  priorVersion?: string;
  isOutdatedSource?: boolean;
  configurableParameters?: Record<string, ConfigurableParameter>;
  expectedOutcome: string;
}

export interface RuleLibraryCatalog {
  catalogVersion: string;
  publishedDate: string;
  lastAuditDate: string;
  regulatoryBaseline: string;
  authoritativeSources: { title: string; url: string; edition: string }[];
  changelog: { version: string; date: string; changes: string[] }[];
  rules: RuleDefinition[];
}

export interface EvidenceItem {
  evidenceId: string;
  type: string;
  title: string;
  fileReferenceOrLocation: string;
  sourceDate: string;
  reviewer: string;
  verificationStatus: string;
  relatedRequirementId: string;
  relatedRevitUniqueId?: string;
  comments: string;
}

export interface CorrectiveAction {
  actionId: string;
  findingId: string;
  description: string;
  responsiblePerson: string;
  targetDate: string;
  status: 'Open' | 'InProgress' | 'PendingRetest' | 'VerifiedClosed' | 'Rejected';
  requiredCompletionEvidence: string;
  verificationMethod: string;
  retestResult: string;
  closureReviewer?: string;
  closureDate?: string;
}

export interface ModelCompletenessReport {
  elementsInspected: number;
  elementsExcluded: number;
  roomsInspected: number;
  doorsInspected: number;
  equipmentInspected: number;
  missingRequiredParameterCount: number;
  unidentifiedRooms: string[];
  unidentifiedEquipment: string[];
  incompleteChecks: string[];
  modelLimitations: string[];
  overallCompletenessScore: number;
}
