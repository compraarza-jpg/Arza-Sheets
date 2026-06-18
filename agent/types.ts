/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AgentMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AgentContext {
  isOfficialSheetsConnected: boolean;
  userProfile: { name: string; email: string };
  materials: MaterialContext[];
  orders: OrderContext[];
  warehouse: WarehouseContext[];
}

export interface MaterialContext {
  code: string;
  description: string;
  unit: string;
  price: number;
}

export interface OrderContext {
  id: string;
  project: string;
  code: string;
  description: string;
  unit: string;
  quantity: number;
  price: number;
  receivedQuantity: number;
  status: 'pendiente' | 'parcial' | 'completado';
  supplier: string;
  total: number;
}

export interface WarehouseContext {
  id: string;
  orderId: string;
  code: string;
  description: string;
  expectedQuantity: number;
  receivedQuantity: number;
  status: 'completo' | 'discrepancia';
  observer: string;
}

export interface AgentAction {
  type: 'add_order' | 'sync_codes' | 'update_received';
  payload: Record<string, unknown>;
}

export interface AgentResponse {
  content: string;
  action: AgentAction | null;
}

export interface AgentResult {
  response: AgentResponse;
  metadata: {
    model: string;
    durationMs: number;
    fallback?: boolean;
    error?: string;
  };
}
