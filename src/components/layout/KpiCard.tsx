/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface KpiCardProps {
  title: string;
  value: string | number;
  trend?: {
    label: string;
    value: string;
    direction?: 'up' | 'down' | 'neutral';
  };
  status?: 'ok' | 'warning' | 'critical';
  icon?: React.ReactNode;
}

export default function KpiCard({ title, value, trend, status = 'ok', icon }: KpiCardProps) {
  const statusStyles = {
    ok: 'bg-arza-50 border-arza-100 text-arza-700',
    warning: 'bg-amber-50 border-amber-100 text-amber-700',
    critical: 'bg-rose-50 border-rose-100 text-rose-700',
  };

  const trendColor =
    trend?.direction === 'down' && status !== 'ok'
      ? 'text-rose-600'
      : trend?.direction === 'up'
        ? 'text-arza-700'
        : 'text-stone-500';

  return (
    <div className="bg-surface border border-border rounded-xl p-4 shadow-2xs flex items-start gap-4 hover:shadow-sm transition-shadow">
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${statusStyles[status]}`}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider truncate">
          {title}
        </p>
        <p className="text-lg font-black text-stone-900 font-mono tracking-tight mt-0.5">
          {value}
        </p>
        {trend && (
          <p className={`text-[11px] font-medium mt-0.5 truncate ${trendColor}`}>
            {trend.value}
            <span className="text-stone-400 font-normal ml-1">{trend.label}</span>
          </p>
        )}
      </div>
    </div>
  );
}
