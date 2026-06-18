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
