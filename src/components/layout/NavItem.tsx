/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface NavItemProps {
  key?: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  badge?: number | string;
  onClick?: () => void;
  disabled?: boolean;
}

export default function NavItem({
  icon,
  label,
  active = false,
  badge,
  onClick,
  disabled = false,
}: NavItemProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
        active
          ? 'bg-arza-900 text-white shadow-sm'
          : 'text-stone-500 hover:bg-stone-100 hover:text-stone-800'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span className={`shrink-0 ${active ? 'text-arza-200' : 'text-stone-400 group-hover:text-stone-600'}`}>
        {icon}
      </span>
      <span className="truncate">{label}</span>
      {badge !== undefined && badge !== 0 && (
        <span
          className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center ${
            active
              ? 'bg-white/20 text-white'
              : 'bg-amber-100 text-amber-700 border border-amber-200'
          }`}
        >
          {badge}
        </span>
      )}
    </button>
  );
}
