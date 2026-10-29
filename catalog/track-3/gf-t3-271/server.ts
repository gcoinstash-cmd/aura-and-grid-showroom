/**
 * GF-T3-271: GridSync Express + Vite Full-Stack Backend Engine
 * SPDX-License-Identifier: MIT
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import {
  SYNTHETIC_CORRIDORS,
  executeExpertRoutingPass,
  GridSyncDispatchInputSchema,
} from './src/engine/expertRouter.ts';
import { SUPABASE_POSTGRES_SCHEMA_SQL } from './src/engine/sqlSchema.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '64kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      projectTitle: 'GF-T3-271',
      status: 'LOCKED',
      mode: 'EXPERT_PARALLEL',
      corridors: SYNTHETIC_CORRIDORS,
    });
  });

  app.post('/api/dispatch', (req, res) => {
    const parsed = GridSyncDispatchInputSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(422).json({
        error: 'GridSync Zero-Trust Sanitization Gate Rejected Payload',
        issues: parsed.error.issues.map((i) => i.message),
      });
      return;
    }
    const telemetry = executeExpertRoutingPass(parsed.data);
    res.json(telemetry);
  });

  app.get('/api/schema', (_req, res) => {
    res.type('text/plain').send(SUPABASE_POSTGRES_SCHEMA_SQL);
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log('[GF-T3-271] GridSync Expert-Parallelism Engine online at port ' + String(PORT));
  });
}

startServer();
