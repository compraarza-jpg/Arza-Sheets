# Audit and Correction Tools for Rossy — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Darle a Rossy herramientas reales para detectar, entender y corregir inconsistencias en materiales, órdenes y bodega usando el agente Gemini, Firebase y Google Sheets, sin modificar automáticamente los archivos originales.

**Architecture:** Extender el backend Express con nuevos endpoints de auditoría que usan el agente Gemini para analizar datos y proponer correcciones. El frontend mostrará estas propuestas en un dashboard de alertas y una vista de auditoría accionable, permitiendo a Rossy aprobar/rechazar cambios. Las correcciones aprobadas se reflejarán en Firestore y opcionalmente en una hoja auxiliar de Google Sheets.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind v4, Express, Zod, Google Gemini (`@google/genai`), Firebase Auth/Firestore, Google Sheets API.

---

## File Structure

- `agent/prompts.ts` — prompts del agente, se extienden con prompts de auditoría.
- `agent/schema.ts` — se agregan esquemas `audit_report`, `code_suggestion`, `duplicate_group`.
- `agent/engine.ts` — ya existe; se reutiliza.
- `agent/index.ts` — fábrica de engines; se reutiliza.
- `agent/audit.ts` — NUEVO: funciones puras para análisis local de inconsistencias (fallback si no hay API key).
- `server.ts` — se agregan endpoints `/api/gemini/audit`, `/api/gemini/suggest-code`, `/api/gemini/detect-duplicates`.
- `src/App.tsx` — se conectan nuevas funciones y se refactoriza el dashboard.
- `src/components/AuditView.tsx` — NUEVO: vista de auditoría accionable.
- `src/components/DashboardView.tsx` — NUEVO: centro de control con alertas.
- `src/components/CatalogView.tsx` — NUEVO: catálogo con sugerencias de códigos.
- `src/components/WarehouseView.tsx` — NUEVO: bodega simplificada para almacenistas.
- `src/types.ts` — se extienden tipos con `AuditIssue`, `CodeSuggestion`, `DuplicateGroup`.
- `src/firestore.ts` — se agregan funciones para guardar acciones de auditoría.

---

## Task 1: Extender tipos y esquemas de auditoría

**Files:**
- Modify: `src/types.ts`
- Modify: `agent/schema.ts`

- [ ] **Step 1: Agregar tipos de auditoría en `src/types.ts`**

```typescript
export interface AuditIssue {
  id: string;
  type: 'price_mismatch' | 'orphan_code' | 'warehouse_discrepancy' | 'duplicate_material';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  impact: number; // dinero en riesgo o cantidad afectada
  data: {
    orderId?: string;
    materialCode?: string;
    project?: string;
    supplier?: string;
    expected?: number;
    actual?: number;
    suggestedValue?: number | string;
  };
  suggestedAction: string;
  resolved: boolean;
}

export interface CodeSuggestion {
  materialDescription: string;
  currentCode?: string;
  suggestedCode: string;
  suggestedPrice: number;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
}

export interface DuplicateGroup {
  canonicalDescription: string;
  suggestedCode: string;
  items: Array<{ code: string; description: string; occurrences: number }>;
}
```

- [ ] **Step 2: Agregar esquemas Zod en `agent/schema.ts`**

```typescript
export const AuditReportSchema = z.object({
  issues: z.array(z.object({
    id: z.string(),
    type: z.enum(['price_mismatch', 'orphan_code', 'warehouse_discrepancy', 'duplicate_material']),
    severity: z.enum(['critical', 'warning', 'info']),
    title: z.string(),
    description: z.string(),
    impact: z.number(),
    data: z.object({
      orderId: z.string().optional(),
      materialCode: z.string().optional(),
      project: z.string().optional(),
      supplier: z.string().optional(),
      expected: z.number().optional(),
      actual: z.number().optional(),
      suggestedValue: z.union([z.number(), z.string()]).optional()
    }),
    suggestedAction: z.string(),
    resolved: z.boolean()
  }))
});

export const CodeSuggestionSchema = z.object({
  suggestions: z.array(z.object({
    materialDescription: z.string(),
    currentCode: z.string().optional(),
    suggestedCode: z.string(),
    suggestedPrice: z.number(),
    confidence: z.enum(['high', 'medium', 'low']),
    reason: z.string()
  }))
});

export const DuplicateReportSchema = z.object({
  groups: z.array(z.object({
    canonicalDescription: z.string(),
    suggestedCode: z.string(),
    items: z.array(z.object({
      code: z.string(),
      description: z.string(),
      occurrences: z.number()
    }))
  }))
});
```

