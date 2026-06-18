/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  LayoutDashboard,
  MessageSquare,
  Database,
  FileSpreadsheet,
  Package,
  ShieldCheck,
  Truck,
  Settings,
  FileSpreadsheet as FileSpreadsheetIcon,
  User,
  LogOut,
  RotateCw,
  CheckCircle2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import NavItem from './NavItem';
import type { UserRole } from '../../firestore';

export type View =
  | 'dashboard'
  | 'chat'
  | 'catalogo'
  | 'ordenes'
  | 'bodega'
  | 'auditoria'
  | 'proveedores'
  | 'import';

export const canAccessTab = (tab: View, role: UserRole): boolean => {
  if (role === 'rossy') return true;
  if (role === 'margarita') return ['dashboard', 'chat', 'catalogo', 'auditoria'].includes(tab);
  if (role === 'bodega') return ['bodega'].includes(tab);
  return true;
};

interface AppShellProps {
  children: React.ReactNode;
  user: any;
  userRole: UserRole;
  isSandbox: boolean;
  isLoggingIn: boolean;
  activeView: View;
  onNavigate: (view: View) => void;
  onLogin: () => void;
  onLogout: () => void;
  successToast: string | null;
  pendingOrdersCount: number;
  totalAuditIssues: number;
}

interface NavConfig {
  key: View;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

export default function AppShell({
  children,
  user,
  userRole,
  isSandbox,
  isLoggingIn,
  activeView,
  onNavigate,
  onLogin,
  onLogout,
  successToast,
  pendingOrdersCount,
  totalAuditIssues,
}: AppShellProps) {
  const navItems: NavConfig[] = [
    { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { key: 'chat', label: 'Chat', icon: <MessageSquare className="w-5 h-5" /> },
    { key: 'catalogo', label: 'Catálogo', icon: <Database className="w-5 h-5" /> },
    { key: 'ordenes', label: 'Órdenes', icon: <FileSpreadsheet className="w-5 h-5" />, badge: pendingOrdersCount },
    { key: 'bodega', label: 'Bodega', icon: <Package className="w-5 h-5" /> },
    { key: 'auditoria', label: 'Auditoría', icon: <ShieldCheck className="w-5 h-5" />, badge: totalAuditIssues },
    { key: 'proveedores', label: 'Proveedores', icon: <Truck className="w-5 h-5" /> },
    { key: 'import', label: 'Importar / Ajustes', icon: <Settings className="w-5 h-5" /> },
  ];

  const visibleNavItems = navItems.filter((item) => canAccessTab(item.key, userRole));

  return (
    <div className="grain min-h-dvh bg-bg text-stone-800 flex font-sans selection:bg-arza-500 selection:text-white">
      {/* Toast overlay */}
      <AnimatePresence>
        {successToast && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-5 right-5 z-50 bg-arza-900 text-white font-semibold px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 border border-arza-700"
          >
            <CheckCircle2 className="w-5 h-5 text-arza-200" />
            <span>{successToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className="w-64 bg-surface border-r border-border flex flex-col shrink-0 sticky top-0 h-dvh">
        {/* Brand */}
        <div className="h-16 px-5 border-b border-border flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 bg-arza-900 rounded-lg flex items-center justify-center text-white shadow-sm">
            <FileSpreadsheetIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold tracking-tight text-stone-900 font-display">
              Arza Sheets
            </h1>
            <p className="text-[10px] font-medium text-stone-500">Control de obra</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {visibleNavItems.map((item) => (
            <NavItem
              key={item.key}
              icon={item.icon}
              label={item.label}
              active={activeView === item.key}
              badge={item.badge}
              onClick={() => onNavigate(item.key)}
            />
          ))}
        </nav>

        {/* Connection status pill */}
        <div className="p-4 border-t border-border">
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-[11px] font-semibold ${
              isSandbox
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-arza-50 text-arza-800 border-arza-200'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isSandbox ? 'bg-amber-500' : 'bg-arza-600 animate-pulse'
              }`}
            />
            <span className="truncate">{isSandbox ? 'Modo sandbox' : 'Sheets conectado'}</span>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header */}
        <header className="h-16 bg-surface border-b border-border px-6 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-bold text-stone-900 font-display">
              {navItems.find((n) => n.key === activeView)?.label || 'Dashboard'}
            </h2>
            <p className="text-[11px] text-stone-500 font-medium">
              {activeView === 'dashboard' && 'Centro de control de obra'}
              {activeView === 'chat' && 'Agente conversacional de Arza'}
              {activeView === 'catalogo' && 'Catálogo maestro de costos unificados'}
              {activeView === 'ordenes' && 'Registro de órdenes de compra'}
              {activeView === 'bodega' && 'Entradas y recepciones de bodega'}
              {activeView === 'auditoria' && 'Hallazgos y correcciones'}
              {activeView === 'proveedores' && 'Directorio y evaluación de proveedores'}
              {activeView === 'import' && 'Importar datos y configuración'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-stone-200 bg-stone-50 text-[11px] font-bold text-stone-600 uppercase tracking-wide">
              Rol: {userRole}
            </span>

            {isSandbox ? (
              <button
                onClick={onLogin}
                disabled={isLoggingIn}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-stone-200 hover:bg-stone-50 text-stone-800 rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer"
              >
                {isLoggingIn ? (
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <svg viewBox="0 0 48 48" className="w-4 h-4">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  </svg>
                )}
                <span>Conectar Google</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg">
                  <User className="w-3.5 h-3.5 text-stone-500" />
                  <span className="text-xs font-semibold text-stone-700 truncate max-w-[140px]">
                    {user?.displayName || 'Rossy'}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  className="p-2 text-stone-500 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-lg transition-colors cursor-pointer"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6 bg-bg">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
