/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  LayoutDashboard,
  ShieldCheck,
  TrendingDown,
  AlertTriangle,
  Database,
  TrendingUp,
  BarChart3,
  AlertTriangle as AlertTriangleIcon,
  Briefcase,
  FileSpreadsheet,
  Plus,
  RotateCw,
  AlertTriangle as AlertIcon,
  CheckCircle2,
} from 'lucide-react';
import { motion } from 'motion/react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import KpiCard from '../components/layout/KpiCard';
import AlertCard from '../components/layout/AlertCard';
import type { Material, PurchaseOrder, WarehouseEntry } from '../types';

interface DashboardViewProps {
  materials: Material[];
  orders: PurchaseOrder[];
  warehouse: WarehouseEntry[];
  isSandbox: boolean;
  token: string | null;
  spreadsheets: { id: string; name: string }[];
  isLoadingSpreadsheets: boolean;
  selectedSpreadsheetId: string | null;
  selectedSpreadsheetName: string | null;
  isSyncingToSheets: boolean;
  onCreateSpreadsheet: () => void;
  onReadSheets: () => void;
  onWriteSheets: () => void;
  onSelectSpreadsheet: (sheet: { id: string; name: string }) => void;
  onNavigateToAudit: () => void;
  onLogin: () => void;
  showToast: (msg: string) => void;
  driveBrowser: React.ReactNode;
}

const COLORS = ['#2D5A3D', '#C4A35A', '#B54242', '#3A6EA5', '#8B5CF6'];

const projects = [
  { name: 'Solum T18', progress: 85, status: 'Fase de Acabados', color: 'bg-arza-600' },
  { name: 'Solum T40', progress: 60, status: 'Instalación Hidráulica', color: 'bg-blue-600' },
  { name: 'Terra', progress: 95, status: 'Conclusión de Obra', color: 'bg-emerald-600' },
  { name: 'Ignis', progress: 40, status: 'Cimentación y Redes', color: 'bg-amber-500' },
  { name: 'Maple', progress: 70, status: 'Colocación de Interiores', color: 'bg-purple-600' },
  { name: 'Aquatec', progress: 15, status: 'Trazado Preliminar', color: 'bg-rose-600' },
];

