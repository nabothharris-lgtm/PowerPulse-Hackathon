import express from 'express';
import { db } from '../db.js';
import { getAuthUser } from './auth.js';
import { ResolutionOutcome, WorkUpdateStatus } from '../types.js';

const router = express.Router();

router.get(['/my', '/my-jobs'], (req, res) => {
  const user = getAuthUser(req);
  if (!user || user.role !== 'ENGINEER') {
    return res.status(403).json({ error: 'Engineer role required' });
  }
  if (user.status === 'DEACTIVATED') {
    return res.status(403).json({ error: 'Account is deactivated. Contact system administration.' });
  }
  const allAssignments = db.getAssignments().filter(a => a.engineerId === user.id);
  const allIncidents = db.getIncidents();

  const jobs = allAssignments.map(asg => {
    const incident = allIncidents.find(i => i.id === asg.incidentId);
    return {
      assignment: asg,
      incident: incident || null
    };
  }).filter(j => j.incident !== null);

  res.json({ jobs });
});

router.post('/:id/accept', (req, res) => {
  const user = getAuthUser(req);
  if (!user || user.role !== 'ENGINEER') return res.status(403).json({ error: 'Engineer role required' });

  const assignment = db.getAssignmentById(req.params.id);
  if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
  if (assignment.engineerId !== user.id) return res.status(403).json({ error: 'Not authorized for this assignment' });

  const incident = db.getIncidentById(assignment.incidentId);
  if (!incident) return res.status(404).json({ error: 'Incident not found' });

  const prevStatus = incident.status;
  const now = new Date().toISOString();

  assignment.status = 'ACCEPTED';
  assignment.acceptedAt = now;
  db.saveAssignment(assignment);

  incident.status = 'ACCEPTED';
  incident.updatedAt = now;
  db.saveIncident(incident);

  db.addStatusHistory({
    entityType: 'INCIDENT',
    entityId: incident.id,
    previousStatus: prevStatus,
    newStatus: 'ACCEPTED',
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    reason: 'Engineer acknowledged and accepted assignment',
    timestamp: now
  });

  db.addNotification({
    recipientId: 'ops-broadcast',
    recipientRole: 'VERIFIER',
    eventType: 'JOB_ACCEPTED',
    title: `Job Accepted: ${incident.id}`,
    body: `${user.name} accepted assignment for ${incident.title}`,
    incidentId: incident.id,
    priority: 'NORMAL',
    actionUrl: `/operations/incidents/${incident.id}`
  });

  res.json({ assignment, incident });
});

router.post('/:id/decline', (req, res) => {
  const user = getAuthUser(req);
  if (!user || user.role !== 'ENGINEER') return res.status(403).json({ error: 'Engineer role required' });

  const { reason } = req.body;
  if (!reason) return res.status(400).json({ error: 'Decline reason is mandatory' });

  const assignment = db.getAssignmentById(req.params.id);
  if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

  const incident = db.getIncidentById(assignment.incidentId);
  if (!incident) return res.status(404).json({ error: 'Incident not found' });

  const now = new Date().toISOString();

  assignment.status = 'DECLINED';
  assignment.declinedAt = now;
  assignment.declineReason = reason;
  db.saveAssignment(assignment);

  const prevStatus = incident.status;
  incident.status = 'OPEN';
  incident.engineerId = undefined;
  incident.engineerName = undefined;
  incident.updatedAt = now;
  db.saveIncident(incident);

  db.addStatusHistory({
    entityType: 'INCIDENT',
    entityId: incident.id,
    previousStatus: prevStatus,
    newStatus: 'OPEN',
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    reason: `Engineer declined assignment: ${reason}`,
    timestamp: now
  });

  db.addNotification({
    recipientId: 'ops-broadcast',
    recipientRole: 'VERIFIER',
    eventType: 'JOB_DECLINED',
    title: `ALERT: Assignment Declined for ${incident.id}`,
    body: `${user.name} could not accept job. Reason: "${reason}". Reassignment required.`,
    incidentId: incident.id,
    priority: 'HIGH',
    actionUrl: `/operations/incidents/${incident.id}`
  });

  res.json({ assignment, incident });
});

