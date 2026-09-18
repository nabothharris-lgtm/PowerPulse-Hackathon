import express from 'express';
import { db } from '../db.js';
import { getAuthUser } from './auth.js';
import { Report } from '../types.js';
import { sanitizeReportForUser } from '../privacy-utils.js';

const router = express.Router();

function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // metres
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

router.get('/', (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (user.status === 'DEACTIVATED') {
    return res.status(403).json({ error: 'Account is deactivated. Contact system administration.' });
  }

  const { status, categoryId, district, search } = req.query;

  // District scope check for Verifier and Manager (Test 6 & 7)
  if ((user.role === 'VERIFIER' || user.role === 'MANAGER' || user.role === 'PROVIDER_MANAGER') && user.district) {
    if (district && String(district).toLowerCase() !== user.district.toLowerCase()) {
      return res.status(403).json({ 
        error: `Access forbidden: Operational scope restricted to ${user.district} District. You cannot access ${district} operational data.` 
      });
    }
  }

  let reports = db.getReports();

  if (user.role === 'RESIDENT') {
    reports = reports.filter(r => r.reporterId === user.id);
  } else if ((user.role === 'VERIFIER' || user.role === 'MANAGER' || user.role === 'PROVIDER_MANAGER') && user.district) {
    reports = reports.filter(r => r.district.toLowerCase() === user.district!.toLowerCase());
  }

  if (status) {
    reports = reports.filter(r => r.status === status);
  }
  if (categoryId) {
    reports = reports.filter(r => r.categoryId === categoryId);
  }
  if (district) {
    reports = reports.filter(r => r.district.toLowerCase() === String(district).toLowerCase());
  }
  if (search) {
    const q = String(search).toLowerCase();
    reports = reports.filter(
      r =>
        r.id.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.locationName.toLowerCase().includes(q) ||
        r.categoryName.toLowerCase().includes(q)
    );
  }

  res.json({ reports: reports.map(r => sanitizeReportForUser(r, user)) });
});

router.get('/:id', (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (user.status === 'DEACTIVATED') {
    return res.status(403).json({ error: 'Account is deactivated. Contact system administration.' });
  }

  const report = db.getReportById(req.params.id);
  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }

  // Resident privacy check (Test 8)
  if (user.role === 'RESIDENT' && report.reporterId !== user.id) {
    return res.status(403).json({ error: 'Access denied: You cannot access another resident\'s report.' });
  }

  // Verifier / Manager district scoping check (Test 6 & 7)
  if ((user.role === 'VERIFIER' || user.role === 'MANAGER' || user.role === 'PROVIDER_MANAGER') && user.district) {
    if (report.district && report.district.toLowerCase() !== user.district.toLowerCase()) {
      return res.status(403).json({ 
        error: `Access forbidden: Operational scope restricted to ${user.district} District. Record belongs to ${report.district} District.` 
      });
    }
  }

  const history = db.getStatusHistory(report.id);
  let linkedIncident = null;
  if (report.linkedIncidentId) {
    linkedIncident = db.getIncidentById(report.linkedIncidentId) || null;
  }

  res.json({
    report: sanitizeReportForUser(report, user),
    linkedIncident,
    history
  });
});

