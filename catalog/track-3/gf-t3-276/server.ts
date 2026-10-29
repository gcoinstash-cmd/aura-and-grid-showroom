/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GF-T3-276 · GridSync Express API Server + Vite Middleware
 */

import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import {
  createInitialEngineState,
  applyEngineCommand,
  EngineStateSnapshot,
} from './src/engine/dmaEngine';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let engineState: EngineStateSnapshot = createInitialEngineState();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '64kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      title: 'GF-T3-276',
      status: 'LOCKED',
      dmaThroughput:
        engineState.dmaThroughputGbs.toLocaleString('en-US') + ' GB/s',
      offloadLatency: String(engineState.offloadLatencyUs) + ' µs',
      activeChannels: String(engineState.activeChannels) + ' Channels',
      processedTokens:
        engineState.processedTokens.toLocaleString('en-US') + ' Units',
      dmaState: engineState.dmaState,
    });
  });

  app.get('/api/telemetry', (_req, res) => {
    res.json(engineState);
  });

  app.post('/api/command', (req, res) => {
    try {
      engineState = applyEngineCommand(engineState, req.body);
      res.json(engineState);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'GridSync Validation Error';
      res.status(400).json({ error: message });
    }
  });

  app.get('/api/schema', (_req, res) => {
    try {
      const sqlPath = path.resolve(__dirname, 'schema.sql');
      const sqlContent = fs.readFileSync(sqlPath, 'utf-8');
      res.json({
        chassis: 'GF-T3-276',
        engine: 'PostgreSQL 16 / Supabase RLS Partitioned Schema',
        sql: sqlContent,
      });
    } catch (_err) {
      res.status(500).json({ error: 'Unable to read schema.sql' });
    }
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
    console.log('GF-T3-276 GridSync Server listening on port ' + String(PORT));
  });
}

startServer();
