export type UserRole = 'RESIDENT' | 'VERIFIER' | 'ENGINEER' | 'MANAGER' | 'ADMIN' | 'PROVIDER_MANAGER' | 'SYSTEM_ADMINISTRATOR';

export type ReportStatus = 
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'NEEDS_INFORMATION'
  | 'VERIFIED'
  | 'LINKED_TO_INCIDENT'
  | 'REJECTED'
  | 'CANCELLED';

export type IncidentStatus = 
  | 'OPEN'
  | 'VERIFICATION_PENDING'
  | 'VERIFIED'
  | 'PRIORITIZED'
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'EN_ROUTE'
  | 'IN_PROGRESS'
  | 'RESOLUTION_PENDING'
  | 'RESOLVED'
  | 'REOPENED'
  | 'CLOSED'
  | 'CANCELLED';

export type IncidentPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL' | 'EMERGENCY';
export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type HazardLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'SAFETY_CRITICAL';

export type AssignmentStatus = 'OFFERED' | 'ACCEPTED' | 'DECLINED' | 'REASSIGNED' | 'COMPLETED';

export type WorkUpdateStatus = 'EN_ROUTE' | 'IN_PROGRESS' | 'BLOCKED' | 'NOTE' | 'RESOLUTION_PENDING';

export type ResolutionOutcome = 
  | 'REPAIR_COMPLETED'
  | 'COMPONENT_REPLACED'
  | 'LINE_RESTORED'
  | 'TEMPORARY_REPAIR'
  | 'CLEARANCE_CONFIRMED';

export type AccountStatus = 
  | 'ACTIVE' 
  | 'PENDING_APPROVAL' 
  | 'PENDING_VERIFICATION' 
  | 'APPROVED' 
  | 'REJECTED' 
  | 'SUSPENDED' 
  | 'DEACTIVATED';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  organizationId?: string;
  teamId?: string;
  status: AccountStatus;
  avatar?: string;
  district?: string;
  subArea?: string;
  professionalId?: string;
  serviceArea?: string;
  applicationNotes?: string;
  applicationReviewedAt?: string;
  applicationReviewedBy?: string;
  rejectionReason?: string;
  passwordHash?: string;
  createdAt: string;
}

export interface EngineerApplication {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  professionalId: string;
  organizationId: string;
  serviceArea: string;
  notes: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
}

export interface Organization {
  id: string;
  name: string;
  code: string;
  type: 'DISTRIBUTION_UTILITY' | 'CONTRACTOR' | 'TRANSMISSION_AGENCY';
  contactEmail: string;
  contactPhone: string;
  serviceAreas: string[];
  active: boolean;
}

export interface Team {
  id: string;
  name: string;
  organizationId: string;
  serviceArea: string;
  leadEngineerId?: string;
  memberIds: string[];
  active: boolean;
}

export interface LocationArea {
  id: string;
  region: string;
  district: string;
  subArea: string;
  namedPlace: string;
  latitude: number;
  longitude: number;
  active: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  residentLabel: string;
  hazardLevel: HazardLevel;
  defaultSeverity: IncidentSeverity;
  defaultPriority: IncidentPriority;
  safetyWarning?: string;
  active: boolean;
}

export interface Report {
  id: string;
  idempotencyKey?: string;
  reporterId: string;
  reporterName: string;
  reporterPhone: string;
  categoryId: string;
  categoryName: string;
  hazardLevel: HazardLevel;
  isSafetyCritical: boolean;
  description: string;
  symptoms?: string[];
  startTime: string;
  locationName: string;
  district: string;
  subArea?: string;
  latitude: number;
  longitude: number;
  locationAccuracyMeters?: number;
  photoUrl?: string;
  meterNumber?: string;
  accountReference?: string;
  status: ReportStatus;
  linkedIncidentId?: string;
  rejectionReason?: string;
  infoRequestedReason?: string;
  additionalInfoProvided?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Incident {
  id: string;
  title: string;
  categoryId: string;
  categoryName: string;
  description: string;
  severity: IncidentSeverity;
  priority: IncidentPriority;
  status: IncidentStatus;
  locationName: string;
  district: string;
  subArea?: string;
  latitude: number;
  longitude: number;
  affectedRadiusMeters: number;
  affectedCustomersEst: number;
  organizationId?: string;
  teamId?: string;
  engineerId?: string;
  engineerName?: string;
  assignedAt?: string;
  primaryReportId: string;
  relatedReportIds: string[];
  reopenCount: number;
  resolutionOutcome?: ResolutionOutcome;
  resolutionNote?: string;
  resolutionEvidenceUrl?: string;
  resolutionSubmittedAt?: string;
  residentConfirmationStatus?: 'PENDING' | 'CONFIRMED' | 'DISPUTED';
  residentDisputeReason?: string;
  residentFeedbackRating?: number;
  residentFeedbackComment?: string;
  slaAcknowledgementTargetMin: number;
  slaAssignmentTargetMin: number;
  slaResolutionTargetMin: number;
  isOverdue?: boolean;
  escalationLevel?: number;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  closedAt?: string;
}

export interface Assignment {
  id: string;
  incidentId: string;
  organizationId: string;
  teamId?: string;
  engineerId: string;
  engineerName: string;
  status: AssignmentStatus;
  declineReason?: string;
  notes?: string;
  assignedAt: string;
  acceptedAt?: string;
  declinedAt?: string;
  completedAt?: string;
  assignedBy: string;
}

export interface WorkUpdate {
  id: string;
  incidentId: string;
  engineerId: string;
  engineerName: string;
  status: WorkUpdateStatus;
  note: string;
  evidenceUrl?: string;
  latitude?: number;
  longitude?: number;
  createdAt: string;
}

export interface ResolutionEvidence {
  id: string;
  incidentId: string;
  engineerId: string;
  engineerName: string;
  outcome: ResolutionOutcome;
  note: string;
  photoUrl?: string;
  additionalNotes?: string;
  createdAt: string;
}

export interface StatusHistory {
  id: string;
  entityType: 'REPORT' | 'INCIDENT' | 'ASSIGNMENT';
  entityId: string;
  previousStatus: string;
  newStatus: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  reason?: string;
  evidenceUrl?: string;
  timestamp: string;
}

export interface Notification {
  id: string;
  recipientId: string;
  recipientRole: UserRole;
  district?: string;
  eventType: string;
  title: string;
  body: string;
  reportId?: string;
  incidentId?: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  isRead: boolean;
  actionUrl?: string;
  createdAt: string;
}

export interface Feedback {
  id: string;
  incidentId: string;
  reportId: string;
  residentId: string;
  rating: number;
  restoredSuccessfully: boolean;
  comments?: string;
  createdAt: string;
}

export interface AuditEvent {
  id: string;
  action: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  targetType: string;
  targetId: string;
  details?: string;
  timestamp: string;
}

export interface SlaPolicy {
  priority: IncidentPriority;
  acknowledgementTargetMinutes: number;
  assignmentTargetMinutes: number;
  resolutionTargetMinutes: number;
}
