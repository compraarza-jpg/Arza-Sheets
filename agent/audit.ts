/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  Material,
  PurchaseOrder,
  WarehouseEntry,
  AuditIssue,
  DuplicateGroup,
} from '../src/types';

export function analyzePriceMismatches(
  materials: Material[],
  orders: PurchaseOrder[]
): AuditIssue[] {
  return orders
    .map((order) => {
      const match = materials.find((m) => m.code === order.code);
      if (!match || match.price === order.price) return null;
      const impact = Math.abs(order.price - match.price) * order.quantity;
      return {
        id: `price-${order.id}`,
        type: 'price_mismatch' as const,
        severity: impact > 5000 ? ('critical' as const) : ('warning' as const),
        title: `Precio desfasado en ${order.id}`,
        description: `El material "${order.description}" tiene precio de orden $${order.price.toFixed(2)} vs catálogo $${match.price.toFixed(2)}.`,
        impact,
        data: {
          orderId: order.id,
          materialCode: order.code,
          project: order.project,
          supplier: order.supplier,
          expected: match.price,
          actual: order.price,
        },
        suggestedAction: `Ajustar precio de orden a $${match.price.toFixed(2)}`,
        resolved: false,
      };
    })
    .filter(Boolean) as AuditIssue[];
}

export function analyzeOrphanCodes(
  materials: Material[],
  orders: PurchaseOrder[]
): AuditIssue[] {
  return orders
    .filter((order) => !materials.some((m) => m.code === order.code))
    .map((order) => ({
      id: `orphan-${order.id}`,
      type: 'orphan_code' as const,
      severity: 'warning' as const,
      title: `Código huérfano en ${order.id}`,
      description: `La orden usa "${order.description}" pero no existe en el catálogo maestro.`,
      impact: 0,
      data: {
        orderId: order.id,
        materialCode: order.code,
        project: order.project,
        supplier: order.supplier,
      },
      suggestedAction: 'Asignar código oficial desde el catálogo',
      resolved: false,
    }));
}

export function analyzeWarehouseDiscrepancies(
  orders: PurchaseOrder[],
  warehouse: WarehouseEntry[]
): AuditIssue[] {
  return warehouse
    .filter(
      (entry) =>
        entry.status === 'discrepancia' ||
        entry.expectedQuantity !== entry.receivedQuantity
    )
    .map((entry) => {
      const order = orders.find((o) => o.id === entry.orderId);
      const price = order?.price || 0;
      const gap = (entry.expectedQuantity || 0) - (entry.receivedQuantity || 0);
      return {
        id: `wh-${entry.id}`,
        type: 'warehouse_discrepancy' as const,
        severity: gap > 0 ? ('critical' as const) : ('warning' as const),
        title: `Faltante en recepción ${entry.id}`,
        description: `Se esperaban ${entry.expectedQuantity} ${entry.description} y llegaron ${entry.receivedQuantity}.`,
        impact: Math.abs(gap) * price,
        data: {
          orderId: entry.orderId,
          materialCode: entry.code,
          expected: entry.expectedQuantity,
          actual: entry.receivedQuantity,
        },
        suggestedAction:
          gap > 0
            ? `Contactar proveedor por ${gap} unidades faltantes`
            : 'Verificar excedente reportado',
        resolved: false,
      };
    });
}

export function detectDuplicates(materials: Material[]): DuplicateGroup[] {
  const normalized = materials.map((m) => ({
    ...m,
    key: m.description
      .toLowerCase()
      .replace(/[^a-z0-9]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
  }));

  const groups = new Map<string, Material[]>();
  for (const m of normalized) {
    const existing = groups.get(m.key);
    if (existing) {
      existing.push(m);
    } else {
      groups.set(m.key, [m]);
    }
  }

  return Array.from(groups.entries())
    .filter(([, items]) => items.length > 1)
    .map(([key, items]) => ({
      canonicalDescription: items[0].description,
      suggestedCode: items[0].code,
      items: items.map((item) => ({
        code: item.code,
        description: item.description,
        occurrences: 1,
      })),
    }));
}
