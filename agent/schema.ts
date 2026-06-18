/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { z } from 'zod';

export const AddOrderActionSchema = z.object({
  type: z.literal('add_order'),
  payload: z.object({
    project: z.string().min(1).describe('Nombre de la obra/proyecto'),
    code: z.string().min(1).describe('Código del material en el catálogo maestro'),
    description: z.string().min(1).describe('Descripción homologada del material'),
    unit: z.string().min(1).describe('Unidad de medida (PZ, SACO, KG, etc.)'),
    quantity: z.number().positive().describe('Cantidad solicitada'),
    price: z.number().nonnegative().describe('Precio unitario pactado'),
    supplier: z.string().min(1).describe('Nombre del proveedor'),
  }),
});

export const SyncCodesActionSchema = z.object({
  type: z.literal('sync_codes'),
  payload: z.object({
    mappings: z.array(
      z.object({
        name: z.string().min(1).describe('Nombre original o descripción en la hoja'),
        suggestedCode: z.string().min(1).describe('Código correcto del catálogo maestro'),
        price: z.number().nonnegative().describe('Precio pactado correspondiente'),
      })
    ).min(1).describe('Lista de mapeos a aplicar'),
  }),
});

export const UpdateReceivedActionSchema = z.object({
  type: z.literal('update_received'),
  payload: z.object({
    orderId: z.string().min(1).describe('ID de la orden de compra a actualizar'),
    quantity: z.number().nonnegative().describe('Cantidad realmente recibida'),
    status: z.enum(['parcial', 'completado']).describe('Estado del recibo'),
    observation: z.string().describe('Razón o comentario del recibo'),
  }),
});

export const AgentActionSchema = z.union([
  AddOrderActionSchema,
  SyncCodesActionSchema,
  UpdateReceivedActionSchema,
]);

export const AgentResponseSchema = z.object({
  content: z.string().min(1).describe('Respuesta amigable para Rossy en español mexicano'),
  action: AgentActionSchema.nullable().describe('Acción ejecutable o null si solo es conversación'),
});

export type AddOrderAction = z.infer<typeof AddOrderActionSchema>;
export type SyncCodesAction = z.infer<typeof SyncCodesActionSchema>;
export type UpdateReceivedAction = z.infer<typeof UpdateReceivedActionSchema>;
export type ValidAgentAction = z.infer<typeof AgentActionSchema>;
export type ValidAgentResponse = z.infer<typeof AgentResponseSchema>;

export const AuditReportSchema = z.object({
  issues: z.array(
    z.object({
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
        suggestedValue: z.union([z.number(), z.string()]).optional(),
      }),
      suggestedAction: z.string(),
      resolved: z.boolean(),
    })
  ),
});

export const CodeSuggestionSchema = z.object({
  suggestions: z.array(
    z.object({
      materialDescription: z.string(),
      currentCode: z.string().optional(),
      suggestedCode: z.string(),
      suggestedPrice: z.number(),
      confidence: z.enum(['high', 'medium', 'low']),
      reason: z.string(),
    })
  ),
});

export const DuplicateReportSchema = z.object({
  groups: z.array(
    z.object({
      canonicalDescription: z.string(),
      suggestedCode: z.string(),
      items: z.array(
        z.object({
          code: z.string(),
          description: z.string(),
          occurrences: z.number(),
        })
      ),
    })
  ),
});

export type AuditReport = z.infer<typeof AuditReportSchema>;
export type CodeSuggestionResponse = z.infer<typeof CodeSuggestionSchema>;
export type DuplicateReport = z.infer<typeof DuplicateReportSchema>;
