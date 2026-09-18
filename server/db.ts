import fs from 'fs';
import path from 'path';
import {
  User,
  Organization,
  Team,
  LocationArea,
  Category,
  Report,
  Incident,
  Assignment,
  WorkUpdate,
  ResolutionEvidence,
  StatusHistory,
  Notification,
  Feedback,
  AuditEvent,
  SlaPolicy,
  UserRole
} from './types.js';
import { hashPassword } from './auth-utils.js';

interface DatabaseSchema {
  users: User[];
  organizations: Organization[];
  teams: Team[];
  locations: LocationArea[];
  categories: Category[];
  reports: Report[];
  incidents: Incident[];
  assignments: Assignment[];
  workUpdates: WorkUpdate[];
  resolutionEvidence: ResolutionEvidence[];
  statusHistory: StatusHistory[];
  notifications: Notification[];
  feedbacks: Feedback[];
  auditEvents: AuditEvent[];
  slaPolicies: SlaPolicy[];
}

const DATA_DIR = path.join(process.cwd(), 'server', 'data');
const STORE_PATH = path.join(DATA_DIR, 'store.json');

const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'cat-outage-total',
    name: 'Total Power Outage',
    slug: 'power-outage',
    residentLabel: 'Power is completely off (Blackout)',
    description: 'Complete absence of electricity at consumer premises or across neighborhood.',
    hazardLevel: 'LOW',
    defaultSeverity: 'CRITICAL',
    defaultPriority: 'CRITICAL',
    active: true
  },
  {
    id: 'cat-fallen-wire',
    name: 'Fallen Power Line',
    slug: 'fallen-line',
    residentLabel: 'Fallen live wire / cable on ground',
    description: 'High or medium voltage overhead cable dropped to ground, road, or structure.',
    hazardLevel: 'SAFETY_CRITICAL',
    defaultSeverity: 'CRITICAL',
    defaultPriority: 'EMERGENCY',
    safetyWarning: 'EXTREME DANGER: Stay at least 15 meters (50 feet) away! Do NOT touch vehicles or puddles near the line.',
    active: true
  },
  {
    id: 'cat-broken-wire',
    name: 'Broken or Exposed Wire',
    slug: 'broken-wire',
    residentLabel: 'Damaged or exposed wire sparking/dangling',
    description: 'Exposed insulation, severed conductor, or sparking drop line near residential roof/verandah.',
    hazardLevel: 'SAFETY_CRITICAL',
    defaultSeverity: 'HIGH',
    defaultPriority: 'EMERGENCY',
    safetyWarning: 'SAFETY WARNING: Keep all children and bystanders clear of the structure. Do not use metal sticks or water.',
    active: true
  },
  {
    id: 'cat-damaged-transformer',
    name: 'Damaged Transformer',
    slug: 'damaged-transformer',
    residentLabel: 'Transformer smoking, leaking, or making loud hums',
    description: 'Pole-mounted or ground distribution transformer experiencing dielectric failure, humming loudly, or smoking.',
    hazardLevel: 'SAFETY_CRITICAL',
    defaultSeverity: 'CRITICAL',
    defaultPriority: 'HIGH',
    safetyWarning: 'Do not approach the transformer perimeter fence. Avoid inhaling fumes if burning oil is present.',
    active: true
  },
  {
    id: 'cat-sparks-fire',
    name: 'Sparks / Electrical Fire',
    slug: 'sparks-fire',
    residentLabel: 'Sparks or active fire at pole / meter box',
    description: 'Active electrical arcing, glowing junctions, or flame on electrical hardware.',
    hazardLevel: 'SAFETY_CRITICAL',
    defaultSeverity: 'CRITICAL',
    defaultPriority: 'EMERGENCY',
    safetyWarning: 'DANGER: Never use water on an energized electrical fire. Alert occupants and keep distance.',
    active: true
  },
  {
    id: 'cat-damaged-pole',
    name: 'Damaged or Leaning Pole',
    slug: 'damaged-pole',
    residentLabel: 'Electric pole broken, cracked, or leaning over',
    description: 'Wooden or concrete utility pole fractured by storm, vehicle impact, or soil erosion.',
    hazardLevel: 'HIGH',
    defaultSeverity: 'HIGH',
    defaultPriority: 'HIGH',
    safetyWarning: 'Avoid standing or driving beneath a leaning pole with heavy conductor tension.',
    active: true
  },
  {
    id: 'cat-low-voltage',
    name: 'Low Voltage / Unstable Supply',
    slug: 'low-voltage',
    residentLabel: 'Low voltage / Dim bulbs / Fluctuating power',
    description: 'Supply voltage dipping below 190V, causing electronic damage, humming refrigerators, or brownouts.',
    hazardLevel: 'MEDIUM',
    defaultSeverity: 'MEDIUM',
    defaultPriority: 'NORMAL',
    active: true
  },
  {
    id: 'cat-partial-outage',
    name: 'Partial / Single-Phase Outage',
    slug: 'partial-outage',
    residentLabel: 'Some rooms have power, others do not (Single phase lost)',
    description: 'Loss of one phase on 3-phase domestic feed or localized service drop clamp detachment.',
    hazardLevel: 'LOW',
    defaultSeverity: 'MEDIUM',
    defaultPriority: 'NORMAL',
    active: true
  },
  {
    id: 'cat-street-lighting',
    name: 'Street / Public Lighting Defect',
    slug: 'street-lighting',
    residentLabel: 'Public streetlight not working or broken fixture',
    description: 'Public municipal lighting failure or day-burning fixtures along thoroughfares.',
    hazardLevel: 'LOW',
    defaultSeverity: 'LOW',
    defaultPriority: 'LOW',
    active: true
  },
  {
    id: 'cat-other',
    name: 'Other Electricity Problem',
    slug: 'other',
    residentLabel: 'Other electrical issue not listed above',
    description: 'Other electricity problem requiring utility dispatch attention.',
    hazardLevel: 'LOW',
    defaultSeverity: 'LOW',
    defaultPriority: 'NORMAL',
    active: true
  }
];

