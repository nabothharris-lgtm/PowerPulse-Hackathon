import express from 'express';
import { db } from '../db.js';
import { User, UserRole, AccountStatus } from '../types.js';
import { hashPassword, verifyPassword } from '../auth-utils.js';

const router = express.Router();

export function getAuthUser(req: express.Request): User | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return null;
  }
  const token = authHeader.replace('Bearer ', '').trim();
  if (!token || token === 'undefined' || token === 'null') {
    return null;
  }
  const user = db.getUserById(token) || db.getUserByEmail(token) || db.getUserByPhone(token);
  if (!user) return null;
  return user;
}

export function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }
  if (user.status === 'DEACTIVATED') {
    return res.status(403).json({ error: 'Account is deactivated. Contact system administration.' });
  }
  (req as any).user = user;
  next();
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const user = getAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (user.status === 'DEACTIVATED') {
      return res.status(403).json({ error: 'Account is deactivated. Contact system administration.' });
    }
    if (user.status === 'SUSPENDED') {
      return res.status(403).json({ error: 'Account is suspended. Operational access is blocked.' });
    }
    if (user.status === 'PENDING_APPROVAL') {
      return res.status(403).json({ error: 'Account is pending approval. You do not have field privileges yet.' });
    }
    // Check role matches or matches aliases
    const hasRole = allowedRoles.some(r => {
      if (r === user.role) return true;
      if (r === 'MANAGER' && user.role === 'PROVIDER_MANAGER') return true;
      if (r === 'ADMIN' && user.role === 'SYSTEM_ADMINISTRATOR') return true;
      return false;
    });
    if (!hasRole) {
      return res.status(403).json({ 
        error: `Access forbidden: Role '${user.role}' is not authorized for this workspace or operation.` 
      });
    }
    (req as any).user = user;
    next();
  };
}

router.post('/login', (req, res) => {
  const { identifier, email, phone, password } = req.body;
  const loginInput = identifier || email || phone;
  if (!loginInput) {
    return res.status(400).json({ error: 'Email, phone number, or user identifier is required' });
  }
  const user = db.getUserByIdentifier(loginInput);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials. No registered user found with this email or phone.' });
  }
  if (user.status === 'DEACTIVATED') {
    return res.status(403).json({ error: 'Account has been deactivated. Contact regional administrator.' });
  }
  if (user.status === 'SUSPENDED') {
    return res.status(403).json({ error: 'Account is suspended. Operational access is blocked.' });
  }

  // Password verification
  if (password && !verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid password. Please check your credentials.' });
  }

  db.addAuditEvent({
    action: 'USER_LOGIN',
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    targetType: 'USER',
    targetId: user.id,
    details: `User logged in: ${user.name} (${user.role}, Status: ${user.status}, District: ${user.district || 'Unassigned'})`
  });

  const { passwordHash, ...sanitizedUser } = user;
  res.json({
    user: sanitizedUser,
    token: user.id
  });
});

router.post('/register', (req, res) => {
  const { name, email, phone, password, district = 'Kabale', subArea, role } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ error: 'Full name and phone number are required' });
  }
  // Public registration CANNOT be used to create privileged staff
  if (role && role !== 'RESIDENT') {
    return res.status(403).json({ 
      error: 'Privileged operational accounts (Engineer, Verifier, Manager, Admin) cannot be created via public registration. Contact regional utility administration.' 
    });
  }

  const existingByPhone = db.getUserByPhone(phone);
  if (existingByPhone) {
    return res.status(409).json({ error: 'An account with this phone number already exists.' });
  }
  if (email) {
    const existingByEmail = db.getUserByEmail(email);
    if (existingByEmail) {
      return res.status(409).json({ error: 'An account with this email address already exists.' });
    }
  }

  const newUser: User = {
    id: `usr-res-${Date.now()}`,
    name: name.trim(),
    email: (email || `${phone.replace(/[^0-9]/g, '')}@powerpulse.resident`).toLowerCase().trim(),
    phone: phone.trim(),
    role: 'RESIDENT',
    status: 'ACTIVE',
    district: district.trim(),
    subArea: subArea ? subArea.trim() : undefined,
    passwordHash: hashPassword(password || 'demo1234'),
    createdAt: new Date().toISOString()
  };

  db.saveUser(newUser);

  db.addAuditEvent({
    action: 'COMMUNITY_MEMBER_REGISTERED',
    actorId: newUser.id,
    actorName: newUser.name,
    actorRole: 'RESIDENT',
    targetType: 'USER',
    targetId: newUser.id,
    details: `New community member registered: ${newUser.name} (${newUser.phone}, District: ${newUser.district})`
  });

  db.addNotification({
    recipientId: newUser.id,
    recipientRole: 'RESIDENT',
    eventType: 'ACCOUNT_CREATED',
    title: 'Welcome to PowerPulse Uganda',
    body: 'Your community member account is active. You can now report electricity outages, hazards, and track response teams in real time.',
    priority: 'LOW',
    actionUrl: '/resident-home'
  });

  const { passwordHash: _, ...sanitizedUser } = newUser;
  res.status(201).json({
    user: sanitizedUser,
    token: newUser.id,
    message: 'Account registered successfully as Community Member.'
  });
});

