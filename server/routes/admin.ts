import express from 'express';
import { db } from '../db.js';
import { requireRole } from './auth.js';
import { UserRole, AccountStatus, User } from '../types.js';
import { hashPassword } from '../auth-utils.js';

const router = express.Router();

router.get('/overview', requireRole('ADMIN', 'MANAGER'), (req, res) => {
  const user = (req as any).user as User;
  let users = db.getUsers();
  let teams = db.getTeams();
  let organizations = db.getOrganizations();

  if (user.role === 'MANAGER' && user.organizationId) {
    users = users.filter(u => u.organizationId === user.organizationId || u.role === 'RESIDENT');
    teams = teams.filter(t => t.organizationId === user.organizationId);
    organizations = organizations.filter(o => o.id === user.organizationId);
  }

  res.json({
    users,
    organizations,
    teams,
    locations: db.getLocations(),
    categories: db.getCategories(),
    slaPolicies: db.getSlaPolicies(),
    auditEvents: db.getAuditEvents().slice(0, 50),
    pendingApplicationsCount: db.getPendingApplications().length
  });
});

router.get('/applications', requireRole('ADMIN', 'MANAGER'), (req, res) => {
  const user = (req as any).user as User;
  let applications = db.getPendingApplications();

  if (user.role === 'MANAGER' && user.organizationId) {
    applications = applications.filter(
      a => !a.organizationId || a.organizationId === user.organizationId
    );
  }

  res.json({ applications });
});

router.post('/applications/:id/review', requireRole('ADMIN', 'MANAGER'), (req, res) => {
  const reviewer = (req as any).user as User;
  const { decision, teamId, rejectionReason } = req.body;

  if (!decision || (decision !== 'APPROVE' && decision !== 'REJECT')) {
    return res.status(400).json({ error: "Decision must be either 'APPROVE' or 'REJECT'" });
  }

  const applicant = db.getUserById(req.params.id);
  if (!applicant) {
    return res.status(404).json({ error: 'Applicant user not found' });
  }

  if (applicant.status !== 'PENDING_APPROVAL') {
    return res.status(400).json({ 
      error: `Applicant is currently in '${applicant.status}' state, not PENDING_APPROVAL.` 
    });
  }

  const now = new Date().toISOString();

  if (decision === 'APPROVE') {
    applicant.role = 'ENGINEER';
    applicant.status = 'ACTIVE';
    if (teamId) applicant.teamId = teamId;
    if (!applicant.organizationId && reviewer.organizationId) {
      applicant.organizationId = reviewer.organizationId;
    }
    applicant.applicationReviewedAt = now;
    applicant.applicationReviewedBy = reviewer.name;
    db.saveUser(applicant);

    if (teamId) {
      const team = db.getTeams().find(t => t.id === teamId);
      if (team && !team.memberIds.includes(applicant.id)) {
        team.memberIds.push(applicant.id);
        db.persist();
      }
    }

    db.addAuditEvent({
      action: 'ENGINEER_APPLICATION_APPROVED',
      actorId: reviewer.id,
      actorName: reviewer.name,
      actorRole: reviewer.role,
      targetType: 'USER',
      targetId: applicant.id,
      details: `Approved Engineer application for ${applicant.name} (License: ${applicant.professionalId || 'N/A'}). Role set to ENGINEER, status ACTIVE.`
    });

    db.addNotification({
      recipientId: applicant.id,
      recipientRole: 'ENGINEER',
      eventType: 'APPLICATION_APPROVED',
      title: 'Engineer Credentials Approved',
      body: `Congratulations ${applicant.name}. Your field engineer credentials have been verified. You may now access My Jobs and receive assignments.`,
      priority: 'HIGH',
      actionUrl: '/engineer-jobs'
    });

    return res.json({
      success: true,
      user: applicant,
      message: `Engineer application for ${applicant.name} has been approved.`
    });
  } else {
    applicant.status = 'REJECTED';
    applicant.rejectionReason = rejectionReason || 'Professional credentials could not be verified against the regulatory registry.';
    applicant.applicationReviewedAt = now;
    applicant.applicationReviewedBy = reviewer.name;
    db.saveUser(applicant);

    db.addAuditEvent({
      action: 'ENGINEER_APPLICATION_REJECTED',
      actorId: reviewer.id,
      actorName: reviewer.name,
      actorRole: reviewer.role,
      targetType: 'USER',
      targetId: applicant.id,
      details: `Rejected Engineer application for ${applicant.name}. Reason: ${applicant.rejectionReason}`
    });

    db.addNotification({
      recipientId: applicant.id,
      recipientRole: 'ENGINEER',
      eventType: 'APPLICATION_REJECTED',
      title: 'Application Not Approved',
      body: `Your engineer application was not approved: ${applicant.rejectionReason}. Please contact regional operations with updated documentation.`,
      priority: 'NORMAL',
      actionUrl: '/applicant-status'
    });

    return res.json({
      success: true,
      user: applicant,
      message: `Engineer application for ${applicant.name} has been rejected.`
    });
  }
});