const INITIAL_ORGANIZATIONS: Organization[] = [
  {
    id: 'org-uedcl-kigezi',
    name: 'Uganda Electricity Distribution Co. Ltd (UEDCL Kigezi Region)',
    code: 'UEDCL-KBL',
    type: 'DISTRIBUTION_UTILITY',
    contactEmail: 'kigezi-dispatch@powerpulse.demo',
    contactPhone: '+256 486 422 101',
    serviceAreas: ['Kabale Municipality', 'Kisoro District', 'Rukungiri District', 'Ntungamo District'],
    active: true
  },
  {
    id: 'org-kbl-contractor',
    name: 'Kigezi High Voltage Lines & Substations Ltd',
    code: 'KHVL',
    type: 'CONTRACTOR',
    contactEmail: 'ops@kigezivoltage.demo',
    contactPhone: '+256 772 900 112',
    serviceAreas: ['Kabale Municipality', 'Rubanda'],
    active: true
  }
];

const INITIAL_TEAMS: Team[] = [
  {
    id: 'team-kbl-rapid',
    name: 'Kabale Rapid Response Unit Alpha',
    organizationId: 'org-uedcl-kigezi',
    serviceArea: 'Kabale Municipality',
    leadEngineerId: 'usr-eng-1',
    memberIds: ['usr-eng-1', 'usr-eng-2'],
    active: true
  },
  {
    id: 'team-kbl-substation',
    name: 'Kikungiri Substation & Heavy Maintenance',
    organizationId: 'org-uedcl-kigezi',
    serviceArea: 'Kabale Rural & Industrial',
    leadEngineerId: 'usr-eng-2',
    memberIds: ['usr-eng-2'],
    active: true
  },
  {
    id: 'team-ksr-emergency',
    name: 'Kisoro Border Line Response Crew',
    organizationId: 'org-uedcl-kigezi',
    serviceArea: 'Kisoro District',
    memberIds: [],
    active: true
  }
];

const INITIAL_LOCATIONS: LocationArea[] = [
  {
    id: 'loc-kbl-central',
    region: 'Western Region (Kigezi)',
    district: 'Kabale',
    subArea: 'Kabale Central',
    namedPlace: 'Kabale Main Roundabout & Central Market',
    latitude: -1.2508,
    longitude: 29.9892,
    active: true
  },
  {
    id: 'loc-kbl-kigongi',
    region: 'Western Region (Kigezi)',
    district: 'Kabale',
    subArea: 'Kigongi Ward',
    namedPlace: 'Kigongi Main Street & Health Centre',
    latitude: -1.2461,
    longitude: 29.9845,
    active: true
  },
  {
    id: 'loc-kbl-rushoroza',
    region: 'Western Region (Kigezi)',
    district: 'Kabale',
    subArea: 'Rushoroza',
    namedPlace: 'Rushoroza Cathedral Hill & Hospital',
    latitude: -1.2612,
    longitude: 29.9754,
    active: true
  },
  {
    id: 'loc-kbl-katuna-rd',
    region: 'Western Region (Kigezi)',
    district: 'Kabale',
    subArea: 'Katuna Highway Corridor',
    namedPlace: 'Katuna Road Junction & Customs Post',
    latitude: -1.2589,
    longitude: 30.0012,
    active: true
  },
  {
    id: 'loc-kbl-kikungiri',
    region: 'Western Region (Kigezi)',
    district: 'Kabale',
    subArea: 'Kikungiri Hill',
    namedPlace: 'Kabale University Main Campus Gates',
    latitude: -1.2721,
    longitude: 30.0125,
    active: true
  },
  {
    id: 'loc-ksr-center',
    region: 'Western Region (Kigezi)',
    district: 'Kisoro',
    subArea: 'Kisoro Town Council',
    namedPlace: 'Kisoro Central Bus Park',
    latitude: -1.2825,
    longitude: 29.6914,
    active: true
  },
  {
    id: 'loc-rkg-center',
    region: 'Western Region (Kigezi)',
    district: 'Rukungiri',
    subArea: 'Rukungiri Municipality',
    namedPlace: 'Rukungiri Main Street & Bank Row',
    latitude: -0.8415,
    longitude: 29.9419,
    active: true
  }
];

