/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Settings, FileSpreadsheet, Plus, RotateCw, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';

interface ImportSettingsViewProps {
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
  onLogin: () => void;
  driveBrowser: React.ReactNode;
}

export default function ImportSettingsView({
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
  onLogin,
  driveBrowser,
}: ImportSettingsViewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center gap-3 bg-surface border border-border rounded-xl p-4 shadow-2xs">
        <div className="w-9 h-9 rounded-lg bg-arza-900 text-white flex items-center justify-center">
          <Settings className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-stone-900 font-display">Importar / Ajustes</h2>
          <p className="text-xs text-stone-500 font-medium">Carga datos de Drive y sincroniza con Google Sheets</p>
        </div>
      </div>

      {/* Sandbox warning */}
      {isSandbox && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-800">Modo sandbox activo</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Los datos se cargan en memoria. Conecta Google para leer y escribir hojas reales.
            </p>
            <button
              onClick={onLogin}
              className="mt-2 px-3 py-1.5 bg-arza-900 hover:bg-arza-800 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              Conectar Google
            </button>
          </div>
        </div>
      )}

      {/* Sheets sync panel */}
      <div className="bg-surface border border-border rounded-xl p-5 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-arza-700" />
            <div>
              <h3 className="text-sm font-bold text-stone-800">Sincronización con Google Sheets</h3>
              <p className="text-xs text-stone-500">Respalda catálogo, órdenes y entradas de bodega</p>
            </div>
          </div>
          {!isSandbox && token && (
            <button
              onClick={onCreateSpreadsheet}
              disabled={isSyncingToSheets}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-arza-900 hover:bg-arza-800 text-white text-xs font-bold rounded-lg disabled:opacity-50 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Crear hoja maestra
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-3">
            <p className="text-xs font-bold text-stone-700">Hoja vinculada</p>
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
                    {isSyncingToSheets ? <RotateCw className="w-3 h-3 animate-spin" /> : <FileSpreadsheet className="w-3 h-3" />}
                    Exportar
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-stone-50 p-4 rounded-xl border border-dashed border-border text-center text-xs text-stone-500">
                No hay hoja seleccionada. Crea una nueva o elige una del listado.
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs font-bold text-stone-700">
              <span>Hojas detectadas en Drive</span>
              {isLoadingSpreadsheets && <RotateCw className="w-3.5 h-3.5 text-arza-700 animate-spin" />}
            </div>
            <div className="bg-stone-50 rounded-xl p-2 max-h-[180px] overflow-y-auto border border-border space-y-1">
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
      </div>

      {/* Drive import wizard */}
      <div className="bg-surface border border-border rounded-xl p-5 shadow-2xs">
        <h3 className="text-sm font-bold text-stone-800 mb-1">Explorador de Drive</h3>
        <p className="text-xs text-stone-500 mb-4">Importa catálogo, órdenes o bodega desde un archivo de Google Sheets</p>
        {driveBrowser}
      </div>
    </motion.div>
  );
}
