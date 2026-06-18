/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AlertTriangle, AlertCircle, Info, ArrowRight } from 'lucide-react';

interface AlertCardProps {
  title: string;
  count: number;
  impact?: string;
  actionLabel?: string;
  status?: 'critical' | 'warning' | 'info';
  onAction?: () => void;
}

export default function AlertCard({
  title,
  count,
  impact,
  actionLabel = 'Ver y corregir',
  status = 'warning',
  onAction,
}: AlertCardProps) {
  const styles = {
    critical: {
      card: 'bg-rose-50 border-rose-200',
      iconBg: 'bg-rose-100 text-rose-700',
      count: 'text-rose-700',
      button: 'bg-rose-700 hover:bg-rose-800 text-white',
    },
    warning: {
      card: 'bg-amber-50 border-amber-200',
      iconBg: 'bg-amber-100 text-amber-700',
      count: 'text-amber-700',
      button: 'bg-amber-700 hover:bg-amber-800 text-white',
    },
    info: {
      card: 'bg-stone-50 border-stone-200',
      iconBg: 'bg-stone-200 text-stone-600',
      count: 'text-stone-700',
      button: 'bg-stone-700 hover:bg-stone-800 text-white',
    },
  };

  const style = styles[status];

  const icon =
    status === 'critical' ? (
      <AlertTriangle className="w-5 h-5" />
    ) : status === 'warning' ? (
      <AlertCircle className="w-5 h-5" />
    ) : (
      <Info className="w-5 h-5" />
    );

  return (
    <div className={`rounded-xl border p-4 shadow-2xs ${style.card}`}>
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${style.iconBg}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-stone-800 leading-tight">{title}</h4>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={`text-2xl font-black font-mono ${style.count}`}>{count}</span>
            {impact && (
              <span className="text-xs font-medium text-stone-500 truncate">Impacto: {impact}</span>
            )}
          </div>
        </div>
      </div>
      {count > 0 && onAction && (
        <button
          onClick={onAction}
          className={`mt-3 w-full text-xs font-bold px-3 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${style.button}`}
        >
          {actionLabel}
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}
      {count === 0 && (
        <p className="mt-3 text-[11px] font-medium text-stone-500 text-center">Sin incidencias activas</p>
      )}
    </div>
  );
}
