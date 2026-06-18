/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import ArzaAuditor from '../components/ArzaAuditor';
import type { Material, PurchaseOrder, WarehouseEntry } from '../types';
import type { UserRole } from '../firestore';

interface AuditViewProps {
  materials: Material[];
  orders: PurchaseOrder[];
  warehouse: WarehouseEntry[];
  token: string | null;
  user: any;
  userRole: UserRole;
  onUpdateOrder: (updatedOrder: PurchaseOrder) => void;
  onUpdateMaterial: (updatedMaterial: Material) => void;
  onBulkUpdateOrders: (updatedOrders: PurchaseOrder[]) => void;
  showToast: (msg: string) => void;
}

export default function AuditView({
  materials,
  orders,
  warehouse,
  token,
  user,
  userRole,
  onUpdateOrder,
  onUpdateMaterial,
  onBulkUpdateOrders,
  showToast,
}: AuditViewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center gap-3 bg-surface border border-border rounded-xl p-4 shadow-2xs">
        <div className="w-9 h-9 rounded-lg bg-arza-900 text-white flex items-center justify-center">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-stone-900 font-display">Auditoría</h2>
          <p className="text-xs text-stone-500 font-medium">Hallazgos del agente y correcciones aprobadas por Rossy</p>
        </div>
      </div>

      <ArzaAuditor
        materials={materials}
        orders={orders}
        warehouse={warehouse}
        token={token}
        user={user}
        userRole={userRole}
        onUpdateOrder={onUpdateOrder}
        onUpdateMaterial={onUpdateMaterial}
        onBulkUpdateOrders={onBulkUpdateOrders}
        showToast={showToast}
      />
    </motion.div>
  );
}