const INITIAL_USERS: User[] = [
  {
    id: 'usr-res-1',
    name: 'Florence Ainembabazi',
    email: 'resident@powerpulse.demo',
    phone: '+256 772 100 201',
    role: 'RESIDENT',
    status: 'ACTIVE',
    district: 'Kabale',
    subArea: 'Kigongi Ward',
    passwordHash: hashPassword('demo1234'),
    createdAt: '2026-09-01T08:00:00Z'
  },
  {
    id: 'usr-res-2',
    name: 'Denis Mukasa',
    email: 'resident2@powerpulse.demo',
    phone: '+256 701 445 922',
    role: 'RESIDENT',
    status: 'ACTIVE',
    district: 'Kabale',
    subArea: 'Kabale Central',
    passwordHash: hashPassword('demo1234'),
    createdAt: '2026-09-02T09:30:00Z'
  },
  {
    id: 'usr-ops-1',
    name: 'Sarah Tumusiime',
    email: 'ops@powerpulse.demo',
    phone: '+256 782 500 310',
    role: 'VERIFIER',
    organizationId: 'org-uedcl-kigezi',
    district: 'Kabale',
    status: 'ACTIVE',
    passwordHash: hashPassword('demo1234'),
    createdAt: '2026-08-15T07:00:00Z'
  },
  {
    id: 'usr-eng-1',
    name: 'Eng. David Kigozi',
    email: 'engineer@powerpulse.demo',
    phone: '+256 774 990 123',
    role: 'ENGINEER',
    organizationId: 'org-uedcl-kigezi',
    district: 'Kabale',
    teamId: 'team-kbl-rapid',
    status: 'ACTIVE',
    passwordHash: hashPassword('demo1234'),
    createdAt: '2026-08-15T07:00:00Z'
  },
  {
    id: 'usr-eng-2',
    name: 'Eng. Grace Atuhaire',
    email: 'engineer2@powerpulse.demo',
    phone: '+256 702 331 845',
    role: 'ENGINEER',
    organizationId: 'org-uedcl-kigezi',
    district: 'Kabale',
    teamId: 'team-kbl-substation',
    status: 'ACTIVE',
    passwordHash: hashPassword('demo1234'),
    createdAt: '2026-08-16T08:00:00Z'
  },
  {
    id: 'usr-mgr-1',
    name: 'Arthur Byamukama',
    email: 'manager@powerpulse.demo',
    phone: '+256 772 888 404',
    role: 'MANAGER',
    organizationId: 'org-uedcl-kigezi',
    district: 'Kabale',
    status: 'ACTIVE',
    passwordHash: hashPassword('demo1234'),
    createdAt: '2026-08-10T06:00:00Z'
  },
  {
    id: 'usr-adm-1',
    name: 'Emmanuel Twinomujuni',
    email: 'admin@powerpulse.demo',
    phone: '+256 788 001 999',
    role: 'ADMIN',
    district: 'Kabale',
    status: 'ACTIVE',
    passwordHash: hashPassword('demo1234'),
    createdAt: '2026-08-01T05:00:00Z'
  },
  {
    id: 'usr-eng-app-1',
    name: 'Apollo Katembeko',
    email: 'applicant@powerpulse.demo',
    phone: '+256 782 114 883',
    role: 'ENGINEER',
    organizationId: 'org-uedcl-kigezi',
    district: 'Kabale',
    status: 'PENDING_APPROVAL',
    professionalId: 'ERA-CERT-2024-8819',
    serviceArea: 'Kabale Municipality & Rubanda',
    applicationNotes: 'Certified Class B electrical technician with 4 years 11kV line maintenance experience with ERA accreditation.',
    passwordHash: hashPassword('demo1234'),
    createdAt: '2026-09-13T14:00:00Z'
  },
  {
    id: 'usr-susp-1',
    name: 'Samson Byarugaba',
    email: 'suspended@powerpulse.demo',
    phone: '+256 701 999 111',
    role: 'RESIDENT',
    district: 'Kabale',
    status: 'SUSPENDED',
    passwordHash: hashPassword('demo1234'),
    createdAt: '2026-08-20T10:00:00Z'
  },
  {
    id: 'usr-eng-deact',
    name: 'Patrick Tumuhimbise (Deactivated)',
    email: 'deactivated.engineer@powerpulse.demo',
    phone: '+256 774 000 111',
    role: 'ENGINEER',
    organizationId: 'org-uedcl-kigezi',
    district: 'Kabale',
    status: 'DEACTIVATED',
    passwordHash: hashPassword('demo1234'),
    createdAt: '2026-07-01T08:00:00Z'
  }
];

const INITIAL_SLA_POLICIES: SlaPolicy[] = [
  { priority: 'EMERGENCY', acknowledgementTargetMinutes: 10, assignmentTargetMinutes: 15, resolutionTargetMinutes: 120 },
  { priority: 'CRITICAL', acknowledgementTargetMinutes: 20, assignmentTargetMinutes: 30, resolutionTargetMinutes: 240 },
  { priority: 'HIGH', acknowledgementTargetMinutes: 45, assignmentTargetMinutes: 60, resolutionTargetMinutes: 480 },
  { priority: 'NORMAL', acknowledgementTargetMinutes: 90, assignmentTargetMinutes: 180, resolutionTargetMinutes: 1440 },
  { priority: 'LOW', acknowledgementTargetMinutes: 180, assignmentTargetMinutes: 360, resolutionTargetMinutes: 2880 }
];

