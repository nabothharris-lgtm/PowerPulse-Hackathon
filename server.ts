import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import authRouter from './server/routes/auth.js';
import reportsRouter from './server/routes/reports.js';
import incidentsRouter from './server/routes/incidents.js';
import assignmentsRouter from './server/routes/assignments.js';
import notificationsRouter from './server/routes/notifications.js';
import dashboardRouter from './server/routes/dashboard.js';
import adminRouter from './server/routes/admin.js';
import exportRouter from './server/routes/export.js';
import { db } from './server/db.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API Routes FIRST
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'PowerPulse Backend',
      version: '1.0.0-uganda',
      timestamp: new Date().toISOString()
    });
  });

  // Reference lists
  app.get('/api/categories', (req, res) => {
    res.json({ categories: db.getCategories() });
  });

  app.get('/api/locations', (req, res) => {
    res.json({ locations: db.getLocations() });
  });

  // Sub-routers
  app.use('/api/auth', authRouter);
  app.use('/api/reports', reportsRouter);
  app.use('/api/incidents', incidentsRouter);
  app.use('/api/assignments', assignmentsRouter);
  app.use('/api/notifications', notificationsRouter);
  app.use('/api/dashboard', dashboardRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/export', exportRouter);

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PowerPulse server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
