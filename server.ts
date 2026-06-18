/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { z } from 'zod';
import { runAgent, AgentContext, AgentMessage } from './agent/index';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Request validation schemas
const MessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

const ChatRequestSchema = z.object({
  messages: z.array(MessageSchema).min(1),
  sheetsContext: z.object({
    isOfficialSheetsConnected: z.boolean().optional().default(false),
    userProfile: z.object({
      name: z.string().optional().default('Rossy'),
      email: z.string().optional().default('compraarza@gmail.com'),
    }).optional().default({ name: 'Rossy', email: 'compraarza@gmail.com' }),
    active_materials_catalog: z.array(z.any()).optional().default([]),
    active_purchase_orders: z.array(z.any()).optional().default([]),
    warehouse_entries: z.array(z.any()).optional().default([]),
  }),
});

function normalizeContext(raw: z.infer<typeof ChatRequestSchema>['sheetsContext']): AgentContext {
  return {
    isOfficialSheetsConnected: raw.isOfficialSheetsConnected,
    userProfile: {
      name: raw.userProfile.name || 'Rossy',
      email: raw.userProfile.email || 'compraarza@gmail.com',
    },
    materials: (raw.active_materials_catalog || []).map(m => ({
      code: String(m.code || ''),
      description: String(m.description || ''),
      unit: String(m.unit || 'PZ'),
      price: Number(m.price) || 0,
    })),
    orders: (raw.active_purchase_orders || []).map(o => ({
      id: String(o.id || ''),
      project: String(o.project || ''),
      code: String(o.code || ''),
      description: String(o.description || ''),
      unit: String(o.unit || 'PZ'),
      quantity: Number(o.quantity) || 0,
      price: Number(o.price) || 0,
      receivedQuantity: Number(o.receivedQuantity) || 0,
      status: ['pendiente', 'parcial', 'completado'].includes(o.status) ? o.status : 'pendiente',
      supplier: String(o.supplier || ''),
      total: Number(o.total) || 0,
    })),
    warehouse: (raw.warehouse_entries || []).map(w => ({
      id: String(w.id || ''),
      orderId: String(w.orderId || ''),
      code: String(w.code || w.materialCode || ''),
      description: String(w.description || w.materialName || ''),
      expectedQuantity: Number(w.expectedQuantity) || 0,
      receivedQuantity: Number(w.receivedQuantity) || 0,
      status: ['completo', 'discrepancia'].includes(w.status) ? w.status : 'completo',
      observer: String(w.observer || w.receivedBy || 'Kari'),
    })),
  };
}

// API endpoint for Rossy's conversational assistant
app.post('/api/gemini/chat', async (req, res) => {
  const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const startTime = Date.now();

  try {
    const parseResult = ChatRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      console.warn(`[${requestId}] Invalid request body:`, parseResult.error.flatten());
      return res.status(400).json({ error: 'Invalid request body', details: parseResult.error.flatten() });
    }

    const { messages, sheetsContext } = parseResult.data;
    const context = normalizeContext(sheetsContext);

    const result = await runAgent(messages as AgentMessage[], context, {
      apiKey: process.env.GEMINI_API_KEY,
      model: process.env.GEMINI_MODEL || 'gemini-2.5-pro',
    });

    console.log(`[${requestId}] Agent response in ${Date.now() - startTime}ms`, {
      model: result.metadata.model,
      fallback: result.metadata.fallback,
      hasAction: result.response.action !== null,
    });

    return res.json(result.response);
  } catch (err: any) {
    console.error(`[${requestId}] Gemini route error:`, err);
    return res.status(500).json({
      content: 'Lo siento Rossy, tuve un problema técnico procesando tu mensaje. ¿Podemos intentarlo de nuevo?',
      action: null,
    });
  }
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');
  res.json({ status: 'ok', agentMode: hasKey ? 'live' : 'demo' });
});

// Configure Vite middleware in development or static serving inside production
async function startServer() {
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
    console.log(`Arza Google Sheets Agent server running on http://0.0.0.0:${PORT}`);
    console.log(`Agent mode: ${process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY' ? 'LIVE (Gemini)' : 'DEMO (local)'}`);
  });
}

startServer();