const INITIAL_REPORTS: Report[] = [
  {
    id: 'PP-RPT-2026-000101',
    reporterId: 'usr-res-1',
    reporterName: 'Florence Ainembabazi',
    reporterPhone: '+256 772 100 201',
    categoryId: 'cat-outage-total',
    categoryName: 'Total Power Outage',
    hazardLevel: 'LOW',
    isSafetyCritical: false,
    description: 'The whole street lost power suddenly around 4:00 PM during the light drizzle. Refrigerator and lights all died together.',
    symptoms: ['Complete blackout', 'Street pitch black'],
    startTime: '2026-09-14T06:00:00Z',
    locationName: 'Kigongi Ward, Kabale Central',
    district: 'Kabale',
    subArea: 'Kigongi Ward',
    latitude: -1.2461,
    longitude: 29.9845,
    locationAccuracyMeters: 8,
    status: 'LINKED_TO_INCIDENT',
    linkedIncidentId: 'PP-INC-2026-0012',
    createdAt: '2026-09-14T06:15:00Z',
    updatedAt: '2026-09-14T06:45:00Z'
  },
  {
    id: 'PP-RPT-2026-000102',
    reporterId: 'usr-res-2',
    reporterName: 'Denis Mukasa',
    reporterPhone: '+256 701 445 922',
    categoryId: 'cat-outage-total',
    categoryName: 'Total Power Outage',
    hazardLevel: 'LOW',
    isSafetyCritical: false,
    description: 'Neighboring shop also has zero power here near Kigongi clinic. Please restore supply before nightfall.',
    symptoms: ['Commercial refrigerators stopped', 'Neighbors affected'],
    startTime: '2026-09-14T06:05:00Z',
    locationName: 'Kigongi Health Centre Area, Kabale',
    district: 'Kabale',
    subArea: 'Kigongi Ward',
    latitude: -1.2465,
    longitude: 29.9851,
    locationAccuracyMeters: 12,
    status: 'LINKED_TO_INCIDENT',
    linkedIncidentId: 'PP-INC-2026-0012',
    createdAt: '2026-09-14T06:22:00Z',
    updatedAt: '2026-09-14T06:48:00Z'
  },
  {
    id: 'PP-RPT-2026-000103',
    reporterId: 'usr-res-1',
    reporterName: 'Florence Ainembabazi',
    reporterPhone: '+256 772 100 201',
    categoryId: 'cat-fallen-wire',
    categoryName: 'Fallen Power Line',
    hazardLevel: 'SAFETY_CRITICAL',
    isSafetyCritical: true,
    description: 'High wind knocked a tree branch onto the 11kV conductor along Rushoroza Hill. Live cable is hanging 1 meter over the pedestrian pathway!',
    symptoms: ['Live line swinging', 'Sparks on damp grass'],
    startTime: '2026-09-14T08:10:00Z',
    locationName: 'Rushoroza Cathedral Hill, Kabale',
    district: 'Kabale',
    subArea: 'Rushoroza',
    latitude: -1.2612,
    longitude: 29.9754,
    locationAccuracyMeters: 5,
    status: 'LINKED_TO_INCIDENT',
    linkedIncidentId: 'PP-INC-2026-0014',
    createdAt: '2026-09-14T08:14:00Z',
    updatedAt: '2026-09-14T08:20:00Z'
  },
  {
    id: 'PP-RPT-2026-000104',
    reporterId: 'usr-res-2',
    reporterName: 'Denis Mukasa',
    reporterPhone: '+256 701 445 922',
    categoryId: 'cat-damaged-transformer',
    categoryName: 'Damaged Transformer',
    hazardLevel: 'SAFETY_CRITICAL',
    isSafetyCritical: true,
    description: 'The pole-mounted distribution transformer near Katuna Road junction made a loud explosion sound and oil is dripping down the wooden cross-arm.',
    symptoms: ['Loud bang', 'Oil leak visible'],
    startTime: '2026-09-14T07:30:00Z',
    locationName: 'Katuna Road Junction & Customs Post',
    district: 'Kabale',
    subArea: 'Katuna Highway Corridor',
    latitude: -1.2589,
    longitude: 30.0012,
    status: 'SUBMITTED',
    createdAt: '2026-09-14T07:45:00Z',
    updatedAt: '2026-09-14T07:45:00Z'
  },
  {
    id: 'PP-RPT-2026-000105',
    reporterId: 'usr-res-1',
    reporterName: 'Florence Ainembabazi',
    reporterPhone: '+256 772 100 201',
    categoryId: 'cat-low-voltage',
    categoryName: 'Low Voltage / Unstable Supply',
    hazardLevel: 'MEDIUM',
    isSafetyCritical: false,
    description: 'Voltage dropped so low that energy bulbs only glow orange. Voltage measured at 165V with multimeter.',
    symptoms: ['Flickering bulbs', 'Electronics shutting off'],
    startTime: '2026-09-14T09:00:00Z',
    locationName: 'Kabale University Gate, Kikungiri',
    district: 'Kabale',
    subArea: 'Kikungiri Hill',
    latitude: -1.2721,
    longitude: 30.0125,
    status: 'SUBMITTED',
    createdAt: '2026-09-14T09:12:00Z',
    updatedAt: '2026-09-14T09:12:00Z'
  }
];