router.get('/users', requireRole('ADMIN'), (req, res) => {
  const users = db.getUsers().map(u => {
    const { passwordHash: _, ...rest } = u;
    return rest;
  });
  res.json({ users });
});

router.post('/users', requireRole('ADMIN'), (req, res) => {
  const admin = (req as any).user as User;
  const { name, email, phone, role, organizationId, teamId, district = 'Kabale', professionalId, password, initialPassword } = req.body;

  if (!name || !email || !phone || !role) {
    return res.status(400).json({ error: 'Name, email, phone, and role are required' });
  }

  const existing = db.getUserByEmail(email) || db.getUserByPhone(phone);
  if (existing) {
    return res.status(409).json({ error: 'User with this email or phone already exists' });
  }

  const targetDistrict = (district || 'Kabale').trim();

  // Limit checks:
  if (role === 'ADMIN' || role === 'SYSTEM_ADMINISTRATOR') {
    const existingActiveAdmin = db.getUsers().find(u => 
      (u.role === 'ADMIN' || u.role === 'SYSTEM_ADMINISTRATOR') && u.status === 'ACTIVE'
    );
    if (existingActiveAdmin) {
      return res.status(409).json({ 
        error: `The system already has an active System Administrator (${existingActiveAdmin.name}). Deployment policy permits exactly one active System Administrator.` 
      });
    }
  }

  if (role === 'VERIFIER') {
    const existingActiveVerifier = db.getUsers().find(u => 
      u.role === 'VERIFIER' && 
      u.status === 'ACTIVE' && 
      u.district?.toLowerCase() === targetDistrict.toLowerCase()
    );
    if (existingActiveVerifier) {
      return res.status(409).json({ 
        error: `District '${targetDistrict}' already has an active Verifier (${existingActiveVerifier.name}). PowerPulse mandates a maximum of one active Verifier per district.` 
      });
    }
  }

  if (role === 'MANAGER' || role === 'PROVIDER_MANAGER') {
    const existingActiveManager = db.getUsers().find(u => 
      (u.role === 'MANAGER' || u.role === 'PROVIDER_MANAGER') && 
      u.status === 'ACTIVE' && 
      u.district?.toLowerCase() === targetDistrict.toLowerCase()
    );
    if (existingActiveManager) {
      return res.status(409).json({ 
        error: `District '${targetDistrict}' already has an active Provider Manager (${existingActiveManager.name}) for this district. Maximum one active provider manager allowed per district.` 
      });
    }
  }

  const newUser: User = {
    id: `usr-${role.toLowerCase()}-${Date.now()}`,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone: phone.trim(),
    role: role as UserRole,
    status: 'ACTIVE',
    district: targetDistrict,
    passwordHash: hashPassword(password || initialPassword || 'demo1234'),
    organizationId,
    teamId,
    professionalId,
    createdAt: new Date().toISOString()
  };

  db.saveUser(newUser);

  db.addAuditEvent({
    action: 'USER_ADMIN_CREATED',
    actorId: admin.id,
    actorName: admin.name,
    actorRole: 'ADMIN',
    targetType: 'USER',
    targetId: newUser.id,
    details: `Admin provisioned ${newUser.name} as ${newUser.role} for ${newUser.district} district`
  });

  const { passwordHash: _, ...sanitized } = newUser;
  res.status(201).json({ user: sanitized });
});

