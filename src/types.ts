/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Material {
  code: string;
  description: string;
  unit: string;
  price: number;
}

export interface PurchaseOrder {
  id: string;
  date: string;
  week: number;
  project: string; // 'Solum T18', 'Solum T40', 'Maple', 'Ignis', 'Terra'
  supplier: string;
  code: string;
  description: string;
  unit: string;
  quantity: number;
  price: number;
  total: number;
  receivedQuantity: number;
  status: 'pendiente' | 'parcial' | 'completado';
  observation?: string;
}

export interface WarehouseEntry {
  id: string;
  date: string;
  orderId: string;
  code: string;
  description: string;
  expectedQuantity: number;
  receivedQuantity: number;
  status: 'completo' | 'discrepancia';
  observer: string;
  observation?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  action?: {
    type: 'add_order' | 'sync_codes' | 'update_received' | 'create_sheet';
    payload: any;
    executed?: boolean;
  };
}

export interface SpreadsheetInfo {
  id: string;
  title: string;
  url: string;
}

export interface AuditIssue {
  id: string;
  type: 'price_mismatch' | 'orphan_code' | 'warehouse_discrepancy' | 'duplicate_material';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  impact: number;
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

export interface AuditContext {
  materials: Material[];
  orders: PurchaseOrder[];
  warehouse: WarehouseEntry[];
}