const INITIAL_INCIDENTS: Incident[] = [
  {
    id: 'PP-INC-2026-0012',
    title: 'Kigongi Feeder Phase Trip & Blackout',
    categoryId: 'cat-outage-total',
    categoryName: 'Total Power Outage',
    description: 'Widespread low-voltage grid outage across Kigongi Ward following primary feeder circuit-breaker trip.',
    severity: 'CRITICAL',
    priority: 'CRITICAL',
    status: 'IN_PROGRESS',
    locationName: 'Kigongi Ward, Kabale Central',
    district: 'Kabale',
    subArea: 'Kigongi Ward',
    latitude: -1.2461,
    longitude: 29.9845,
    affectedRadiusMeters: 800,
    affectedCustomersEst: 420,
    organizationId: 'org-uedcl-kigezi',
    teamId: 'team-kbl-rapid',
    engineerId: 'usr-eng-1',
    engineerName: 'Eng. David Kigozi',
    assignedAt: '2026-09-14T06:40:00Z',
    primaryReportId: 'PP-RPT-2026-000101',
    relatedReportIds: ['PP-RPT-2026-000101', 'PP-RPT-2026-000102'],
    reopenCount: 0,
    slaAcknowledgementTargetMin: 20,
    slaAssignmentTargetMin: 30,
    slaResolutionTargetMin: 240,
    createdAt: '2026-09-14T06:30:00Z',
    updatedAt: '2026-09-14T07:15:00Z'
  },
  {
    id: 'PP-INC-2026-0014',
    title: 'Downed 11kV Overhead Cable across Rushoroza Pathway',
    categoryId: 'cat-fallen-wire',
    categoryName: 'Fallen Power Line',
    description: 'High-voltage conductor severed by eucalyptus limb. Public safety risk on access road to cathedral & hospital.',
    severity: 'CRITICAL',
    priority: 'EMERGENCY',
    status: 'ASSIGNED',
    locationName: 'Rushoroza Cathedral Hill, Kabale',
    district: 'Kabale',
    subArea: 'Rushoroza',
    latitude: -1.2612,
    longitude: 29.9754,
    affectedRadiusMeters: 250,
    affectedCustomersEst: 65,
    organizationId: 'org-uedcl-kigezi',
    teamId: 'team-kbl-rapid',
    engineerId: 'usr-eng-1',
    engineerName: 'Eng. David Kigozi',
    assignedAt: '2026-09-14T08:25:00Z',
    primaryReportId: 'PP-RPT-2026-000103',
    relatedReportIds: ['PP-RPT-2026-000103'],
    reopenCount: 0,
    slaAcknowledgementTargetMin: 10,
    slaAssignmentTargetMin: 15,
    slaResolutionTargetMin: 120,
    createdAt: '2026-09-14T08:20:00Z',
    updatedAt: '2026-09-14T08:25:00Z'
  },
  {
    id: 'PP-INC-2026-0010',
    title: 'Kabale Central Market Transformer Neutral Fault',
    categoryId: 'cat-damaged-transformer',
    categoryName: 'Damaged Transformer',
    description: 'Floating neutral fault burned out service fuses for market stalls.',
    severity: 'HIGH',
    priority: 'HIGH',
    status: 'CLOSED',
    locationName: 'Kabale Main Roundabout & Central Market',
    district: 'Kabale',
    subArea: 'Kabale Central',
    latitude: -1.2508,
    longitude: 29.9892,
    affectedRadiusMeters: 400,
    affectedCustomersEst: 180,
    organizationId: 'org-uedcl-kigezi',
    teamId: 'team-kbl-substation',
    engineerId: 'usr-eng-2',
    engineerName: 'Eng. Grace Atuhaire',
    assignedAt: '2026-09-13T10:00:00Z',
    primaryReportId: 'PP-RPT-2026-000095',
    relatedReportIds: ['PP-RPT-2026-000095'],
    reopenCount: 0,
    resolutionOutcome: 'COMPONENT_REPLACED',
    resolutionNote: 'Replaced neutral bonding clamp and renewed HT drop-out fuses. Load test verified 238V balance.',
    resolutionSubmittedAt: '2026-09-13T13:30:00Z',
    residentConfirmationStatus: 'CONFIRMED',
    residentFeedbackRating: 5,
    residentFeedbackComment: 'Power returned cleanly. Good communication from dispatch.',
    slaAcknowledgementTargetMin: 45,
    slaAssignmentTargetMin: 60,
    slaResolutionTargetMin: 480,
    createdAt: '2026-09-13T09:40:00Z',
    updatedAt: '2026-09-13T14:15:00Z',
    resolvedAt: '2026-09-13T13:30:00Z',
    closedAt: '2026-09-13T14:15:00Z'
  },
  {
    id: 'PP-INC-2026-0011',
    title: 'Kikungiri Campus Spur Line Sparking Defect',
    categoryId: 'cat-sparks-fire',
    categoryName: 'Sparks / Electrical Fire',
    description: 'Arcing connector on terminal pole supplying academic buildings.',
    severity: 'HIGH',
    priority: 'HIGH',
    status: 'REOPENED',
    locationName: 'Kabale University Main Campus Gates',
    district: 'Kabale',
    subArea: 'Kikungiri Hill',
    latitude: -1.2721,
    longitude: 30.0125,
    affectedRadiusMeters: 300,
    affectedCustomersEst: 120,
    organizationId: 'org-uedcl-kigezi',
    teamId: 'team-kbl-rapid',
    engineerId: 'usr-eng-1',
    engineerName: 'Eng. David Kigozi',
    assignedAt: '2026-09-14T05:00:00Z',
    primaryReportId: 'PP-RPT-2026-000098',
    relatedReportIds: ['PP-RPT-2026-000098'],
    reopenCount: 1,
    resolutionOutcome: 'TEMPORARY_REPAIR',
    resolutionNote: 'Insulated bypass jumper installed on phase B.',
    resolutionSubmittedAt: '2026-09-14T06:00:00Z',
    residentConfirmationStatus: 'DISPUTED',
    residentDisputeReason: 'Sparks returned immediately when night campus floodlights switched on. Transformer still humming loudly.',
    slaAcknowledgementTargetMin: 45,
    slaAssignmentTargetMin: 60,
    slaResolutionTargetMin: 480,
    createdAt: '2026-09-14T04:30:00Z',
    updatedAt: '2026-09-14T07:05:00Z'
  }
];

const INITIAL_ASSIGNMENTS: Assignment[] = [
  {
    id: 'asg-001',
    incidentId: 'PP-INC-2026-0012',
    organizationId: 'org-uedcl-kigezi',
    teamId: 'team-kbl-rapid',
    engineerId: 'usr-eng-1',
    engineerName: 'Eng. David Kigozi',
    status: 'ACCEPTED',
    notes: 'Urgent municipal feeder fault. Dispatched with boom truck and fuse kit.',
    assignedAt: '2026-09-14T06:40:00Z',
    acceptedAt: '2026-09-14T06:44:00Z',
    assignedBy: 'Sarah Tumusiime (Operations Controller)'
  },
  {
    id: 'asg-002',
    incidentId: 'PP-INC-2026-0014',
    organizationId: 'org-uedcl-kigezi',
    teamId: 'team-kbl-rapid',
    engineerId: 'usr-eng-1',
    engineerName: 'Eng. David Kigozi',
    status: 'OFFERED',
    notes: 'EMERGENCY: Fallen line on pedestrian route near Rushoroza Cathedral. Ensure isolation first.',
    assignedAt: '2026-09-14T08:25:00Z',
    assignedBy: 'Sarah Tumusiime (Operations Controller)'
  }
];