- [ ] **Step 3: Verificar `npm run lint` pasa**

---

## Task 2: Crear motor de auditoría local (fallback)

**Files:**
- Create: `agent/audit.ts`

- [ ] **Step 1: Crear `agent/audit.ts` con funciones de análisis puro**

```typescript
import { Material, PurchaseOrder, WarehouseEntry, AuditIssue, CodeSuggestion, DuplicateGroup } from '../src/types';

export function analyzePriceMismatches(materials: Material[], orders: PurchaseOrder[]): AuditIssue[] {
  return orders
    .map(order => {
      const match = materials.find(m => m.code === order.code);
      if (!match || match.price === order.price) return null;
      const impact = Math.abs(order.price - match.price) * order.quantity;
      return {
        id: `price-${order.id}`,
        type: 'price_mismatch' as const,
        severity: impact > 5000 ? 'critical' : 'warning',
        title: `Precio desfasado en ${order.id}`,
        description: `El material "${order.description}" tiene precio de orden $${order.price} vs catálogo $${match.price}.`,
        impact,
        data: { orderId: order.id, materialCode: order.code, project: order.project, supplier: order.supplier, expected: match.price, actual: order.price },
        suggestedAction: `Ajustar precio de orden a $${match.price}`,
        resolved: false
      };
    })
    .filter(Boolean) as AuditIssue[];
}

export function analyzeOrphanCodes(materials: Material[], orders: PurchaseOrder[]): AuditIssue[] {
  return orders
    .filter(order => !materials.some(m => m.code === order.code))
    .map(order => ({
      id: `orphan-${order.id}`,
      type: 'orphan_code' as const,
      severity: 'warning' as const,
      title: `Código huérfano en ${order.id}`,
      description: `La orden usa "${order.description}" pero no existe en el catálogo maestro.`,
      impact: 0,
      data: { orderId: order.id, materialCode: order.code, project: order.project, supplier: order.supplier },
      suggestedAction: 'Asignar código oficial desde el catálogo',
      resolved: false
    }));
}

export function analyzeWarehouseDiscrepancies(orders: PurchaseOrder[], warehouse: WarehouseEntry[]): AuditIssue[] {
  return warehouse
    .filter(entry => entry.status === 'discrepancia' || entry.expectedQuantity !== entry.receivedQuantity)
    .map(entry => {
      const order = orders.find(o => o.id === entry.orderId);
      const price = order?.price || 0;
      const gap = (entry.expectedQuantity || 0) - (entry.receivedQuantity || 0);
      return {
        id: `wh-${entry.id}`,
        type: 'warehouse_discrepancy' as const,
        severity: gap > 0 ? 'critical' : 'warning',
        title: `Faltante en recepción ${entry.id}`,
        description: `Se esperaban ${entry.expectedQuantity} ${entry.description} y llegaron ${entry.receivedQuantity}.`,
        impact: gap * price,
        data: { orderId: entry.orderId, materialCode: entry.code, expected: entry.expectedQuantity, actual: entry.receivedQuantity },
        suggestedAction: `Contactar proveedor por ${gap} unidades faltantes`,
        resolved: false
      };
    });
}

export function detectDuplicates(materials: Material[]): DuplicateGroup[] {
  // Placeholder: implementar fuzzy matching básico o delegar a Gemini
  return [];
}
```

- [ ] **Step 2: Verificar lint**

---

## Task 3: Extender prompts del agente para auditoría

**Files:**
- Modify: `agent/prompts.ts`

- [ ] **Step 1: Agregar sección de auditoría al prompt del agente**

```typescript
export const auditSystemPrompt = `Eres un auditor de datos de construcción para Constructora Arza.
Analiza el catálogo de materiales, las órdenes de compra y las entradas de bodega.
Detecta:
1. Precios de ordenes que no coincidan con el catálogo maestro.
2. Órdenes con códigos que no existan en el catálogo.
3. Entradas de bodega con cantidades recibidas diferentes a las esperadas.
4. Materiales duplicados con descripciones similares.

Para cada problema devuelve:
- id único
- tipo: price_mismatch | orphan_code | warehouse_discrepancy | duplicate_material
- severidad: critical | warning | info
- título corto
- descripción clara para Rossy
- impacto estimado en pesos mexicanos
- datos relevantes
- acción sugerida
- resolved: false

Sé conservador. Si no estás seguro, marca confidence baja y no inventes datos.`;
```

- [ ] **Step 2: Agregar función `buildAuditPrompt(context)`**

```typescript
export function buildAuditPrompt(context: { materials: Material[], orders: PurchaseOrder[], warehouse: WarehouseEntry[] }) {
  return `${auditSystemPrompt}\n\nContexto:\n${JSON.stringify(context, null, 2)}`;
}
```

