import express from 'express';
import { db } from '../db.js';
import { getAuthUser } from './auth.js';
import { Incident, IncidentPriority, IncidentSeverity, IncidentStatus } from '../types.js';
import { sanitizeReportForUser } from '../privacy-utils.js';

const router = express.Router();

router.get('/', (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Authentication required' });
  if (user.status === 'DEACTIVATED') return res.status(403).json({ error: 'Account is deactivated. Contact system administration.' });

  const { status, priority, categoryId, district, search } = req.query;

  // District scoping for Verifier & Manager (Test 6 & 7)
  if ((user.role === 'VERIFIER' || user.role === 'MANAGER' || user.role === 'PROVIDER_MANAGER') && user.district) {
    if (district && String(district).toLowerCase() !== user.district.toLowerCase()) {
      return res.status(403).json({ 
        error: `Access forbidden: Operational scope restricted to ${user.district} District. You cannot access ${district} incident data.` 
      });
    }
  }

  let incidents = db.getIncidents();

  if (user.role === 'ENGINEER') {
    incidents = incidents.filter(i => i.engineerId === user.id || (user.teamId && i.teamId === user.teamId));
  } else if (user.role === 'RESIDENT') {
    const myReportIncidentIds = new Set(
      db.getReports().filter(r => r.reporterId === user.id && r.linkedIncidentId).map(r => r.linkedIncidentId!)
    );
    incidents = incidents.filter(i => myReportIncidentIds.has(i.id));
  } else if ((user.role === 'VERIFIER' || user.role === 'MANAGER' || user.role === 'PROVIDER_MANAGER') && user.district) {
    incidents = incidents.filter(i => i.district.toLowerCase() === user.district!.toLowerCase());
  }

  if (status) {
    incidents = incidents.filter(i => i.status === status);
  }
  if (priority) {
    incidents = incidents.filter(i => i.priority === priority);
  }
  if (categoryId) {
    incidents = incidents.filter(i => i.categoryId === categoryId);
  }
  if (district) {
    incidents = incidents.filter(i => i.district.toLowerCase() === String(district).toLowerCase());
  }
  if (search) {
    const q = String(search).toLowerCase();
    incidents = incidents.filter(
      i =>
        i.id.toLowerCase().includes(q) ||
        i.title.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.locationName.toLowerCase().includes(q) ||
        (i.engineerName && i.engineerName.toLowerCase().includes(q))
    );
  }

  res.json({ incidents });
});

router.get('/public', (req, res) => {
  const incidents = db.getIncidents().map(inc => ({
    id: inc.id,
    title: inc.title,
    categoryId: inc.categoryId,
    categoryName: inc.categoryName,
    priority: inc.priority,
    severity: inc.severity,
    status: inc.status,
    district: inc.district,
    locationName: inc.locationName,
    latitude: inc.latitude,
    longitude: inc.longitude,
    affectedCustomersEst: inc.affectedCustomersEst,
    affectedRadiusMeters: inc.affectedRadiusMeters,
    engineerName: inc.engineerName,
    reopenCount: inc.reopenCount,
    createdAt: inc.createdAt,
    updatedAt: inc.updatedAt,
    slaResolutionTargetMin: inc.slaResolutionTargetMin
  }));
  res.json({ incidents });
});