const handleUserUpdate = (req: express.Request, res: express.Response) => {
  const admin = (req as any).user as User;
  const target = db.getUserById(req.params.id);
  if (!target) return res.status(404).json({ error: 'User not found' });

  const { role, status, teamId, organizationId, district, professionalId } = req.body;
  const targetDistrict = (district || target.district || 'Kabale').trim();
  const effectiveRole = (role || target.role) as UserRole;
  const effectiveStatus = (status || target.status) as AccountStatus;

  // Validate limits if role or status becomes active
  if (effectiveStatus === 'ACTIVE') {
    if (effectiveRole === 'ADMIN' || effectiveRole === 'SYSTEM_ADMINISTRATOR') {
      const existingActiveAdmin = db.getUsers().find(u => 
        u.id !== target.id && 
        (u.role === 'ADMIN' || u.role === 'SYSTEM_ADMINISTRATOR') && 
        u.status === 'ACTIVE'
      );
      if (existingActiveAdmin) {
        return res.status(409).json({ 
          error: `The system already has an active System Administrator (${existingActiveAdmin.name}). Deployment policy permits exactly one active System Administrator.` 
        });
      }
    }

    if (effectiveRole === 'VERIFIER') {
      const existingActiveVerifier = db.getUsers().find(u => 
        u.id !== target.id && 
        u.role === 'VERIFIER' && 
        u.status === 'ACTIVE' && 
        u.district?.toLowerCase() === targetDistrict.toLowerCase()
      );
      if (existingActiveVerifier) {
        return res.status(409).json({ 
          error: `District '${targetDistrict}' already has an active Verifier (${existingActiveVerifier.name}). PowerPulse mandates a maximum of one active Verifier per district.` 
        });
      }
    }

    if (effectiveRole === 'MANAGER' || effectiveRole === 'PROVIDER_MANAGER') {
      const existingActiveManager = db.getUsers().find(u => 
        u.id !== target.id && 
        (u.role === 'MANAGER' || u.role === 'PROVIDER_MANAGER') && 
        u.status === 'ACTIVE' && 
        u.district?.toLowerCase() === targetDistrict.toLowerCase()
      );
      if (existingActiveManager) {
        return res.status(409).json({ 
          error: `District '${targetDistrict}' already has an active Provider Manager (${existingActiveManager.name}). Maximum one active provider manager allowed per district.` 
        });
      }
    }
  }

  const changes: string[] = [];

  if (role && role !== target.role) {
    changes.push(`role ${target.role} -> ${role}`);
    target.role = role as UserRole;
  }
  if (status && status !== target.status) {
    changes.push(`status ${target.status} -> ${status}`);
    target.status = status as AccountStatus;
  }
  if (district && district !== target.district) {
    changes.push(`district ${target.district || 'none'} -> ${district}`);
    target.district = district.trim();
  }
  if (professionalId !== undefined) {
    target.professionalId = professionalId.trim();
  }
  if (teamId !== undefined && teamId !== target.teamId) {
    changes.push(`team ${target.teamId || 'none'} -> ${teamId}`);
    target.teamId = teamId;
  }
  if (organizationId !== undefined && organizationId !== target.organizationId) {
    changes.push(`org ${target.organizationId || 'none'} -> ${organizationId}`);
    target.organizationId = organizationId;
  }

  db.saveUser(target);

  db.addAuditEvent({
    action: target.status === 'DEACTIVATED' ? 'USER_DEACTIVATED' : 'USER_ROLE_OR_STATUS_CHANGED',
    actorId: admin.id,
    actorName: admin.name,
    actorRole: admin.role,
    targetType: 'USER',
    targetId: target.id,
    details: `Admin modified ${target.name} (${target.role}): ${changes.join(', ')}`
  });

  const { passwordHash: _, ...sanitized } = target;
  res.json({ user: sanitized });
};

router.patch('/users/:id', requireRole('ADMIN'), handleUserUpdate);
router.put('/users/:id', requireRole('ADMIN'), handleUserUpdate);

router.post('/categories', requireRole('ADMIN'), (req, res) => {
  const { name, residentLabel, description, hazardLevel, defaultPriority, defaultSeverity, safetyWarning } = req.body;
  if (!name || !residentLabel) return res.status(400).json({ error: 'Name and resident label required' });

  const newCat = {
    id: `cat-${Date.now()}`,
    name,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    residentLabel,
    description: description || '',
    hazardLevel: hazardLevel || 'LOW',
    defaultPriority: defaultPriority || 'NORMAL',
    defaultSeverity: defaultSeverity || 'MEDIUM',
    safetyWarning,
    active: true
  };

  db.getCategories().push(newCat);
  db.persist();

  res.status(201).json({ category: newCat });
});

router.post('/reset-demo', requireRole('ADMIN'), (req, res) => {
  db.resetToDefaults();
  res.json({ success: true, message: 'Database reset to initial demo state with full seed records.' });
});

export default router;