- [ ] **Step 3: Verificar lint**

---

## Task 4: Agregar endpoints de auditoría en backend

**Files:**
- Modify: `server.ts`
- Create: `agent/audit-engine.ts` (wrapper que usa Gemini o fallback local)

- [ ] **Step 1: Crear `agent/audit-engine.ts`**

```typescript
import { runAgent } from './index';
import { analyzePriceMismatches, analyzeOrphanCodes, analyzeWarehouseDiscrepancies } from './audit';
import { buildAuditPrompt } from './prompts';
import { AuditReportSchema } from './schema';
import type { Material, PurchaseOrder, WarehouseEntry, AuditIssue } from '../src/types';

export async function runAudit(context: { materials: Material[], orders: PurchaseOrder[], warehouse: WarehouseEntry[] }) {
  // Fallback local rápido siempre disponible
  const localIssues = [
    ...analyzePriceMismatches(context.materials, context.orders),
    ...analyzeOrphanCodes(context.materials, context.orders),
    ...analyzeWarehouseDiscrepancies(context.orders, context.warehouse)
  ];

  // Si no hay API key, devolver local
  if (!process.env.GEMINI_API_KEY) {
    return { issues: localIssues };
  }

  try {
    const response = await runAgent({
      messages: [{ role: 'user', content: buildAuditPrompt(context) }],
      context
    });
    const parsed = AuditReportSchema.safeParse(response.data);
    if (parsed.success) {
      return parsed.data;
    }
    return { issues: localIssues };
  } catch {
    return { issues: localIssues };
  }
}
```

- [ ] **Step 2: Agregar endpoints en `server.ts`**

```typescript
app.post('/api/gemini/audit', async (req, res) => {
  const parseResult = z.object({
    materials: z.array(z.object({ code: z.string(), description: z.string(), unit: z.string(), price: z.number() })),
    orders: z.array(z.any()),
    warehouse: z.array(z.any())
  }).safeParse(req.body);
  if (!parseResult.success) return res.status(400).json({ error: 'Invalid request' });
  const report = await runAudit(parseResult.data);
  res.json(report);
});
```

- [ ] **Step 3: Probar endpoint con curl**

```bash
curl -X POST http://localhost:3000/api/gemini/audit \
  -H "Content-Type: application/json" \
  -d '{"materials":[{"code":"1350750","description":"Codo PVC","unit":"PZ","price":18.5}],"orders":[],"warehouse":[]}'
```

---

## Task 5: Crear componentes frontend de auditoría

**Files:**
- Create: `src/components/AuditView.tsx`
- Create: `src/components/DashboardView.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Crear `AuditView.tsx` que muestre issues agrupadas por tipo**
- [ ] **Step 2: Agregar botones de acción por issue (Aplicar / Ignorar / Ver detalle)**
- [ ] **Step 3: Crear `DashboardView.tsx` con KPIs y alertas críticas**
- [ ] **Step 4: Conectar en `App.tsx` reemplazando/extendiendo la vista dashboard actual**
- [ ] **Step 5: Verificar lint y build**

---

## Task 6: Exportar auditoría a Google Sheets

**Files:**
- Modify: `src/App.tsx`
- Modify: `server.ts` (opcional)

- [ ] **Step 1: Función `writeAuditToSheet(spreadsheetId, token, issues)`**
- [ ] **Step 2: Agregar botón "Exportar sugerencias a Google Sheets"**
- [ ] **Step 3: Crear pestaña "Auditoría Arza" con columnas: ID, Tipo, Severidad, Título, Descripción, Impacto, Acción sugerida, Estado**
- [ ] **Step 4: Verificar que no sobrescribe datos originales**

---

## Task 7: Roles básicos de Firebase

**Files:**
- Modify: `src/auth.ts`
- Modify: `src/App.tsx`

- [ ] **Step 1: Agregar función `getUserRole(email)` en `auth.ts`**
- [ ] **Step 2: Restringir vistas según rol**
  - Rossy: todas
  - Margarita: catálogo, auditoría
  - Kari/Joli: solo bodega
- [ ] **Step 3: Verificar lint y build**

---

## Task 8: Cierre

- [ ] Ejecutar `npm run lint`
- [ ] Ejecutar `npm run build`
- [ ] Actualizar `TODOS.md`
- [ ] Actualizar `.kimi/memory/PROGRESS.md`
- [ ] Guardar memoria en GBrain (`gbrain.put_page`)
- [ ] Hacer commit con mensaje descriptivo