router.get('/:id', (req, res) => {
  const user = getAuthUser(req);
  if (user && user.status === 'DEACTIVATED') return res.status(403).json({ error: 'Account is deactivated. Contact system administration.' });

  const incident = db.getIncidentById(req.params.id);
  if (!incident) return res.status(404).json({ error: 'Incident not found' });

  // If unauthenticated guest, return public sanitized view
  if (!user) {
    const publicIncident = {
      id: incident.id,
      title: incident.title,
      categoryId: incident.categoryId,
      categoryName: incident.categoryName,
      priority: incident.priority,
      severity: incident.severity,
      status: incident.status,
      district: incident.district,
      locationName: incident.locationName,
      latitude: incident.latitude,
      longitude: incident.longitude,
      affectedCustomersEst: incident.affectedCustomersEst,
      affectedRadiusMeters: incident.affectedRadiusMeters,
      engineerName: incident.engineerName,
      reopenCount: incident.reopenCount,
      createdAt: incident.createdAt,
      updatedAt: incident.updatedAt,
      slaResolutionTargetMin: incident.slaResolutionTargetMin
    };
    return res.json({
      incident: publicIncident,
      relatedReports: [],
      assignments: [],
      workUpdates: db.getWorkUpdates(incident.id).map(w => ({
        id: w.id,
        incidentId: w.incidentId,
        status: w.status,
        note: w.note,
        createdAt: w.createdAt
      })),
      resolutionEvidence: [],
      history: []
    });
  }

  const allReports = db.getReports();
  const relatedReports = allReports.filter(r => 
    incident.relatedReportIds.includes(r.id) || r.id === incident.primaryReportId || r.linkedIncidentId === incident.id
  );

  if (user.role === 'RESIDENT') {
    const ownsLinkedReport = relatedReports.some(r => r.reporterId === user.id);
    const inResidentDistrict = !user.district || !incident.district || incident.district.toLowerCase() === user.district.toLowerCase();
    if (!ownsLinkedReport && !inResidentDistrict) {
      return res.status(403).json({ error: 'Access denied: Incident is outside your registered district.' });
    }
  } else if ((user.role === 'VERIFIER' || user.role === 'MANAGER' || user.role === 'PROVIDER_MANAGER') && user.district) {
    if (incident.district && incident.district.toLowerCase() !== user.district.toLowerCase()) {
      return res.status(403).json({ 
        error: `Access forbidden: Operational scope restricted to ${user.district} District. Record belongs to ${incident.district} District.` 
      });
    }
  } else if (user.role === 'ENGINEER' && user.district) {
    // If engineer has a district restriction and incident is in a completely different district
    if (incident.district && incident.district.toLowerCase() !== user.district.toLowerCase() && incident.engineerId !== user.id) {
      return res.status(403).json({ 
        error: `Access forbidden: Field operational scope restricted to ${user.district} District. Record belongs to ${incident.district} District.` 
      });
    }
  }

  const assignments = db.getAssignments().filter(a => a.incidentId === incident.id);
  const workUpdates = db.getWorkUpdates(incident.id);
  const resolutionEvidence = db.getResolutionEvidence(incident.id);
  const history = db.getStatusHistory(incident.id);

  res.json({
    incident,
    relatedReports: relatedReports.map(r => sanitizeReportForUser(r, user)),
    assignments,
    workUpdates,
    resolutionEvidence,
    history
  });
});

router.post('/', (req, res) => {
  const user = getAuthUser(req);
  if (!user || (user.role !== 'VERIFIER' && user.role !== 'MANAGER' && user.role !== 'ADMIN')) {
    return res.status(403).json({ error: 'Permission denied. Only operations staff can create incidents.' });
  }

  const {
    title,
    primaryReportId,
    categoryId,
    description,
    severity = 'HIGH',
    priority = 'NORMAL',
    locationName,
    district = 'Kabale',
    subArea,
    latitude,
    longitude,
    affectedRadiusMeters = 500,
    affectedCustomersEst = 50,
    organizationId = 'org-uedcl-kigezi'
  } = req.body;

  if (!title || !categoryId || latitude === undefined || longitude === undefined) {
    return res.status(400).json({ error: 'Title, category, and coordinates are required' });
  }

  const category = db.getCategoryById(categoryId);
  const incidentId = db.generateIncidentId();
  const now = new Date().toISOString();

  const slaPolicies = db.getSlaPolicies();
  const sla = slaPolicies.find(p => p.priority === priority) || slaPolicies[1];

  const newIncident: Incident = {
    id: incidentId,
    title: title.trim(),
    categoryId: category ? category.id : categoryId,
    categoryName: category ? category.name : 'Power Incident',
    description: (description || '').trim(),
    severity: severity as IncidentSeverity,
    priority: priority as IncidentPriority,
    status: 'OPEN',
    locationName: locationName || 'Kabale Municipality',
    district,
    subArea: subArea || locationName?.split(',')[0] || 'Central',
    latitude: Number(latitude),
    longitude: Number(longitude),
    affectedRadiusMeters: Number(affectedRadiusMeters),
    affectedCustomersEst: Number(affectedCustomersEst),
    organizationId,
    primaryReportId: primaryReportId || '',
    relatedReportIds: primaryReportId ? [primaryReportId] : [],
    reopenCount: 0,
    slaAcknowledgementTargetMin: sla.acknowledgementTargetMinutes,
    slaAssignmentTargetMin: sla.assignmentTargetMinutes,
    slaResolutionTargetMin: sla.resolutionTargetMinutes,
    createdAt: now,
    updatedAt: now
  };

  db.saveIncident(newIncident);

  if (primaryReportId) {
    const report = db.getReportById(primaryReportId);
    if (report) {
      report.status = 'LINKED_TO_INCIDENT';
      report.linkedIncidentId = newIncident.id;
      report.updatedAt = now;
      db.saveReport(report);

      db.addStatusHistory({
        entityType: 'REPORT',
        entityId: report.id,
        previousStatus: 'SUBMITTED',
        newStatus: 'LINKED_TO_INCIDENT',
        actorId: user.id,
        actorName: user.name,
        actorRole: user.role,
        reason: `Linked to new operational incident ${newIncident.id}`,
        timestamp: now
      });

      db.addNotification({
        recipientId: report.reporterId,
        recipientRole: 'RESIDENT',
        eventType: 'INCIDENT_CREATED',
        title: `Incident Opened: ${newIncident.id}`,
        body: `Your report has been escalated into operational incident "${newIncident.title}". Work assignment in progress.`,
        reportId: report.id,
        incidentId: newIncident.id,
        priority: newIncident.priority === 'EMERGENCY' ? 'CRITICAL' : 'NORMAL',
        actionUrl: `/resident/reports/${report.id}`
      });
    }
  }

  db.addStatusHistory({
    entityType: 'INCIDENT',
    entityId: newIncident.id,
    previousStatus: 'NONE',
    newStatus: 'OPEN',
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    reason: `Incident created from report ${primaryReportId || 'direct'} with priority ${newIncident.priority}`,
    timestamp: now
  });

  db.addAuditEvent({
    action: 'INCIDENT_CREATED',
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    targetType: 'INCIDENT',
    targetId: newIncident.id,
    details: `Incident created: "${newIncident.title}" [${newIncident.priority}] in ${newIncident.locationName}`
  });

  res.status(201).json({ incident: newIncident });
});