router.post('/', (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const {
    idempotencyKey,
    categoryId,
    description,
    symptoms = [],
    startTime,
    locationName,
    district = 'Kabale',
    subArea,
    latitude,
    longitude,
    locationAccuracyMeters,
    photoUrl,
    meterNumber,
    accountReference
  } = req.body;

  if (idempotencyKey) {
    const existing = db.getReports().find(r => r.idempotencyKey === idempotencyKey);
    if (existing) {
      return res.status(200).json({ report: existing, duplicateSuppressed: true });
    }
  }

  if (!categoryId || !description || !locationName || latitude === undefined || longitude === undefined) {
    return res.status(400).json({ error: 'Missing required report fields (category, description, location coordinates)' });
  }

  const category = db.getCategoryById(categoryId);
  if (!category) {
    return res.status(400).json({ error: 'Invalid category specified' });
  }

  const reportId = db.generateReportId();
  const now = new Date().toISOString();

  const newReport: Report = {
    id: reportId,
    idempotencyKey,
    reporterId: user.id,
    reporterName: user.name,
    reporterPhone: user.phone,
    categoryId: category.id,
    categoryName: category.name,
    hazardLevel: category.hazardLevel,
    isSafetyCritical: category.hazardLevel === 'SAFETY_CRITICAL',
    description: description.trim(),
    symptoms: Array.isArray(symptoms) ? symptoms : [symptoms],
    startTime: startTime || now,
    locationName: locationName.trim(),
    district,
    subArea: subArea || locationName.split(',')[0].trim(),
    latitude: Number(latitude),
    longitude: Number(longitude),
    locationAccuracyMeters: locationAccuracyMeters ? Number(locationAccuracyMeters) : undefined,
    photoUrl,
    meterNumber,
    accountReference,
    status: 'SUBMITTED',
    createdAt: now,
    updatedAt: now
  };

  db.saveReport(newReport);

  db.addStatusHistory({
    entityType: 'REPORT',
    entityId: newReport.id,
    previousStatus: 'NONE',
    newStatus: 'SUBMITTED',
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    reason: `Report filed by resident. Hazard level: ${category.hazardLevel}`,
    timestamp: now
  });

  db.addNotification({
    recipientId: `ops-${newReport.district}`,
    recipientRole: 'VERIFIER',
    district: newReport.district,
    eventType: 'REPORT_SUBMITTED',
    title: `[${newReport.district}] New Report ${newReport.id}: ${newReport.categoryName}`,
    body: `Resident reported: "${newReport.description.slice(0, 80)}..." in ${newReport.locationName}`,
    reportId: newReport.id,
    priority: newReport.isSafetyCritical ? 'CRITICAL' : 'NORMAL',
    actionUrl: `/operations/reports/${newReport.id}`
  });

  db.addNotification({
    recipientId: user.id,
    recipientRole: 'RESIDENT',
    district: newReport.district,
    eventType: 'REPORT_CONFIRMATION',
    title: `Report ${newReport.id} Received`,
    body: `Your report for ${newReport.locationName} has entered the operations queue for verification. We will notify you when response work begins.`,
    reportId: newReport.id,
    priority: 'NORMAL',
    actionUrl: `/resident/reports/${newReport.id}`
  });

  res.status(201).json({ report: newReport });
});

router.post('/:id/verify', (req, res) => {
  const user = getAuthUser(req);
  if (!user || (user.role !== 'VERIFIER' && user.role !== 'MANAGER' && user.role !== 'PROVIDER_MANAGER' && user.role !== 'ADMIN' && user.role !== 'SYSTEM_ADMINISTRATOR')) {
    return res.status(403).json({ error: 'Permission denied. Only verifiers or operations staff can verify reports.' });
  }

  const report = db.getReportById(req.params.id);
  if (!report) return res.status(404).json({ error: 'Report not found' });

  // District scoping check
  if ((user.role === 'VERIFIER' || user.role === 'MANAGER' || user.role === 'PROVIDER_MANAGER') && user.district) {
    if (report.district && report.district.toLowerCase() !== user.district.toLowerCase()) {
      return res.status(403).json({ 
        error: `Access forbidden: Operational scope restricted to ${user.district} District. Record belongs to ${report.district} District.` 
      });
    }
  }

  const prev = report.status;
  report.status = 'VERIFIED';
  report.updatedAt = new Date().toISOString();
  db.saveReport(report);

  db.addStatusHistory({
    entityType: 'REPORT',
    entityId: report.id,
    previousStatus: prev,
    newStatus: 'VERIFIED',
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    reason: req.body.reason || 'Verified by dispatch controller',
    timestamp: new Date().toISOString()
  });

  db.addNotification({
    recipientId: report.reporterId,
    recipientRole: 'RESIDENT',
    eventType: 'REPORT_VERIFIED',
    title: `Report ${report.id} Verified`,
    body: `Your report has been verified by the response team. Incident creation is underway.`,
    reportId: report.id,
    priority: 'NORMAL',
    actionUrl: `/resident/reports/${report.id}`
  });

  res.json({ report });
});

