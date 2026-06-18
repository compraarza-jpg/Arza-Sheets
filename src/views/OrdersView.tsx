/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FileSpreadsheet, Search, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import SpreadsheetGrid from '../components/SpreadsheetGrid';
import type { Material, PurchaseOrder, WarehouseEntry } from '../types';

interface OrdersViewProps {
  materials: Material[];
  orders: PurchaseOrder[];
  warehouse: WarehouseEntry[];
  showToast: (msg: string) => void;
  onAddManualOrder: (e: React.FormEvent) => void;
  formProject: string;
  setFormProject: (value: string) => void;
  formMaterialCode: string;
  setFormMaterialCode: (value: string) => void;
  formQuantity: number;
  setFormQuantity: (value: number) => void;
  formSupplier: string;
  setFormSupplier: (value: string) => void;
  onModifyPrice: (order: PurchaseOrder, officialPrice: number) => void;
  onModifyCode: (order: PurchaseOrder, correctMaterial: Material) => void;
}

const projects = ['Solum T18', 'Solum T40', 'Maple', 'Ignis', 'Terra', 'Aquatec'];
const suppliers = [
  'Comercializadora Ruba',
  'Aceros y Materiales de Saltillo',
  'PVC y Plomería de Occidente',
  'Distribuidora Industrial Alar',
];

export default function OrdersView({
  materials,
  orders,
  warehouse,
  showToast,
  onAddManualOrder,
  formProject,
  setFormProject,
  formMaterialCode,
  setFormMaterialCode,
  formQuantity,
  setFormQuantity,
  formSupplier,
  setFormSupplier,
  onModifyPrice,
  onModifyCode,
}: OrdersViewProps) {
  const [showForm, setShowForm] = useState(false);
  const [obraFilter, setObraFilter] = useState('ALL');

  const searchQuery = obraFilter === 'ALL' ? '' : obraFilter;

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
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-stone-900 font-display">Órdenes de Compra</h2>
            <p className="text-xs text-stone-500 font-medium">Registro, validación y seguimiento de OC</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative">
            <select
              value={obraFilter}
              onChange={(e) => setObraFilter(e.target.value)}
              className="appearance-none bg-bg border border-border text-stone-700 text-sm font-medium pl-3 pr-8 py-2 rounded-lg focus:outline-none focus:border-arza-700 cursor-pointer"
            >
              <option value="ALL">Todas las obras</option>
              {projects.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
          </div>
          <button
            onClick={() => setShowForm((s) => !s)}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-arza-900 hover:bg-arza-800 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {showForm ? 'Cerrar' : 'Nueva OC'}
          </button>
        </div>
      </div>

      {/* New order form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            onSubmit={(e) => {
              onAddManualOrder(e);
              setShowForm(false);
            }}
            className="bg-surface border border-border rounded-xl p-4 shadow-2xs overflow-hidden"
          >
            <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-2 mb-3">
              <Plus className="w-4 h-4 text-arza-700" />
              Nueva orden manual
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
              <div className="space-y-1">
                <label className="block text-stone-600 font-semibold text-xs">Obra</label>
                <select
                  value={formProject}
                  onChange={(e) => setFormProject(e.target.value)}
                  className="w-full bg-bg border border-border text-stone-800 rounded-lg p-2 focus:outline-none focus:border-arza-700"
                >
                  {projects.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-stone-600 font-semibold text-xs">Material</label>
                <select
                  value={formMaterialCode}
                  onChange={(e) => setFormMaterialCode(e.target.value)}
                  className="w-full bg-bg border border-border text-stone-800 rounded-lg p-2 focus:outline-none focus:border-arza-700"
                >
                  {materials.map((m) => (
                    <option key={m.code} value={m.code}>
                      [{m.code}] {m.description}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-stone-600 font-semibold text-xs">Cantidad</label>
                <input
                  type="number"
                  min={1}
                  value={formQuantity}
                  onChange={(e) => setFormQuantity(Number(e.target.value))}
                  className="w-full bg-bg border border-border text-stone-800 rounded-lg p-2 focus:outline-none focus:border-arza-700 font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-stone-600 font-semibold text-xs">Proveedor</label>
                <select
                  value={formSupplier}
                  onChange={(e) => setFormSupplier(e.target.value)}
                  className="w-full bg-bg border border-border text-stone-800 rounded-lg p-2 focus:outline-none focus:border-arza-700"
                >
                  {suppliers.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-arza-900 hover:bg-arza-800 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Crear Orden
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Table */}
      <SpreadsheetGrid
        type="orders"
        materials={materials}
        orders={orders}
        warehouse={warehouse}
        searchQuery={searchQuery}
        onModifyPrice={onModifyPrice}
        onModifyCode={onModifyCode}
        showToast={showToast}
      />
    </motion.div>
  );
}
