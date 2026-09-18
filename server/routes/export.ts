import express from 'express';
import { db } from '../db.js';
import { getAuthUser } from './auth.js';
import { maskName, maskPhone } from '../privacy-utils.js';

const router = express.Router();

function convertToCSV(items: Record<string, any>[]): string {
  if (items.length === 0) return '';
  const headers = Object.keys(items[0]);
  const headerLine = headers.map(h => `"${h}"`).join(',');
  const rows = items.map(item => {
    return headers.map(h => {
      let val = item[h];
      if (val === null || val === undefined) val = '';
      else if (typeof val === 'object') val = JSON.stringify(val);
      val = String(val).replace(/"/g, '""');
      return `"${val}"`;
    }).join(',');
  });
  return [headerLine, ...rows].join('\r\n');
}

/**
 * GET /api/export/dataset
 * Query params:
 *   - dataset: 'district_planning' | 'incidents' | 'reports' | 'personnel'
 *   - format: 'csv' | 'json'
 *   - district: optional district filter (for Admin; Manager is strictly locked to their district)
 */
router.get('/dataset', (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const isGlobalAdmin = user.role === 'ADMIN' || user.role === 'SYSTEM_ADMINISTRATOR';
  const isManager = user.role === 'MANAGER' || user.role === 'PROVIDER_MANAGER';

  if (!isGlobalAdmin && !isManager) {
    return res.status(403).json({ 
      error: 'Permission denied. Only System Administrators and District Managers may export system datasets.' 
    });
  }

  // Manager is strictly restricted to their assigned district
  let districtFilter = req.query.district ? String(req.query.district) : undefined;
  if (isManager) {
    districtFilter = user.district;
  }

  const dataset = String(req.query.dataset || 'district_planning');
  const format = String(req.query.format || 'json').toLowerCase();

  const allIncidents = db.getIncidents();
  const allReports = db.getReports();
  const allUsers = db.getUsers();
  const allAssignments = db.getAssignments();

  // Filter by district if applicable
  const filteredIncidents = districtFilter && districtFilter !== 'ALL'
    ? allIncidents.filter(i => i.district && i.district.toLowerCase() === districtFilter.toLowerCase())
    : allIncidents;

  const filteredReports = districtFilter && districtFilter !== 'ALL'
    ? allReports.filter(r => r.district && r.district.toLowerCase() === districtFilter.toLowerCase())
    : allReports;

  let records: Record<string, any>[] = [];
  let filename = `powerpulse_${dataset}_${districtFilter || 'national'}_${new Date().toISOString().slice(0, 10)}`;

  if (dataset === 'district_planning') {
    // Group metrics by district for infrastructure investment planning
    const districts = ['Kabale', 'Kisoro', 'Rukungiri', 'Kanungu', 'Ntungamo', 'Rubanda'];
    const targetDistricts = districtFilter && districtFilter !== 'ALL' ? [districtFilter] : districts;

    records = targetDistricts.map(dName => {
      const dIncidents = allIncidents.filter(i => i.district && i.district.toLowerCase() === dName.toLowerCase());
      const dReports = allReports.filter(r => r.district && r.district.toLowerCase() === dName.toLowerCase());
      const dManagers = allUsers.filter(u => (u.role === 'MANAGER' || u.role === 'PROVIDER_MANAGER') && u.district?.toLowerCase() === dName.toLowerCase());
      const dEngineers = allUsers.filter(u => u.role === 'ENGINEER' && u.district?.toLowerCase() === dName.toLowerCase());
      
      const closed = dIncidents.filter(i => i.status === 'CLOSED');
      const critical = dIncidents.filter(i => i.priority === 'EMERGENCY' || i.severity === 'CRITICAL');
      const confirmed = dIncidents.filter(i => i.residentConfirmationStatus === 'CONFIRMED');

      return {
        district: dName,
        totalIncidents: dIncidents.length,
        totalCitizenReports: dReports.length,
        emergencyFaults: critical.length,
        closedResolvedIncidents: closed.length,
        citizenConfirmedRatePercent: dIncidents.length > 0 ? Math.round((confirmed.length / (closed.length || 1)) * 100) : 100,
        activeManagers: dManagers.length,
        assignedEngineers: dEngineers.length,
        gridReliabilityStatus: critical.length > 2 ? 'STRESSED_INFRASTRUCTURE' : 'NORMAL_OPERATION',
        recommendedAction: critical.length > 2 ? 'Allocate Transformer Upgrades & Feeder Redundancy' : 'Standard Routine Maintenance',
        exportTimestamp: new Date().toISOString()
      };
    });
  } else if (dataset === 'incidents') {
    records = filteredIncidents.map(inc => ({
      incidentId: inc.id,
      title: inc.title,
      district: inc.district,
      locationName: inc.locationName,
      subArea: inc.subArea || '',
      latitude: inc.latitude,
      longitude: inc.longitude,
      priority: inc.priority,
      severity: inc.severity,
      status: inc.status,
      assignedEngineer: inc.engineerName || 'Unassigned',
      affectedRadiusMeters: inc.affectedRadiusMeters,
      affectedCustomersEst: inc.affectedCustomersEst,
      residentConfirmationStatus: inc.residentConfirmationStatus || 'PENDING',
      satisfactionRating: inc.residentFeedbackRating || '',
      createdAt: inc.createdAt,
      resolvedAt: inc.resolvedAt || '',
      closedAt: inc.closedAt || ''
    }));
  } else if (dataset === 'reports') {
    records = filteredReports.map(rep => ({
      reportId: rep.id,
      district: rep.district,
      locationName: rep.locationName,
      categoryName: rep.categoryName,
      status: rep.status,
      isSafetyCritical: rep.isSafetyCritical ? 'YES' : 'NO',
      // PII Protection: Name & Phone masked according to privacy mandates
      citizenNameRedacted: isGlobalAdmin ? rep.reporterName : maskName(rep.reporterName),
      citizenPhoneRedacted: isGlobalAdmin ? rep.reporterPhone : maskPhone(rep.reporterPhone),
      description: rep.description,
      linkedIncidentId: rep.linkedIncidentId || 'None',
      createdAt: rep.createdAt
    }));
  } else if (dataset === 'personnel') {
    const personnelUsers = allUsers.filter(u => 
      ['MANAGER', 'PROVIDER_MANAGER', 'VERIFIER', 'ENGINEER'].includes(u.role) &&
      (!districtFilter || districtFilter === 'ALL' || (u.district && u.district.toLowerCase() === districtFilter.toLowerCase()))
    );

    records = personnelUsers.map(u => {
      const engineerJobs = allAssignments.filter(a => a.engineerId === u.id);
      const completed = engineerJobs.filter(a => a.status === 'COMPLETED');

      return {
        userId: u.id,
        name: u.name,
        role: u.role,
        district: u.district || 'Unassigned',
        status: u.status,
        serviceArea: u.serviceArea || '',
        totalAssignments: engineerJobs.length,
        completedResolutions: completed.length,
        professionalId: u.professionalId || '',
        joinedDate: u.createdAt
      };
    });
  }

  // Audit log the data access
  db.addStatusHistory({
    entityType: 'REPORT',
    entityId: `export-${dataset}`,
    previousStatus: 'DATA_ACCESS',
    newStatus: 'DATA_EXPORTED',
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    reason: `Dataset "${dataset}" exported in ${format.toUpperCase()} format for district planning. District scope: ${districtFilter || 'National'}.`,
    timestamp: new Date().toISOString()
  });

  if (format === 'csv') {
    const csvData = convertToCSV(records);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
    return res.send(csvData);
  }

  res.json({
    dataset,
    districtScope: districtFilter || 'NATIONAL_ALL',
    generatedAt: new Date().toISOString(),
    totalRecords: records.length,
    records
  });
});

export default router;