router.post('/:id/link-report', (req, res) => {
  const user = getAuthUser(req);
  if (!user || (user.role !== 'VERIFIER' && user.role !== 'MANAGER' && user.role !== 'ADMIN')) {
    return res.status(403).json({ error: 'Permission denied' });
  }

  const { reportId } = req.body;
  if (!reportId) return res.status(400).json({ error: 'reportId is required' });

  const incident = db.getIncidentById(req.params.id);
  if (!incident) return res.status(404).json({ error: 'Incident not found' });

  const report = db.getReportById(reportId);
  if (!report) return res.status(404).json({ error: 'Report not found' });

  if (!incident.relatedReportIds.includes(reportId)) {
    incident.relatedReportIds.push(reportId);
    incident.updatedAt = new Date().toISOString();
    db.saveIncident(incident);
  }

  const prevReportStatus = report.status;
  report.status = 'LINKED_TO_INCIDENT';
  report.linkedIncidentId = incident.id;
  report.updatedAt = new Date().toISOString();
  db.saveReport(report);

  db.addStatusHistory({
    entityType: 'REPORT',
    entityId: report.id,
    previousStatus: prevReportStatus,
    newStatus: 'LINKED_TO_INCIDENT',
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    reason: `Grouped under active incident ${incident.id} (${incident.title})`,
    timestamp: new Date().toISOString()
  });

  db.addStatusHistory({
    entityType: 'INCIDENT',
    entityId: incident.id,
    previousStatus: incident.status,
    newStatus: incident.status,
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    reason: `Corroborating report ${report.id} linked (Total: ${incident.relatedReportIds.length} reports)`,
    timestamp: new Date().toISOString()
  });

  db.addNotification({
    recipientId: report.reporterId,
    recipientRole: 'RESIDENT',
    eventType: 'REPORT_LINKED',
    title: `Report Linked to Response Work`,
    body: `Your report has been linked to active response incident ${incident.id} (${incident.title}). You will receive progress notifications.`,
    reportId: report.id,
    incidentId: incident.id,
    priority: 'NORMAL',
    actionUrl: `/resident/reports/${report.id}`
  });

  res.json({ incident, report });
});

router.post('/:id/unlink-report', (req, res) => {
  const user = getAuthUser(req);
  if (!user || (user.role !== 'VERIFIER' && user.role !== 'MANAGER' && user.role !== 'ADMIN')) {
    return res.status(403).json({ error: 'Permission denied' });
  }

  const { reportId } = req.body;
  const incident = db.getIncidentById(req.params.id);
  if (!incident) return res.status(404).json({ error: 'Incident not found' });

  incident.relatedReportIds = incident.relatedReportIds.filter(id => id !== reportId);
  incident.updatedAt = new Date().toISOString();
  db.saveIncident(incident);

  const report = db.getReportById(reportId);
  if (report) {
    report.status = 'SUBMITTED';
    report.linkedIncidentId = undefined;
    report.updatedAt = new Date().toISOString();
    db.saveReport(report);
  }

  res.json({ incident });
});