router.post('/:id/en-route', (req, res) => {
  const user = getAuthUser(req);
  if (!user || user.role !== 'ENGINEER') return res.status(403).json({ error: 'Engineer role required' });

  const assignment = db.getAssignmentById(req.params.id);
  if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

  const incident = db.getIncidentById(assignment.incidentId);
  if (!incident) return res.status(404).json({ error: 'Incident not found' });

  const now = new Date().toISOString();
  const prevStatus = incident.status;

  incident.status = 'EN_ROUTE';
  incident.updatedAt = now;
  db.saveIncident(incident);

  const update = {
    id: `wu-${Date.now()}`,
    incidentId: incident.id,
    engineerId: user.id,
    engineerName: user.name,
    status: 'EN_ROUTE' as WorkUpdateStatus,
    note: req.body.note || 'Service crew mobilized and traveling to site.',
    latitude: req.body.latitude,
    longitude: req.body.longitude,
    createdAt: now
  };
  db.saveWorkUpdate(update);

  db.addStatusHistory({
    entityType: 'INCIDENT',
    entityId: incident.id,
    previousStatus: prevStatus,
    newStatus: 'EN_ROUTE',
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    reason: update.note,
    timestamp: now
  });

  const primaryReport = db.getReportById(incident.primaryReportId);
  if (primaryReport) {
    db.addNotification({
      recipientId: primaryReport.reporterId,
      recipientRole: 'RESIDENT',
      eventType: 'CREW_EN_ROUTE',
      title: 'Power Response Crew En Route',
      body: `Technician ${user.name} is on the way to ${incident.locationName}.`,
      reportId: primaryReport.id,
      incidentId: incident.id,
      priority: 'NORMAL',
      actionUrl: `/resident/reports/${primaryReport.id}`
    });
  }

  res.json({ incident, update });
});

router.post('/:id/start-work', (req, res) => {
  const user = getAuthUser(req);
  if (!user || user.role !== 'ENGINEER') return res.status(403).json({ error: 'Engineer role required' });

  const assignment = db.getAssignmentById(req.params.id);
  if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

  const incident = db.getIncidentById(assignment.incidentId);
  if (!incident) return res.status(404).json({ error: 'Incident not found' });

  const now = new Date().toISOString();
  const prevStatus = incident.status;

  incident.status = 'IN_PROGRESS';
  incident.updatedAt = now;
  db.saveIncident(incident);

  const update = {
    id: `wu-${Date.now()}`,
    incidentId: incident.id,
    engineerId: user.id,
    engineerName: user.name,
    status: 'IN_PROGRESS' as WorkUpdateStatus,
    note: req.body.note || 'Arrived on site. Isolating power line and initiating hardware repair.',
    latitude: req.body.latitude,
    longitude: req.body.longitude,
    createdAt: now
  };
  db.saveWorkUpdate(update);

  db.addStatusHistory({
    entityType: 'INCIDENT',
    entityId: incident.id,
    previousStatus: prevStatus,
    newStatus: 'IN_PROGRESS',
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    reason: update.note,
    timestamp: now
  });

  res.json({ incident, update });
});

router.post('/:id/work-update', (req, res) => {
  const user = getAuthUser(req);
  if (!user || user.role !== 'ENGINEER') return res.status(403).json({ error: 'Engineer role required' });

  const { note, isBlocked, blockedReason, evidenceUrl } = req.body;
  if (!note && !blockedReason) return res.status(400).json({ error: 'Note or blocked reason is required' });

  const assignment = db.getAssignmentById(req.params.id);
  if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

  const incident = db.getIncidentById(assignment.incidentId);
  if (!incident) return res.status(404).json({ error: 'Incident not found' });

  const now = new Date().toISOString();
  const status: WorkUpdateStatus = isBlocked ? 'BLOCKED' : 'NOTE';

  const update = {
    id: `wu-${Date.now()}`,
    incidentId: incident.id,
    engineerId: user.id,
    engineerName: user.name,
    status,
    note: isBlocked ? `[WORK BLOCKED] ${blockedReason}. Note: ${note || ''}` : note,
    evidenceUrl,
    createdAt: now
  };
  db.saveWorkUpdate(update);

  db.addStatusHistory({
    entityType: 'INCIDENT',
    entityId: incident.id,
    previousStatus: incident.status,
    newStatus: incident.status,
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    reason: update.note,
    evidenceUrl,
    timestamp: now
  });

  if (isBlocked) {
    db.addNotification({
      recipientId: `ops-${incident.district}`,
      recipientRole: 'VERIFIER',
      district: incident.district,
      eventType: 'WORK_BLOCKED',
      title: `[${incident.district}] Work Blocked on ${incident.id}`,
      body: `${user.name} reported block: "${blockedReason}". Escalation may be needed.`,
      incidentId: incident.id,
      priority: 'HIGH',
      actionUrl: `/operations/incidents/${incident.id}`
    });
  }

  res.json({ update });
});