router.patch('/profile', requireAuth, (req, res) => {
  const user = (req as any).user as User;
  const { role, status, name, phone, subArea } = req.body;

  // Security test 9: Resident or any user attempts to change their own role
  if (role && role !== user.role) {
    db.addAuditEvent({
      action: 'UNAUTHORIZED_ROLE_CHANGE_ATTEMPT',
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      targetType: 'USER',
      targetId: user.id,
      details: `SECURITY VIOLATION: User ${user.name} attempted self-promotion from ${user.role} to ${role}. Operation blocked.`
    });
    return res.status(403).json({ 
      error: 'Unauthorized: Users cannot modify their own security role. Only System Administrators can alter account roles.' 
    });
  }

  if (status && status !== user.status) {
    return res.status(403).json({ 
      error: 'Unauthorized: Users cannot change their own account status.' 
    });
  }

  if (name) user.name = name.trim();
  if (phone) user.phone = phone.trim();
  if (subArea !== undefined) user.subArea = subArea.trim();

  db.saveUser(user);
  const { passwordHash: _, ...sanitized } = user;
  res.json({ user: sanitized });
});

router.post('/forgot-password', (req, res) => {
  const { identifier } = req.body;
  // Does not leak account existence
  res.json({ 
    success: true, 
    message: 'If a matching account exists, password recovery instructions have been dispatched.' 
  });
});

router.post('/apply-engineer', (req, res) => {
  const { 
    name, 
    email, 
    phone, 
    professionalId, 
    organizationId = 'org-uedcl-kigezi', 
    serviceArea = 'Kabale Municipality', 
    applicationNotes 
  } = req.body;

  if (!name || !phone || !professionalId) {
    return res.status(400).json({ 
      error: 'Full name, phone, and professional wireman/engineer license number are required.' 
    });
  }

  const existing = db.getUserByIdentifier(phone) || (email ? db.getUserByEmail(email) : null);
  if (existing) {
    return res.status(409).json({ error: 'An account with this phone or email already exists.' });
  }

  const newApplicant: User = {
    id: `usr-eng-${Date.now()}`,
    name: name.trim(),
    email: (email || `${phone.replace(/[^0-9]/g, '')}@powerpulse.eng`).toLowerCase().trim(),
    phone: phone.trim(),
    role: 'ENGINEER',
    organizationId,
    status: 'PENDING_APPROVAL',
    professionalId: professionalId.trim(),
    serviceArea: serviceArea.trim(),
    applicationNotes: applicationNotes ? applicationNotes.trim() : 'Applied via professional portal',
    createdAt: new Date().toISOString()
  };

  db.saveUser(newApplicant);

  db.addAuditEvent({
    action: 'ENGINEER_APPLICATION_SUBMITTED',
    actorId: newApplicant.id,
    actorName: newApplicant.name,
    actorRole: 'ENGINEER',
    targetType: 'USER',
    targetId: newApplicant.id,
    details: `Field Engineer application submitted by ${newApplicant.name} (License: ${professionalId}, Org: ${organizationId}, Area: ${serviceArea})`
  });

  const managers = db.getUsers().filter(u => u.role === 'MANAGER' || u.role === 'ADMIN');
  for (const mgr of managers) {
    db.addNotification({
      recipientId: mgr.id,
      recipientRole: mgr.role,
      eventType: 'ENGINEER_APPLICATION_RECEIVED',
      title: 'New Engineer Credential Application',
      body: `${newApplicant.name} submitted an application for Field Engineer in ${serviceArea}. License: ${professionalId}.`,
      priority: 'NORMAL',
      actionUrl: '/manager-applications'
    });
  }

  res.status(201).json({
    user: newApplicant,
    token: newApplicant.id,
    message: 'Application received. Your credentials are under review by the distribution manager.'
  });
});

router.get('/me', (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  res.json({ user });
});

router.post('/logout', (req, res) => {
  const user = getAuthUser(req);
  if (user) {
    db.addAuditEvent({
      action: 'USER_LOGOUT',
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      targetType: 'USER',
      targetId: user.id,
      details: `User logged out: ${user.name}`
    });
  }
  res.json({ success: true, message: 'Logged out successfully' });
});

router.get('/demo-users', (req, res) => {
  const users = db.getUsers().map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    organizationId: u.organizationId,
    teamId: u.teamId,
    status: u.status,
    professionalId: u.professionalId,
    serviceArea: u.serviceArea
  }));
  res.json({ users, personas: users });
});

router.get('/personas', (req, res) => {
  const users = db.getUsers().map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    organizationId: u.organizationId,
    teamId: u.teamId,
    status: u.status,
    professionalId: u.professionalId,
    serviceArea: u.serviceArea
  }));
  res.json({ personas: users, users });
});

export default router;