router.patch('/:id/priority', (req, res) => {
  const user = getAuthUser(req);
  if (!user || (user.role !== 'VERIFIER' && user.role !== 'MANAGER' && user.role !== 'ADMIN')) {
    return res.status(403).json({ error: 'Permission denied' });
  }

  const { priority, severity, reason } = req.body;
  const incident = db.getIncidentById(req.params.id);
  if (!incident) return res.status(404).json({ error: 'Incident not found' });

  const prevPriority = incident.priority;
  if (priority) incident.priority = priority;
  if (severity) incident.severity = severity;
  incident.updatedAt = new Date().toISOString();

  const slaPolicies = db.getSlaPolicies();
  const policy = slaPolicies.find(p => p.priority === incident.priority);
  if (policy) {
    incident.slaAcknowledgementTargetMin = policy.acknowledgementTargetMinutes;
    incident.slaAssignmentTargetMin = policy.assignmentTargetMinutes;
    incident.slaResolutionTargetMin = policy.resolutionTargetMinutes;
  }
  db.saveIncident(incident);

  db.addAuditEvent({
    action: 'INCIDENT_PRIORITY_UPDATED',
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    targetType: 'INCIDENT',
    targetId: incident.id,
    details: `Priority updated from ${prevPriority} to ${incident.priority}. Reason: ${reason || 'Operational reassessment'}`
  });

  db.addStatusHistory({
    entityType: 'INCIDENT',
    entityId: incident.id,
    previousStatus: incident.status,
    newStatus: incident.status,
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    reason: `Priority adjusted to ${incident.priority}. Reason: ${reason || 'Operational update'}`,
    timestamp: new Date().toISOString()
  });

  res.json({ incident });
});

router.post('/:id/assign', (req, res) => {
  const user = getAuthUser(req);
  if (!user || (user.role !== 'VERIFIER' && user.role !== 'MANAGER' && user.role !== 'ADMIN')) {
    return res.status(403).json({ error: 'Permission denied' });
  }

  const { organizationId, teamId, engineerId, notes } = req.body;
  if (!engineerId) return res.status(400).json({ error: 'Engineer selection is required' });

  const incident = db.getIncidentById(req.params.id);
  if (!incident) return res.status(404).json({ error: 'Incident not found' });

  const engineer = db.getUserById(engineerId);
  if (!engineer) return res.status(404).json({ error: 'Engineer not found' });

  const prevStatus = incident.status;
  const now = new Date().toISOString();

  const assignmentId = `asg-${Date.now()}`;
  const assignment = {
    id: assignmentId,
    incidentId: incident.id,
    organizationId: organizationId || engineer.organizationId || 'org-uedcl-kigezi',
    teamId: teamId || engineer.teamId,
    engineerId: engineer.id,
    engineerName: engineer.name,
    status: 'OFFERED' as const,
    notes: notes || '',
    assignedAt: now,
    assignedBy: `${user.name} (${user.role})`
  };
  db.saveAssignment(assignment);

  incident.organizationId = assignment.organizationId;
  incident.teamId = assignment.teamId;
  incident.engineerId = engineer.id;
  incident.engineerName = engineer.name;
  incident.assignedAt = now;
  incident.status = 'ASSIGNED';
  incident.updatedAt = now;
  db.saveIncident(incident);

  db.addStatusHistory({
    entityType: 'INCIDENT',
    entityId: incident.id,
    previousStatus: prevStatus,
    newStatus: 'ASSIGNED',
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    reason: `Assigned to ${engineer.name} (${assignment.teamId || 'Response Team'})`,
    timestamp: now
  });

  db.addNotification({
    recipientId: engineer.id,
    recipientRole: 'ENGINEER',
    district: incident.district,
    eventType: 'ASSIGNMENT_RECEIVED',
    title: `New Job Assigned: ${incident.id}`,
    body: `You have been assigned to ${incident.title} [${incident.priority}]. Location: ${incident.locationName}.`,
    incidentId: incident.id,
    priority: incident.priority === 'EMERGENCY' ? 'CRITICAL' : 'HIGH',
    actionUrl: `/engineer/jobs/${incident.id}`
  });

  res.json({ incident, assignment });
});