const INITIAL_WORK_UPDATES: WorkUpdate[] = [
  {
    id: 'wu-001',
    incidentId: 'PP-INC-2026-0012',
    engineerId: 'usr-eng-1',
    engineerName: 'Eng. David Kigozi',
    status: 'EN_ROUTE',
    note: 'Team Alpha mobilised with service vehicle UBG 412K. En route to Kigongi Ward substation.',
    createdAt: '2026-09-14T06:50:00Z'
  },
  {
    id: 'wu-002',
    incidentId: 'PP-INC-2026-0012',
    engineerId: 'usr-eng-1',
    engineerName: 'Eng. David Kigozi',
    status: 'IN_PROGRESS',
    note: 'Arrived at site. Isolated the 11kV section. Located cracked insulator pin on Pole #KBL-24. Preparing replacement assembly.',
    createdAt: '2026-09-14T07:15:00Z'
  }
];

const INITIAL_STATUS_HISTORY: StatusHistory[] = [
  {
    id: 'sh-001',
    entityType: 'REPORT',
    entityId: 'PP-RPT-2026-000101',
    previousStatus: 'NONE',
    newStatus: 'SUBMITTED',
    actorId: 'usr-res-1',
    actorName: 'Florence Ainembabazi',
    actorRole: 'RESIDENT',
    reason: 'Power blackout reported via mobile app',
    timestamp: '2026-09-14T06:15:00Z'
  },
  {
    id: 'sh-002',
    entityType: 'REPORT',
    entityId: 'PP-RPT-2026-000101',
    previousStatus: 'SUBMITTED',
    newStatus: 'VERIFIED',
    actorId: 'usr-ops-1',
    actorName: 'Sarah Tumusiime',
    actorRole: 'VERIFIER',
    reason: 'Corroborated with Kigongi sub-station SCADA feeder alarm',
    timestamp: '2026-09-14T06:30:00Z'
  },
  {
    id: 'sh-003',
    entityType: 'INCIDENT',
    entityId: 'PP-INC-2026-0012',
    previousStatus: 'NONE',
    newStatus: 'OPEN',
    actorId: 'usr-ops-1',
    actorName: 'Sarah Tumusiime',
    actorRole: 'VERIFIER',
    reason: 'Created operational incident from report PP-RPT-2026-000101',
    timestamp: '2026-09-14T06:30:00Z'
  },
  {
    id: 'sh-004',
    entityType: 'INCIDENT',
    entityId: 'PP-INC-2026-0012',
    previousStatus: 'OPEN',
    newStatus: 'ASSIGNED',
    actorId: 'usr-ops-1',
    actorName: 'Sarah Tumusiime',
    actorRole: 'VERIFIER',
    reason: 'Assigned to Team Alpha (Eng. David Kigozi)',
    timestamp: '2026-09-14T06:40:00Z'
  },
  {
    id: 'sh-005',
    entityType: 'INCIDENT',
    entityId: 'PP-INC-2026-0012',
    previousStatus: 'ASSIGNED',
    newStatus: 'ACCEPTED',
    actorId: 'usr-eng-1',
    actorName: 'Eng. David Kigozi',
    actorRole: 'ENGINEER',
    reason: 'Engineer accepted work order',
    timestamp: '2026-09-14T06:44:00Z'
  },
  {
    id: 'sh-006',
    entityType: 'REPORT',
    entityId: 'PP-RPT-2026-000102',
    previousStatus: 'SUBMITTED',
    newStatus: 'LINKED_TO_INCIDENT',
    actorId: 'usr-ops-1',
    actorName: 'Sarah Tumusiime',
    actorRole: 'VERIFIER',
    reason: 'Linked to active Kigongi incident PP-INC-2026-0012 as duplicate report',
    timestamp: '2026-09-14T06:48:00Z'
  },
  {
    id: 'sh-007',
    entityType: 'INCIDENT',
    entityId: 'PP-INC-2026-0012',
    previousStatus: 'ACCEPTED',
    newStatus: 'EN_ROUTE',
    actorId: 'usr-eng-1',
    actorName: 'Eng. David Kigozi',
    actorRole: 'ENGINEER',
    reason: 'Team mobilized and traveling to site',
    timestamp: '2026-09-14T06:50:00Z'
  },
  {
    id: 'sh-008',
    entityType: 'INCIDENT',
    entityId: 'PP-INC-2026-0012',
    previousStatus: 'EN_ROUTE',
    newStatus: 'IN_PROGRESS',
    actorId: 'usr-eng-1',
    actorName: 'Eng. David Kigozi',
    actorRole: 'ENGINEER',
    reason: 'Arrived at site and commenced hardware inspection & repair',
    timestamp: '2026-09-14T07:15:00Z'
  },
  {
    id: 'sh-009',
    entityType: 'INCIDENT',
    entityId: 'PP-INC-2026-0011',
    previousStatus: 'RESOLUTION_PENDING',
    newStatus: 'REOPENED',
    actorId: 'usr-res-2',
    actorName: 'Denis Mukasa',
    actorRole: 'RESIDENT',
    reason: 'Resident disputed restoration: Arcing sparks returned with evening electrical load',
    timestamp: '2026-09-14T07:05:00Z'
  }
];

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-001',
    recipientId: 'usr-res-1',
    recipientRole: 'RESIDENT',
    eventType: 'REPORT_VERIFIED',
    title: 'Your Report PP-RPT-2026-000101 was Verified',
    body: 'Operations verified your report and created Incident PP-INC-2026-0012. Response team assigned.',
    reportId: 'PP-RPT-2026-000101',
    incidentId: 'PP-INC-2026-0012',
    priority: 'HIGH',
    isRead: true,
    actionUrl: '/resident/reports/PP-RPT-2026-000101',
    createdAt: '2026-09-14T06:40:00Z'
  },
  {
    id: 'notif-002',
    recipientId: 'usr-eng-1',
    recipientRole: 'ENGINEER',
    eventType: 'ASSIGNMENT_RECEIVED',
    title: 'New Emergency Job Assigned',
    body: 'You have been assigned to PP-INC-2026-0014: Downed 11kV Overhead Cable at Rushoroza Hill.',
    incidentId: 'PP-INC-2026-0014',
    priority: 'CRITICAL',
    isRead: false,
    actionUrl: '/engineer/jobs/PP-INC-2026-0014',
    createdAt: '2026-09-14T08:25:00Z'
  },
  {
    id: 'notif-003',
    recipientId: 'usr-ops-1',
    recipientRole: 'VERIFIER',
    eventType: 'INCIDENT_REOPENED',
    title: 'Incident PP-INC-2026-0011 Reopened by Resident',
    body: 'Denis Mukasa reported power is still unavailable at Kikungiri Hill with active arcing.',
    incidentId: 'PP-INC-2026-0011',
    priority: 'HIGH',
    isRead: false,
    actionUrl: '/operations/incidents/PP-INC-2026-0011',
    createdAt: '2026-09-14T07:05:00Z'
  },
  {
    id: 'notif-004',
    recipientId: 'usr-res-2',
    recipientRole: 'RESIDENT',
    eventType: 'REPORT_LINKED',
    title: 'Report Linked to Active Incident',
    body: 'Your report PP-RPT-2026-000102 was grouped with active incident PP-INC-2026-0012.',
    reportId: 'PP-RPT-2026-000102',
    incidentId: 'PP-INC-2026-0012',
    priority: 'NORMAL',
    isRead: false,
    actionUrl: '/resident/reports/PP-RPT-2026-000102',
    createdAt: '2026-09-14T06:48:00Z'
  }
];