router.post('/:id/reject', (req, res) => {
  const user = getAuthUser(req);
  if (!user || (user.role !== 'VERIFIER' && user.role !== 'MANAGER' && user.role !== 'PROVIDER_MANAGER' && user.role !== 'ADMIN' && user.role !== 'SYSTEM_ADMINISTRATOR')) {
    return res.status(403).json({ error: 'Permission denied' });
  }

  const { reason } = req.body;
  if (!reason) {
    return res.status(400).json({ error: 'A rejection reason is required' });
  }

  const report = db.getReportById(req.params.id);
  if (!report) return res.status(404).json({ error: 'Report not found' });

  // District scoping check
  if ((user.role === 'VERIFIER' || user.role === 'MANAGER' || user.role === 'PROVIDER_MANAGER') && user.district) {
    if (report.district && report.district.toLowerCase() !== user.district.toLowerCase()) {
      return res.status(403).json({ 
        error: `Access forbidden: Operational scope restricted to ${user.district} District. Record belongs to ${report.district} District.` 
      });
    }
  }

  const prev = report.status;
  report.status = 'REJECTED';
  report.rejectionReason = reason;
  report.updatedAt = new Date().toISOString();
  db.saveReport(report);

  db.addStatusHistory({
    entityType: 'REPORT',
    entityId: report.id,
    previousStatus: prev,
    newStatus: 'REJECTED',
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    reason,
    timestamp: new Date().toISOString()
  });

  db.addNotification({
    recipientId: report.reporterId,
    recipientRole: 'RESIDENT',
    eventType: 'REPORT_REJECTED',
    title: `Report ${report.id} Update`,
    body: `Report could not be processed: ${reason}`,
    reportId: report.id,
    priority: 'NORMAL',
    actionUrl: `/resident/reports/${report.id}`
  });

  res.json({ report });
});

router.post('/:id/request-information', (req, res) => {
  const user = getAuthUser(req);
  if (!user || (user.role !== 'VERIFIER' && user.role !== 'MANAGER' && user.role !== 'PROVIDER_MANAGER' && user.role !== 'ADMIN' && user.role !== 'SYSTEM_ADMINISTRATOR')) {
    return res.status(403).json({ error: 'Permission denied' });
  }

  const { reason } = req.body;
  if (!reason) {
    return res.status(400).json({ error: 'Explanation of needed information is required' });
  }

  const report = db.getReportById(req.params.id);
  if (!report) return res.status(404).json({ error: 'Report not found' });

  // District scoping check
  if ((user.role === 'VERIFIER' || user.role === 'MANAGER' || user.role === 'PROVIDER_MANAGER') && user.district) {
    if (report.district && report.district.toLowerCase() !== user.district.toLowerCase()) {
      return res.status(403).json({ 
        error: `Access forbidden: Operational scope restricted to ${user.district} District. Record belongs to ${report.district} District.` 
      });
    }
  }

  const prev = report.status;
  report.status = 'NEEDS_INFORMATION';
  report.infoRequestedReason = reason;
  report.updatedAt = new Date().toISOString();
  db.saveReport(report);

  db.addStatusHistory({
    entityType: 'REPORT',
    entityId: report.id,
    previousStatus: prev,
    newStatus: 'NEEDS_INFORMATION',
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    reason,
    timestamp: new Date().toISOString()
  });

  db.addNotification({
    recipientId: report.reporterId,
    recipientRole: 'RESIDENT',
    eventType: 'REPORT_NEEDS_INFO',
    title: `Additional Information Needed for ${report.id}`,
    body: reason,
    reportId: report.id,
    priority: 'NORMAL',
    actionUrl: `/resident/reports/${report.id}`
  });

  res.json({ report });
});