router.post(['/:id/confirm', '/:id/confirm-restoration'], (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Authentication required' });

  const { rating = 5, comment = 'Restoration confirmed by resident' } = req.body;
  const incident = db.getIncidentById(req.params.id);
  if (!incident) return res.status(404).json({ error: 'Incident not found' });

  const prevStatus = incident.status;
  const now = new Date().toISOString();

  incident.status = 'CLOSED';
  incident.residentConfirmationStatus = 'CONFIRMED';
  incident.residentFeedbackRating = Number(rating);
  incident.residentFeedbackComment = comment;
  incident.closedAt = now;
  incident.updatedAt = now;
  db.saveIncident(incident);

  db.addFeedback({
    id: `fb-${Date.now()}`,
    incidentId: incident.id,
    reportId: incident.primaryReportId,
    residentId: user.id,
    rating: Number(rating),
    restoredSuccessfully: true,
    comments: comment,
    createdAt: now
  });

  db.addStatusHistory({
    entityType: 'INCIDENT',
    entityId: incident.id,
    previousStatus: prevStatus,
    newStatus: 'CLOSED',
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    reason: `Resident confirmed power restoration. Rating: ${rating}/5. "${comment}"`,
    timestamp: now
  });

  db.addNotification({
    recipientId: `ops-${incident.district}`,
    recipientRole: 'VERIFIER',
    district: incident.district,
    eventType: 'INCIDENT_CLOSED',
    title: `Incident ${incident.id} Confirmed & Closed`,
    body: `Resident confirmed power restoration in ${incident.district}. Satisfaction: ${rating}/5.`,
    incidentId: incident.id,
    priority: 'NORMAL',
    actionUrl: `/operations/incidents/${incident.id}`
  });

  if (incident.engineerId) {
    db.addNotification({
      recipientId: incident.engineerId,
      recipientRole: 'ENGINEER',
      district: incident.district,
      eventType: 'INCIDENT_CLOSED',
      title: `Job ${incident.id} Confirmed by Customer`,
      body: `Customer confirmed power is fully restored. Thank you for your work!`,
      incidentId: incident.id,
      priority: 'NORMAL',
      actionUrl: `/engineer/jobs/${incident.id}`
    });
  }

  res.json({ incident });
});

router.post(['/:id/dispute', '/:id/dispute-restoration'], (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Authentication required' });

  const { reason } = req.body;
  if (!reason) {
    return res.status(400).json({ error: 'Please provide details on what is still failing.' });
  }

  const incident = db.getIncidentById(req.params.id);
  if (!incident) return res.status(404).json({ error: 'Incident not found' });

  const prevStatus = incident.status;
  const now = new Date().toISOString();

  incident.status = 'REOPENED';
  incident.residentConfirmationStatus = 'DISPUTED';
  incident.residentDisputeReason = reason;
  incident.reopenCount = (incident.reopenCount || 0) + 1;
  incident.updatedAt = now;
  db.saveIncident(incident);

  db.addStatusHistory({
    entityType: 'INCIDENT',
    entityId: incident.id,
    previousStatus: prevStatus,
    newStatus: 'REOPENED',
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    reason: `Resident disputed restoration: ${reason}`,
    timestamp: now
  });

  db.addNotification({
    recipientId: `ops-${incident.district}`,
    recipientRole: 'VERIFIER',
    district: incident.district,
    eventType: 'INCIDENT_REOPENED',
    title: `ALERT: Incident ${incident.id} Reopened by Resident`,
    body: `Resident reported power is STILL UNAVAILABLE in ${incident.district}: "${reason}". Reopen count: ${incident.reopenCount}`,
    incidentId: incident.id,
    priority: 'CRITICAL',
    actionUrl: `/operations/incidents/${incident.id}`
  });

  if (incident.engineerId) {
    db.addNotification({
      recipientId: incident.engineerId,
      recipientRole: 'ENGINEER',
      district: incident.district,
      eventType: 'INCIDENT_REOPENED',
      title: `Job ${incident.id} Reopened: Power Still Out`,
      body: `Customer reported unresolved outage: "${reason}". Please inspect and take secondary action.`,
      incidentId: incident.id,
      priority: 'CRITICAL',
      actionUrl: `/engineer/jobs/${incident.id}`
    });
  }

  res.json({ incident });
});

router.post('/:id/close', (req, res) => {
  const user = getAuthUser(req);
  if (!user || (user.role !== 'MANAGER' && user.role !== 'ADMIN')) {
    return res.status(403).json({ error: 'Permission denied' });
  }

  const { reason = 'Closed by operational supervisor' } = req.body;
  const incident = db.getIncidentById(req.params.id);
  if (!incident) return res.status(404).json({ error: 'Incident not found' });

  const prevStatus = incident.status;
  const now = new Date().toISOString();

  incident.status = 'CLOSED';
  incident.closedAt = now;
  incident.updatedAt = now;
  db.saveIncident(incident);

  db.addStatusHistory({
    entityType: 'INCIDENT',
    entityId: incident.id,
    previousStatus: prevStatus,
    newStatus: 'CLOSED',
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    reason,
    timestamp: now
  });

  res.json({ incident });
});

export default router;