router.post('/:id/resolve', (req, res) => {
  const user = getAuthUser(req);
  if (!user || user.role !== 'ENGINEER') return res.status(403).json({ error: 'Engineer role required' });

  const {
    outcome = 'REPAIR_COMPLETED',
    note,
    photoUrl,
    additionalNotes
  } = req.body;

  if (!note) {
    return res.status(400).json({ error: 'A technical resolution note describing the repair is required' });
  }

  const assignment = db.getAssignmentById(req.params.id);
  if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

  const incident = db.getIncidentById(assignment.incidentId);
  if (!incident) return res.status(404).json({ error: 'Incident not found' });

  const now = new Date().toISOString();
  const prevStatus = incident.status;

  assignment.status = 'COMPLETED';
  assignment.completedAt = now;
  db.saveAssignment(assignment);

  const evidence = {
    id: `ev-${Date.now()}`,
    incidentId: incident.id,
    engineerId: user.id,
    engineerName: user.name,
    outcome: outcome as ResolutionOutcome,
    note: note.trim(),
    photoUrl,
    additionalNotes,
    createdAt: now
  };
  db.saveResolutionEvidence(evidence);

  incident.status = 'RESOLUTION_PENDING';
  incident.resolutionOutcome = outcome as ResolutionOutcome;
  incident.resolutionNote = note.trim();
  incident.resolutionEvidenceUrl = photoUrl;
  incident.resolutionSubmittedAt = now;
  incident.residentConfirmationStatus = 'PENDING';
  incident.resolvedAt = now;
  incident.updatedAt = now;
  db.saveIncident(incident);

  db.addStatusHistory({
    entityType: 'INCIDENT',
    entityId: incident.id,
    previousStatus: prevStatus,
    newStatus: 'RESOLUTION_PENDING',
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    reason: `Field resolution submitted: ${outcome} - ${note}`,
    evidenceUrl: photoUrl,
    timestamp: now
  });

  const allReports = db.getReports();
  const linkedReports = allReports.filter(r => 
    incident.relatedReportIds.includes(r.id) || r.id === incident.primaryReportId || r.linkedIncidentId === incident.id
  );

  for (const rep of linkedReports) {
    db.addNotification({
      recipientId: rep.reporterId,
      recipientRole: 'RESIDENT',
      district: incident.district,
      eventType: 'RESOLUTION_VERIFICATION_REQUESTED',
      title: 'Action Needed: Has Your Power Been Restored?',
      body: `Technician ${user.name} completed work on ${incident.title}. Please tap to confirm or dispute electricity service.`,
      reportId: rep.id,
      incidentId: incident.id,
      priority: 'HIGH',
      actionUrl: `/resident/reports/${rep.id}`
    });
  }

  db.addNotification({
    recipientId: `ops-${incident.district}`,
    recipientRole: 'VERIFIER',
    district: incident.district,
    eventType: 'RESOLUTION_SUBMITTED',
    title: `[${incident.district}] Resolution Submitted: ${incident.id}`,
    body: `${user.name} reported repair complete: "${note.slice(0, 80)}". Awaiting resident confirmation.`,
    incidentId: incident.id,
    priority: 'NORMAL',
    actionUrl: `/operations/incidents/${incident.id}`
  });

  res.json({ incident, assignment, evidence });
});

export default router;