export default function DashboardView({
  materials,
  orders,
  warehouse,
  isSandbox,
  token,
  spreadsheets,
  isLoadingSpreadsheets,
  selectedSpreadsheetId,
  selectedSpreadsheetName,
  isSyncingToSheets,
  onCreateSpreadsheet,
  onReadSheets,
  onWriteSheets,
  onSelectSpreadsheet,
  onNavigateToAudit,
  onLogin,
  showToast,
  driveBrowser,
}: DashboardViewProps) {
  const rawOrdersTotal = orders.reduce((sum, o) => sum + o.total, 0);

  const overchargeLeak = orders.reduce((sum, o) => {
    const catalogMatch = materials.find((m) => m.code === o.code);
    if (catalogMatch && o.price > catalogMatch.price) {
      return sum + (o.price - catalogMatch.price) * o.quantity;
    }
    return sum;
  }, 0);

  const deliveryShortageLeak = orders.reduce((sum, o) => {
    if (o.receivedQuantity < o.quantity && o.status !== 'pendiente') {
      const catalogMatch = materials.find((m) => m.code === o.code);
      const priceToUse = catalogMatch ? catalogMatch.price : o.price;
      const gap = o.quantity - o.receivedQuantity;
      return sum + gap * priceToUse;
    }
    return sum;
  }, 0);

  const trueAuditedCost = rawOrdersTotal - overchargeLeak - deliveryShortageLeak;

  const priceMismatchesCount = orders.filter((o) => {
    const match = materials.find((m) => m.code === o.code);
    return match && o.price !== match.price;
  }).length;

  const orphanCodesCount = orders.filter((o) => !materials.some((m) => m.code === o.code)).length;
  const warehouseDiscrepancyCount = warehouse.filter(
    (entry) => entry.expectedQuantity !== entry.receivedQuantity
  ).length;
  const totalAuditIssues = priceMismatchesCount + orphanCodesCount + warehouseDiscrepancyCount;

  const spendByProject = (() => {
    const data: Record<string, number> = {};
    orders.forEach((o) => {
      data[o.project] = (data[o.project] || 0) + o.total;
    });
    return Object.keys(data).map((name) => ({ name, gasto: data[name] }));
  })();

  const spendBySupplier = (() => {
    const data: Record<string, number> = {};
    orders.forEach((o) => {
      data[o.supplier] = (data[o.supplier] || 0) + o.total;
    });
    return Object.keys(data).map((name) => ({
      name: name.length > 15 ? name.substring(0, 15) + '...' : name,
      gasto: data[name],
    }));
  })();

  const discrepancyStats = (() => {
    const discrepancy = warehouse.filter((w) => w.status === 'discrepancia').length;
    const clean = warehouse.filter((w) => w.status === 'completo').length;
    return [
      { name: 'Entregas Completas', value: clean },
      { name: 'Discrepancias', value: discrepancy },
    ];
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Page title */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-arza-900 text-white flex items-center justify-center">
          <LayoutDashboard className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-stone-900 font-display">Centro de Control</h2>
          <p className="text-xs text-stone-500 font-medium">Estado general de compras, bodega y auditoría</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Costo Real Aprobado"
          value={`$${trueAuditedCost.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
          trend={
            overchargeLeak + deliveryShortageLeak > 0
              ? { label: 'vs monto en facturas', value: `$${rawOrdersTotal.toLocaleString('es-MX', { maximumFractionDigits: 0 })}`, direction: 'neutral' }
              : undefined
          }
          status="ok"
          icon={<ShieldCheck className="w-5 h-5" />}
        />
        <KpiCard
          title="Fuga y Faltante Detectado"
          value={`-$${(overchargeLeak + deliveryShortageLeak).toLocaleString('es-MX', {
            minimumFractionDigits: 2,
          })}`}
          trend={{
            label: `Sobrep: $${overchargeLeak.toLocaleString('es-MX', { maximumFractionDigits: 0 })} | Short: $${deliveryShortageLeak.toLocaleString(
              'es-MX',
              { maximumFractionDigits: 0 }
            )}`,
            value: '',
            direction: 'down',
          }}
          status={overchargeLeak + deliveryShortageLeak > 0 ? 'critical' : 'ok'}
          icon={<TrendingDown className="w-5 h-5" />}
        />
        <KpiCard
          title="Alertas de Auditoría"
          value={`${totalAuditIssues} incidencias`}
          trend={{
            label: `${priceMismatchesCount} precios · ${orphanCodesCount} códigos · ${warehouseDiscrepancyCount} bodega`,
            value: '',
            direction: 'neutral',
          }}
          status={totalAuditIssues > 0 ? 'warning' : 'ok'}
          icon={<AlertTriangle className="w-5 h-5" />}
        />
        <KpiCard
          title="Catálogo Unificado"
          value={`${materials.length} insumos`}
          trend={{ label: 'códigos homologados', value: '', direction: 'up' }}
          status="ok"
          icon={<Database className="w-5 h-5" />}
        />
      </div>

      {/* Alert cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AlertCard
          title="Precios fuera de catálogo"
          count={priceMismatchesCount}
          impact={
            priceMismatchesCount > 0
              ? `$${orders
                  .filter((o) => {
                    const match = materials.find((m) => m.code === o.code);
                    return match && o.price !== match.price && o.price > match.price;
                  })
                  .reduce((sum, o) => {
                    const match = materials.find((m) => m.code === o.code)!;
                    return sum + (o.price - match.price) * o.quantity;
                  }, 0)
                  .toLocaleString('es-MX', { maximumFractionDigits: 0 })}`
              : undefined
          }
          status="critical"
          onAction={onNavigateToAudit}
        />
        <AlertCard
          title="Códigos huérfanos"
          count={orphanCodesCount}
          status="warning"
          onAction={onNavigateToAudit}
        />
        <AlertCard
          title="Faltantes de bodega"
          count={warehouseDiscrepancyCount}
          status="warning"
          onAction={onNavigateToAudit}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface border border-border rounded-xl p-5 shadow-2xs">
          <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-arza-700" />
            Gasto Acumulado por Obra
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={spendByProject} margin={{ bottom: 15 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F2F0EC" />
                <XAxis dataKey="name" stroke="#A9A399" fontSize={10} tickLine={false} />
                <YAxis stroke="#A9A399" fontSize={10} tickFormatter={(val) => `$${val / 1000}k`} />
                <ChartTooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E5E2DC',
                    color: '#3D3B36',
                    fontSize: '11px',
                    borderRadius: '8px',
                  }}
                  formatter={(value) => [`$${Number(value).toLocaleString('es-MX')}`, 'Total']}
                />
                <Bar dataKey="gasto" radius={[4, 4, 0, 0]}>
                  {spendByProject.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-5 shadow-2xs">
          <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-arza-700" />
            Gasto por Proveedor
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={spendBySupplier} layout="vertical" margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F2F0EC" />
                <XAxis type="number" stroke="#A9A399" fontSize={10} tickFormatter={(val) => `$${val / 1000}k`} />
                <YAxis dataKey="name" type="category" stroke="#A9A399" fontSize={9} width={90} tickLine={false} />
                <ChartTooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E5E2DC',
                    color: '#3D3B36',
                    fontSize: '11px',
                    borderRadius: '8px',
                  }}
                  formatter={(value) => [`$${Number(value).toLocaleString('es-MX')}`, 'Gastado']}
                />
                <Bar dataKey="gasto" fill="#3A6EA5" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Projects */}
      <div className="bg-surface border border-border rounded-xl p-5 shadow-2xs">
        <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-2 mb-4">
          <Briefcase className="w-4 h-4 text-arza-700" />
          Obras en Proceso
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <div
              key={project.name}
              className="border border-border rounded-xl p-4 hover:shadow-sm transition-shadow bg-bg"
            >
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-bold text-stone-800">{project.name}</span>
                <span className="text-[10px] font-mono font-bold text-stone-500 bg-white px-2 py-0.5 rounded border border-border">
                  {project.progress}%
                </span>
              </div>
              <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden mb-3">
                <div className={`h-full ${project.color} rounded-full`} style={{ width: `${project.progress}%` }} />
              </div>
              <p className="text-[11px] text-stone-500">
                Estado: <span className="font-semibold text-stone-700">{project.status}</span>
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Warehouse discrepancy chart */}
      <div className="bg-surface border border-border rounded-xl p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex-1 space-y-2">
            <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangleIcon className="w-4 h-4 text-amber-600" />
              Auditoría de Bodega y Remisiones
            </h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              Entregas limpias vs. discrepancias volumétricas reportadas por Kari y Joli. Ordena por impacto económico en Auditoría.
            </p>
            {warehouseDiscrepancyCount > 0 && (
              <div className="text-[11px] font-medium text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                {warehouseDiscrepancyCount} entrada{warehouseDiscrepancyCount > 1 ? 's' : ''} con discrepancia por revisar.
              </div>
            )}
          </div>
          <div className="w-full md:w-56 h-40 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={discrepancyStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={55}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell fill="#2D5A3D" />
                  <Cell fill="#B54242" />
                </Pie>
                <ChartTooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E5E2DC',
                    color: '#3D3B36',
                    fontSize: '11px',
                    borderRadius: '8px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '10px', color: '#8C877E' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Google Sheets connection panel */}
      <div className="bg-surface border border-border rounded-xl p-5 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-arza-700" />
            <div>
              <h3 className="text-sm font-bold text-stone-800">Conexión Google Sheets</h3>
              <p className="text-xs text-stone-500">Sincroniza catálogo, órdenes y bodega con Drive</p>
            </div>
          </div>
          {!isSandbox && token && (
            <button
              onClick={onCreateSpreadsheet}
              disabled={isSyncingToSheets}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-arza-900 hover:bg-arza-800 text-white text-xs font-bold rounded-lg disabled:opacity-50 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Crear hoja
            </button>
          )}
        </div>

        {isSandbox ? (
          <div className="space-y-5">
            <div className="text-center py-6 bg-stone-50 rounded-xl border border-dashed border-stone-200 space-y-3">
              <AlertIcon className="w-8 h-8 text-amber-500 mx-auto" />
              <div className="space-y-1 px-4">
                <p className="text-xs font-bold text-stone-800">¿Deseas conectar tus hojas reales?</p>
                <p className="text-[11px] text-stone-500 max-w-sm mx-auto">
                  Inicia sesión para mapear archivos de Drive y actualizar el catálogo sin errores.
                </p>
              </div>
              <button
                onClick={onLogin}
                className="bg-arza-900 hover:bg-arza-800 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors cursor-pointer"
              >
                Conectar Google Sheets
              </button>
            </div>
            {driveBrowser}
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-3">
                <p className="text-xs font-bold text-stone-700">Hoja vinculada:</p>
                {selectedSpreadsheetId ? (
                  <div className="bg-stone-50 p-3 rounded-xl border border-border space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-stone-800 truncate">{selectedSpreadsheetName}</p>
                        <p className="text-[10px] text-stone-400 font-mono truncate">ID: {selectedSpreadsheetId}</p>
                      </div>
                      <span className="text-[9px] bg-arza-100 text-arza-800 px-2 py-0.5 rounded-full font-bold uppercase shrink-0">
                        Vinculado
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={onReadSheets}
                        disabled={isSyncingToSheets}
                        className="flex-1 py-1.5 px-2 bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 rounded-lg text-[10.5px] font-bold flex items-center justify-center gap-1 disabled:opacity-50 cursor-pointer"
                      >
                        {isSyncingToSheets ? (
                          <RotateCw className="w-3 h-3 animate-spin text-arza-700" />
                        ) : (
                          <RotateCw className="w-3 h-3 text-arza-700" />
                        )}
                        Importar
                      </button>
                      <button
                        onClick={onWriteSheets}
                        disabled={isSyncingToSheets}
                        className="flex-1 py-1.5 px-2 bg-arza-900 hover:bg-arza-800 text-white rounded-lg text-[10.5px] font-bold flex items-center justify-center gap-1 disabled:opacity-50 cursor-pointer"
                      >
                        {isSyncingToSheets ? (
                          <RotateCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <FileSpreadsheet className="w-3 h-3" />
                        )}
                        Exportar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-stone-50 p-4 rounded-xl border border-dashed border-stone-200 text-center text-xs text-stone-500">
                    No hay hoja seleccionada. Elige una del explorador o crea una nueva.
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs font-bold text-stone-700">
                  <span>Hojas detectadas en Drive</span>
                  {isLoadingSpreadsheets && <RotateCw className="w-3.5 h-3.5 text-arza-700 animate-spin" />}
                </div>
                <div className="bg-stone-50 rounded-xl p-2 max-h-[160px] overflow-y-auto border border-border space-y-1">
                  {spreadsheets.length > 0 ? (
                    spreadsheets.map((sheet) => (
                      <button
                        key={sheet.id}
                        onClick={() => onSelectSpreadsheet(sheet)}
                        className={`w-full text-left text-[11px] px-2.5 py-1.5 rounded-lg transition-all flex items-center justify-between border ${
                          selectedSpreadsheetId === sheet.id
                            ? 'bg-arza-50 border-arza-200 text-arza-900 font-bold'
                            : 'hover:bg-white bg-white border-stone-200 text-stone-600 hover:text-stone-800'
                        }`}
                      >
                        <span className="truncate max-w-[180px] font-medium">{sheet.name}</span>
                        <span className="text-[9px] font-mono text-stone-400 shrink-0">ID: {sheet.id.slice(0, 6)}…</span>
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-4 text-[11px] text-stone-500">
                      {isLoadingSpreadsheets ? 'Buscando archivos…' : 'No se encontraron hojas.'}
                    </div>
                  )}
                </div>
              </div>
            </div>
            {driveBrowser}
          </div>
        )}
      </div>

      {/* Empty-state helper */}
      {totalAuditIssues === 0 && (
        <div className="flex items-center gap-3 bg-arza-50 border border-arza-100 rounded-xl p-4">
          <CheckCircle2 className="w-5 h-5 text-arza-700" />
          <p className="text-xs font-medium text-arza-900">No hay alertas activas. El catálogo y las órdenes están cuadradas.</p>
        </div>
      )}
    </motion.div>
  );
}
