import express from 'express';
import { db } from '../db.js';
import { getAuthUser } from './auth.js';

const router = express.Router();

router.get('/', (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Authentication required' });

  const notifications = db.getNotificationsForUser(user);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  res.json({
    notifications,
    unreadCount
  });
});

router.post('/:id/read', (req, res) => {
  db.markNotificationRead(req.params.id);
  res.json({ success: true });
});

router.post('/read-all', (req, res) => {
  const user = getAuthUser(req);
  db.markAllNotificationsRead(user ? user.id : undefined);
  res.json({ success: true });
});

export default router;