const INITIAL_AUDIT_EVENTS: AuditEvent[] = [
  {
    id: 'audit-001',
    action: 'INCIDENT_PRIORITY_UPDATED',
    actorId: 'usr-ops-1',
    actorName: 'Sarah Tumusiime',
    actorRole: 'VERIFIER',
    targetType: 'INCIDENT',
    targetId: 'PP-INC-2026-0014',
    details: 'Escalated priority to EMERGENCY due to safety-critical fallen live conductor on public pathway',
    timestamp: '2026-09-14T08:22:00Z'
  },
  {
    id: 'audit-002',
    action: 'ASSIGNMENT_CREATED',
    actorId: 'usr-ops-1',
    actorName: 'Sarah Tumusiime',
    actorRole: 'VERIFIER',
    targetType: 'ASSIGNMENT',
    targetId: 'asg-002',
    details: 'Dispatched Team Alpha (Eng. David Kigozi) to Rushoroza Hill',
    timestamp: '2026-09-14T08:25:00Z'
  }
];

class DatabaseStore {
  private data: DatabaseSchema;
  private initialized = false;

  constructor() {
    this.data = this.getDefaultState();
    this.init();
  }

  private getDefaultState(): DatabaseSchema {
    return {
      users: INITIAL_USERS,
      organizations: INITIAL_ORGANIZATIONS,
      teams: INITIAL_TEAMS,
      locations: INITIAL_LOCATIONS,
      categories: INITIAL_CATEGORIES,
      reports: INITIAL_REPORTS,
      incidents: INITIAL_INCIDENTS,
      assignments: INITIAL_ASSIGNMENTS,
      workUpdates: INITIAL_WORK_UPDATES,
      resolutionEvidence: [],
      statusHistory: INITIAL_STATUS_HISTORY,
      notifications: INITIAL_NOTIFICATIONS,
      feedbacks: [],
      auditEvents: INITIAL_AUDIT_EVENTS,
      slaPolicies: INITIAL_SLA_POLICIES
    };
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(STORE_PATH)) {
        const fileContent = fs.readFileSync(STORE_PATH, 'utf-8');
        if (fileContent && fileContent.trim().length > 0) {
          const parsed = JSON.parse(fileContent);
          const mergedUsers = [...(parsed.users || [])];
          for (const defUser of INITIAL_USERS) {
            const existingIdx = mergedUsers.findIndex(u => u.id === defUser.id);
            if (existingIdx === -1) {
              mergedUsers.push(defUser);
            } else {
              if (!mergedUsers[existingIdx].passwordHash) mergedUsers[existingIdx].passwordHash = defUser.passwordHash;
              if (!mergedUsers[existingIdx].district) mergedUsers[existingIdx].district = defUser.district;
            }
          }
          this.data = {
            ...this.getDefaultState(),
            ...parsed,
            users: mergedUsers
          };
          this.persist();
          this.initialized = true;
          return;
        }
      }
    } catch (err) {
      console.warn('Could not read existing store, seeding defaults:', err);
    }
    this.persist();
    this.initialized = true;
  }

  public persist() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tmpPath = `${STORE_PATH}.tmp`;
      fs.writeFileSync(tmpPath, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tmpPath, STORE_PATH);
    } catch (err) {
      console.error('Failed to persist database store:', err);
    }
  }

  public resetToDefaults() {
    this.data = this.getDefaultState();
    this.persist();
    return true;
  }

  public getUsers() { return this.data.users; }
  public getUserById(id: string) { return this.data.users.find(u => u.id === id); }
  public getUserByEmail(email: string) { return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase()); }
  public getUserByPhone(phone: string) {
    const clean = phone.replace(/[^0-9+]/g, '');
    return this.data.users.find(u => u.phone && u.phone.replace(/[^0-9+]/g, '') === clean);
  }
  public getUserByIdentifier(identifier: string) {
    if (!identifier) return null;
    const trimmed = identifier.trim();
    return (
      this.getUserById(trimmed) ||
      this.getUserByEmail(trimmed) ||
      this.getUserByPhone(trimmed)
    );
  }
  public getPendingApplications() {
    return this.data.users.filter(u => u.status === 'PENDING_APPROVAL');
  }
  public saveUser(user: User) {
    const idx = this.data.users.findIndex(u => u.id === user.id);
    if (idx >= 0) this.data.users[idx] = user;
    else this.data.users.push(user);
    this.persist();
  }

  public getOrganizations() { return this.data.organizations; }
  public getTeams() { return this.data.teams; }
  public getLocations() { return this.data.locations; }
  public getCategories() { return this.data.categories; }
  public getCategoryById(id: string) { return this.data.categories.find(c => c.id === id); }

  public getReports() { return this.data.reports; }
  public getReportById(id: string) { return this.data.reports.find(r => r.id === id); }
  public saveReport(report: Report) {
    const idx = this.data.reports.findIndex(r => r.id === report.id);
    if (idx >= 0) this.data.reports[idx] = report;
    else this.data.reports.unshift(report);
    this.persist();
  }

  public getIncidents() { return this.data.incidents; }
  public getIncidentById(id: string) { return this.data.incidents.find(i => i.id === id); }
  public saveIncident(incident: Incident) {
    const idx = this.data.incidents.findIndex(i => i.id === incident.id);
    if (idx >= 0) this.data.incidents[idx] = incident;
    else this.data.incidents.unshift(incident);
    this.persist();
  }

  public getAssignments() { return this.data.assignments; }
  public getAssignmentById(id: string) { return this.data.assignments.find(a => a.id === id); }
  public saveAssignment(assignment: Assignment) {
    const idx = this.data.assignments.findIndex(a => a.id === assignment.id);
    if (idx >= 0) this.data.assignments[idx] = assignment;
    else this.data.assignments.unshift(assignment);
    this.persist();
  }

  public getWorkUpdates(incidentId?: string) {
    if (!incidentId) return this.data.workUpdates;
    return this.data.workUpdates.filter(w => w.incidentId === incidentId);
  }
  public saveWorkUpdate(update: WorkUpdate) {
    this.data.workUpdates.push(update);
    this.persist();
  }

  public getResolutionEvidence(incidentId: string) {
    return this.data.resolutionEvidence.filter(e => e.incidentId === incidentId);
  }
  public saveResolutionEvidence(evidence: ResolutionEvidence) {
    this.data.resolutionEvidence.push(evidence);
    this.persist();
  }

  public getStatusHistory(entityId?: string) {
    if (!entityId) return this.data.statusHistory;
    return this.data.statusHistory.filter(h => h.entityId === entityId);
  }
  public addStatusHistory(entry: Omit<StatusHistory, 'id'>) {
    const newEntry: StatusHistory = {
      ...entry,
      id: `sh-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    };
    this.data.statusHistory.push(newEntry);
    this.persist();
    return newEntry;
  }

  public getNotifications(userId?: string, role?: UserRole) {
    return this.data.notifications.filter(n => {
      if (userId && n.recipientId === userId) return true;
      if (role && n.recipientRole === role) return true;
      return false;
    });
  }

  public getNotificationsForUser(user: User) {
    return this.data.notifications.filter(n => {
      // 1. Explicit direct recipient matching
      if (n.recipientId && n.recipientId === user.id) return true;

      // 2. If notification is targeted to another specific user ID, do NOT leak to others
      if (n.recipientId && n.recipientId !== user.id && !n.recipientId.startsWith('ops-') && n.recipientId !== 'broadcast') {
        return false;
      }

      // 3. Target role matching
      if (n.recipientRole) {
        const roleMatches =
          n.recipientRole === user.role ||
          (n.recipientRole === 'MANAGER' && user.role === 'PROVIDER_MANAGER') ||
          (n.recipientRole === 'ADMIN' && user.role === 'SYSTEM_ADMINISTRATOR');

        if (!roleMatches) return false;

        // 4. District scoping: regional operators only receive alerts for their district
        if (n.district && user.district && user.role !== 'ADMIN' && user.role !== 'SYSTEM_ADMINISTRATOR') {
          if (n.district.toLowerCase() !== user.district.toLowerCase()) {
            return false;
          }
        }
        return true;
      }

      return false;
    });
  }
  public addNotification(entry: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) {
    const notif: Notification = {
      ...entry,
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    this.data.notifications.unshift(notif);
    this.persist();
    return notif;
  }
  public markNotificationRead(id: string) {
    const item = this.data.notifications.find(n => n.id === id);
    if (item) {
      item.isRead = true;
      this.persist();
    }
  }
  public markAllNotificationsRead(userId?: string) {
    for (const n of this.data.notifications) {
      if (!userId || n.recipientId === userId) {
        n.isRead = true;
      }
    }
    this.persist();
  }

  public getAuditEvents() { return this.data.auditEvents; }
  public addAuditEvent(entry: Omit<AuditEvent, 'id' | 'timestamp'>) {
    const audit: AuditEvent = {
      ...entry,
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString()
    };
    this.data.auditEvents.unshift(audit);
    this.persist();
    return audit;
  }

  public addFeedback(feedback: Feedback) {
    this.data.feedbacks.unshift(feedback);
    this.persist();
  }

  public getSlaPolicies() { return this.data.slaPolicies; }

  public generateReportId(): string {
    const year = new Date().getFullYear();
    const count = this.data.reports.length + 101;
    return `PP-RPT-${year}-${count.toString().padStart(6, '0')}`;
  }

  public generateIncidentId(): string {
    const year = new Date().getFullYear();
    const count = this.data.incidents.length + 15;
    return `PP-INC-${year}-${count.toString().padStart(4, '0')}`;
  }
}

export const db = new DatabaseStore();
