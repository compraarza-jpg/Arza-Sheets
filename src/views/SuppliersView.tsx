/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Truck, TrendingUp, Package, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import type { PurchaseOrder, WarehouseEntry } from '../types';

interface SuppliersViewProps {
  orders: PurchaseOrder[];
  warehouse: WarehouseEntry[];
}

export default function SuppliersView({ orders, warehouse }: SuppliersViewProps) {
  const suppliers = Array.from(new Set(orders.map((o) => o.supplier)));

  const supplierStats = suppliers.map((name) => {
    const supplierOrders = orders.filter((o) => o.supplier === name);
    const total = supplierOrders.reduce((sum, o) => sum + o.total, 0);
    const pending = supplierOrders.filter((o) => o.status === 'pendiente' || o.status === 'parcial').length;
    const completed = supplierOrders.filter((o) => o.status === 'completado').length;
    const discrepancies = warehouse.filter(
      (w) => supplierOrders.some((o) => o.id === w.orderId) && w.status === 'discrepancia'
    ).length;
    return { name, total, pending, completed, discrepancies, orders: supplierOrders };
  });

  supplierStats.sort((a, b) => b.total - a.total);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center gap-3 bg-surface border border-border rounded-xl p-4 shadow-2xs">
        <div className="w-9 h-9 rounded-lg bg-arza-900 text-white flex items-center justify-center">
          <Truck className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-stone-900 font-display">Proveedores</h2>
          <p className="text-xs text-stone-500 font-medium">Directorio, órdenes y discrepancias por proveedor</p>
        </div>
      </div>

      {/* Supplier cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {supplierStats.map((s) => (
          <div
            key={s.name}
            className="bg-surface border border-border rounded-xl p-4 shadow-2xs hover:shadow-sm transition-shadow"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <h3 className="text-sm font-bold text-stone-800 leading-tight">{s.name}</h3>
              <span className="text-xs font-black font-mono text-arza-800 bg-arza-50 px-2 py-0.5 rounded border border-arza-100">
                ${s.total.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center mb-3">
              <div className="bg-stone-50 rounded-lg p-2 border border-border">
                <p className="text-lg font-black font-mono text-stone-800">{s.orders.length}</p>
                <p className="text-[9px] font-bold text-stone-500 uppercase tracking-wide">Órdenes</p>
              </div>
              <div className="bg-stone-50 rounded-lg p-2 border border-border">
                <p className="text-lg font-black font-mono text-amber-700">{s.pending}</p>
                <p className="text-[9px] font-bold text-stone-500 uppercase tracking-wide">Pendientes</p>
              </div>
              <div className="bg-stone-50 rounded-lg p-2 border border-border">
                <p className="text-lg font-black font-mono text-rose-700">{s.discrepancies}</p>
                <p className="text-[9px] font-bold text-stone-500 uppercase tracking-wide">Discrep.</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-[11px] text-stone-600">
                <Package className="w-3.5 h-3.5 text-arza-700" />
                <span className="font-medium">Completadas: {s.completed}</span>
              </div>
              {s.discrepancies > 0 && (
                <div className="flex items-center gap-2 text-[11px] text-rose-700">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span className="font-medium">{s.discrepancies} faltante(s) en bodega</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-[11px] text-stone-600">
                <TrendingUp className="w-3.5 h-3.5 text-stone-400" />
                <span className="font-medium">
                  Promedio por OC: ${(s.total / (s.orders.length || 1)).toLocaleString('es-MX', {
                    maximumFractionDigits: 0,
                  })}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {supplierStats.length === 0 && (
        <div className="text-center py-12 bg-surface border border-dashed border-border rounded-xl text-stone-500">
          <Truck className="w-10 h-10 mx-auto mb-3 text-stone-300" />
          <p className="text-sm font-bold text-stone-700">Sin proveedores registrados</p>
          <p className="text-xs mt-1">Crea órdenes de compra para empezar a evaluar proveedores.</p>
        </div>
      )}
    </motion.div>
  );
}
