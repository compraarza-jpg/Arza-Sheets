/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Package } from 'lucide-react';
import { motion } from 'motion/react';
import SpreadsheetGrid from '../components/SpreadsheetGrid';
import type { Material, PurchaseOrder, WarehouseEntry } from '../types';

interface WarehouseViewProps {
  materials: Material[];
  orders: PurchaseOrder[];
  warehouse: WarehouseEntry[];
  onReconcileWarehouse: (entry: WarehouseEntry) => void;
  showToast: (msg: string) => void;
}

export default function WarehouseView({
  materials,
  orders,
  warehouse,
  onReconcileWarehouse,
  showToast,
}: WarehouseViewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface border border-border rounded-xl p-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-arza-900 text-white flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-stone-900 font-display">Bodega / Recepciones</h2>
            <p className="text-xs text-stone-500 font-medium">Verificación de entregas y discrepancias</p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-medium">
          <span className="flex items-center gap-1.5 text-stone-600">
            <span className="w-2.5 h-2.5 rounded-full bg-arza-600" />
            Completas: {warehouse.filter((w) => w.status === 'completo').length}
          </span>
          <span className="flex items-center gap-1.5 text-stone-600">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
            Discrepancias: {warehouse.filter((w) => w.status === 'discrepancia').length}
          </span>
        </div>
      </div>

      {/* Table */}
      <SpreadsheetGrid
        type="warehouse"
        materials={materials}
        orders={orders}
        warehouse={warehouse}
        searchQuery=""
        onReconcileWarehouse={onReconcileWarehouse}
        showToast={showToast}
      />
    </motion.div>
  );
}
