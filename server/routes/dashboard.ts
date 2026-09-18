import express from 'express';
import { db } from '../db.js';
import { getAuthUser } from './auth.js';

const router = express.Router();

router.get('/operations', (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Authentication required' });

  const reports = db.getReports();
  const incidents = db.getIncidents();
  const assignments = db.getAssignments();
  const categories = db.getCategories();
  const users = db.getUsers();

  const totalReports = reports.length;
  const unverifiedReports = reports.filter(r => r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW').length;
  const needsInfoReports = reports.filter(r => r.status === 'NEEDS_INFORMATION').length;
  const linkedReports = reports.filter(r => r.status === 'LINKED_TO_INCIDENT').length;

  const totalIncidents = incidents.length;
  const openIncidents = incidents.filter(i => i.status === 'OPEN' || i.status === 'ASSIGNED').length;
  const emergencyIncidents = incidents.filter(i => (i.priority === 'EMERGENCY' || i.priority === 'CRITICAL') && i.status !== 'CLOSED').length;
  const inProgressIncidents = incidents.filter(i => i.status === 'IN_PROGRESS' || i.status === 'EN_ROUTE' || i.status === 'ACCEPTED').length;
  const resolutionPendingIncidents = incidents.filter(i => i.status === 'RESOLUTION_PENDING').length;
  const reopenedIncidents = incidents.filter(i => i.status === 'REOPENED').length;
  const closedIncidents = incidents.filter(i => i.status === 'CLOSED').length;

  const engineers = users.filter(u => u.role === 'ENGINEER');
  const workloadByEngineer = engineers.map(eng => {
    const activeJobs = incidents.filter(i => i.engineerId === eng.id && i.status !== 'CLOSED').length;
    const completedJobs = assignments.filter(a => a.engineerId === eng.id && a.status === 'COMPLETED').length;
    return {
      engineerId: eng.id,
      name: eng.name,
      phone: eng.phone,
      activeJobs,
      completedJobs,
      status: eng.status
    };
  });

  const categoryCounts = categories.map(cat => {
    const count = reports.filter(r => r.categoryId === cat.id).length;
    return {
      categoryId: cat.id,
      name: cat.name,
      count,
      hazardLevel: cat.hazardLevel
    };
  }).filter(c => c.count > 0);

  const recentHistory = db.getStatusHistory().slice(-10).reverse();

  res.json({
    metrics: {
      totalReports,
      unverifiedReports,
      needsInfoReports,
      linkedReports,
      totalIncidents,
      openIncidents,
      emergencyIncidents,
      inProgressIncidents,
      resolutionPendingIncidents,
      reopenedIncidents,
      closedIncidents
    },
    workloadByEngineer,
    categoryCounts,
    recentHistory
  });
});

router.get('/map', (req, res) => {
  const incidents = db.getIncidents();
  const reports = db.getReports();

  const incidentMarkers = incidents.map(inc => ({
    id: inc.id,
    type: 'INCIDENT',
    title: inc.title,
    categoryName: inc.categoryName,
    priority: inc.priority,
    severity: inc.severity,
    status: inc.status,
    latitude: inc.latitude,
    longitude: inc.longitude,
    locationName: inc.locationName,
    district: inc.district,
    affectedCustomersEst: inc.affectedCustomersEst,
    affectedRadiusMeters: inc.affectedRadiusMeters,
    engineerName: inc.engineerName,
    relatedReportsCount: inc.relatedReportIds ? inc.relatedReportIds.length : 0,
    relatedReportIds: inc.relatedReportIds || [],
    reopenCount: inc.reopenCount,
    createdAt: inc.createdAt
  }));

  const unlinkedReports = reports
    .filter(r => r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW')
    .map(rep => ({
      id: rep.id,
      type: 'REPORT',
      title: rep.categoryName,
      categoryName: rep.categoryName,
      priority: rep.isSafetyCritical ? 'EMERGENCY' : 'NORMAL',
      severity: rep.hazardLevel,
      status: rep.status,
      latitude: rep.latitude,
      longitude: rep.longitude,
      locationName: rep.locationName,
      district: rep.district,
      reporterName: rep.reporterName,
      isSafetyCritical: rep.isSafetyCritical,
      createdAt: rep.createdAt
    }));

  res.json({
    incidents: incidentMarkers,
    unlinkedReports
  });
});

export default router;