// Generic update endpoint (PUT/PATCH) for reports
const handleReportUpdate = (req: express.Request, res: express.Response) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Authentication required' });
  if (user.status === 'DEACTIVATED') return res.status(403).json({ error: 'Account is deactivated. Contact system administration.' });

  const report = db.getReportById(req.params.id);
  if (!report) return res.status(404).json({ error: 'Report not found' });

  // District scoping check
  if ((user.role === 'VERIFIER' || user.role === 'MANAGER' || user.role === 'PROVIDER_MANAGER') && user.district) {
    if (report.district && report.district.toLowerCase() !== user.district.toLowerCase()) {
      return res.status(403).json({ 
        error: `Access forbidden: Operational scope restricted to ${user.district} District. Record belongs to ${report.district} District.` 
      });
    }
  }

  // Resident check
  if (user.role === 'RESIDENT' && report.reporterId !== user.id) {
    return res.status(403).json({ error: 'Access denied: You cannot access another resident\'s report.' });
  }

  const { status, additionalInfo, notes, description } = req.body;
  if (status) {
    if (user.role === 'RESIDENT' && status !== report.status) {
      return res.status(403).json({ error: 'Permission denied: Residents cannot modify report operational status.' });
    }
    const prev = report.status;
    report.status = status;
    db.addStatusHistory({
      entityType: 'REPORT',
      entityId: report.id,
      previousStatus: prev,
      newStatus: status,
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      reason: req.body.reason || `Status updated to ${status}`,
      timestamp: new Date().toISOString()
    });
  }
  if (additionalInfo !== undefined) report.additionalInfoProvided = additionalInfo;
  if (description !== undefined && user.role !== 'RESIDENT') report.description = description;
  report.updatedAt = new Date().toISOString();
  db.saveReport(report);

  res.json({ report: sanitizeReportForUser(report, user) });
};

router.put('/:id', handleReportUpdate);
router.patch('/:id', handleReportUpdate);

router.post('/:id/provide-information', (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Authentication required' });

  const { details } = req.body;
  if (!details) return res.status(400).json({ error: 'Details are required' });

  const report = db.getReportById(req.params.id);
  if (!report) return res.status(404).json({ error: 'Report not found' });

  if (user.role === 'RESIDENT' && report.reporterId !== user.id) {
    return res.status(403).json({ error: 'Unauthorized to update this report' });
  }

  const prev = report.status;
  report.status = 'UNDER_REVIEW';
  report.additionalInfoProvided = details;
  report.updatedAt = new Date().toISOString();
  db.saveReport(report);

  db.addStatusHistory({
    entityType: 'REPORT',
    entityId: report.id,
    previousStatus: prev,
    newStatus: 'UNDER_REVIEW',
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    reason: `Resident provided clarification: ${details}`,
    timestamp: new Date().toISOString()
  });

  db.addNotification({
    recipientId: 'ops-broadcast',
    recipientRole: 'VERIFIER',
    eventType: 'REPORT_UPDATED',
    title: `Clarification Provided for ${report.id}`,
    body: `${user.name} responded with additional details.`,
    reportId: report.id,
    priority: 'NORMAL',
    actionUrl: `/operations/reports/${report.id}`
  });

  res.json({ report });
});

router.get('/:id/duplicate-candidates', (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Authentication required' });

  const targetReport = db.getReportById(req.params.id);
  if (!targetReport) return res.status(404).json({ error: 'Report not found' });

  const allReports = db.getReports();
  const allIncidents = db.getIncidents();

  const candidateReports = allReports
    .filter(r => r.id !== targetReport.id)
    .map(r => {
      const distance = calculateDistanceMeters(
        targetReport.latitude,
        targetReport.longitude,
        r.latitude,
        r.longitude
      );
      let matchScore = 0;
      if (r.categoryId === targetReport.categoryId) matchScore += 40;
      if (distance < 500) matchScore += 40;
      else if (distance < 1500) matchScore += 25;
      else if (distance < 3000) matchScore += 10;
      if (r.district.toLowerCase() === targetReport.district.toLowerCase()) matchScore += 10;
      if (r.subArea && targetReport.subArea && r.subArea.toLowerCase() === targetReport.subArea.toLowerCase()) {
        matchScore += 10;
      }
      return { report: r, distanceMeters: Math.round(distance), matchScore };
    })
    .filter(item => item.matchScore >= 30)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5);

  const candidateIncidents = allIncidents
    .filter(i => i.status !== 'CLOSED' && i.status !== 'CANCELLED')
    .map(inc => {
      const distance = calculateDistanceMeters(
        targetReport.latitude,
        targetReport.longitude,
        inc.latitude,
        inc.longitude
      );
      let relevance = 0;
      if (inc.categoryId === targetReport.categoryId) relevance += 35;
      if (distance < inc.affectedRadiusMeters) relevance += 45;
      else if (distance < 2000) relevance += 25;
      if (inc.district.toLowerCase() === targetReport.district.toLowerCase()) relevance += 15;
      return { incident: inc, distanceMeters: Math.round(distance), relevance };
    })
    .filter(item => item.relevance >= 30)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 4);

  res.json({
    candidateReports,
    candidateIncidents
  });
});

export default router;
