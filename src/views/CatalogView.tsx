/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Database, Search } from 'lucide-react';
import { motion } from 'motion/react';
import SpreadsheetGrid from '../components/SpreadsheetGrid';
import type { Material, PurchaseOrder, WarehouseEntry } from '../types';

interface CatalogViewProps {
  materials: Material[];
  orders: PurchaseOrder[];
  warehouse: WarehouseEntry[];
  showToast: (msg: string) => void;
}

export default function CatalogView({ materials, orders, warehouse, showToast }: CatalogViewProps) {
  const [search, setSearch] = useState('');

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
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-stone-900 font-display">Catálogo Maestro</h2>
            <p className="text-xs text-stone-500 font-medium">Códigos, descripciones y precios pactados</p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Buscar material o código…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64 bg-bg border border-border text-stone-800 placeholder-stone-400 text-sm pl-9 pr-3 py-2 rounded-lg focus:outline-none focus:border-arza-700 transition-colors"
          />
        </div>
      </div>

      {/* Table */}
      <SpreadsheetGrid
        type="materials"
        materials={materials}
        orders={orders}
        warehouse={warehouse}
        searchQuery={search}
        showToast={showToast}
      />
    </motion.div>
  );
}
