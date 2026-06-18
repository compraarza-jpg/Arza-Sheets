import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Search, 
  Copy, 
  HelpCircle, 
  AlertTriangle, 
  CheckCircle2, 
  SlidersHorizontal,
  Scale,
  Sparkles,
  RefreshCw,
  PlusCircle,
  Database,
  ArrowRight,
  Info,
  FileText
} from 'lucide-react';
import { Material, PurchaseOrder, WarehouseEntry } from '../types';

interface SpreadsheetGridProps {
  type: 'materials' | 'orders' | 'warehouse';
  materials: Material[];
  orders: PurchaseOrder[];
  warehouse: WarehouseEntry[];
  searchQuery: string;
  onModifyPrice?: (order: PurchaseOrder, officialPrice: number) => void;
  onModifyCode?: (order: PurchaseOrder, correctMaterial: Material) => void;
  onReconcileWarehouse?: (entry: WarehouseEntry) => void;
  showToast: (msg: string) => void;
}

export default function SpreadsheetGrid({
  type,
  materials,
  orders,
  warehouse,
  searchQuery,
  onModifyPrice,
  onModifyCode,
  onReconcileWarehouse,
  showToast
}: SpreadsheetGridProps) {
  // Active selected cell for the "f(x)" formula bar simulator
  const [selectedCell, setSelectedCell] = useState<{ row: number; colName: string; value: string }>({
    row: 1,
    colName: 'A',
    value: type === 'materials' ? '1350110' : type === 'orders' ? 'OC-2026-001' : 'REC-001'
  });

  const lowercaseSearch = searchQuery.toLowerCase();

  // Highlight helper: does this order have a price discrepancy?
  const getOrderPriceDiscrepancy = (item: PurchaseOrder) => {
    const match = materials.find(m => m.code === item.code);
    if (match && item.price !== match.price) {
      return {
        officialPrice: match.price,
        diff: item.price - match.price,
        isHigh: item.price > match.price
      };
    }
    return null;
  };

  // Highlight helper: does this order have an invalid code?
  const isCodeOrphan = (code: string) => {
    return !materials.some(m => m.code === code);
  };

  // Highlight helper: description matching suggestion for orphan codes
  const getCodeSuggestion = (item: PurchaseOrder) => {
    return materials.find(m => 
      m.description.toLowerCase().includes(item.description.toLowerCase().slice(0, 8)) ||
      item.description.toLowerCase().includes(m.description.toLowerCase().slice(0, 8))
    );
  };

  const handleCellClick = (rowIdx: number, colLetter: string, val: string) => {
    setSelectedCell({
      row: rowIdx + 1,
      colName: colLetter,
      value: val
    });
  };

  const copyCellToClipboard = (val: string) => {
    navigator.clipboard.writeText(val);
    showToast(`Copiado al portapapeles: "${val}" 📋`);
  };

  // --- RENDER MATERIALS SPREADSHEET ---
  if (type === 'materials') {
    const filteredMaterials = materials.filter(m => 
      m.code.toLowerCase().includes(lowercaseSearch) ||
      m.description.toLowerCase().includes(lowercaseSearch) ||
      m.unit.toLowerCase().includes(lowercaseSearch)
    );

    return (
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs">
        {/* Formula Bar Simulation */}
        <div className="bg-stone-50 border-b border-stone-200 px-3 py-2 flex items-center gap-2 text-xs select-none">
          <div className="font-mono bg-white px-2 py-1 border border-stone-200 rounded font-bold text-stone-600 uppercase min-w-[50px] text-center shadow-2xs">
            {selectedCell.colName}{selectedCell.row}
          </div>
          <div className="font-serif italic text-arza-700 font-extrabold pr-2 border-r border-stone-200 select-none">
            f(x)
          </div>
          <input 
            type="text" 
            readOnly 
            value={selectedCell.value}
            className="flex-1 bg-white border border-stone-200 px-3 py-1 text-stone-800 rounded font-mono text-[11px] focus:outline-none"
          />
          <span className="text-[10px] text-arza-700 bg-arza-50 border border-arza-100 rounded px-1.5 font-bold font-sans">
            MODO LEER EXCEL
          </span>
        </div>

        {/* Excel Spreadsheet Table */}
        <div className="overflow-x-auto overflow-y-auto max-h-[400px]">
          <table className="w-full border-collapse text-[11px] font-sans">
            <thead className="bg-stone-50 border-b border-stone-200 select-none sticky top-y z-10">
              <tr>
                {/* Spreadsheet Gray Corner index */}
                <th className="bg-stone-100 text-stone-500 font-bold border-r border-b border-stone-200 px-2 py-1 w-8 text-center"></th>
                <th className="border-r border-stone-200 px-3 py-1.5 text-center text-stone-500 font-bold uppercase tracking-wide">A (Código)</th>
                <th className="border-r border-stone-200 px-3 py-1.5 text-stone-500 font-bold uppercase tracking-wide text-left">B (Descripción Homologada)</th>
                <th className="border-r border-stone-200 px-3 py-1.5 text-center text-stone-500 font-bold uppercase tracking-wide">C (Unidad)</th>
                <th className="px-3 py-1.5 text-right text-stone-500 font-bold uppercase tracking-wide">D (Costo Pactado)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150">
              {filteredMaterials.map((m, index) => {
                const rowNum = index + 1;
                return (
                  <tr key={m.code} className="hover:bg-stone-50 transition-colors group">
                    {/* Row Index Indicator */}
                    <td className="bg-stone-100/60 group-hover:bg-stone-100 text-stone-500 font-mono text-[10px] font-bold border-r border-stone-200 text-center select-none py-1.5">
                      {rowNum}
                    </td>

                    {/* Col A: Code */}
                    <td 
                      onClick={() => handleCellClick(index, 'A', m.code)}
                      className={`border-r border-stone-100 px-3 py-1.5 font-mono font-bold text-arza-800 cursor-cell select-all ${
                        selectedCell.row === index + 1 && selectedCell.colName === 'A' 
                          ? 'outline-2 outline-emerald-500 bg-arza-100/30' 
                          : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{m.code}</span>
                        <button 
                          onClick={(e) => { e.stopPropagation(); copyCellToClipboard(m.code); }}
                          className="opacity-0 group-hover:opacity-100 hover:text-arza-700 text-stone-400 p-0.5 ml-1 transition-all rounded"
                          title="Copiar código"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </td>

                    {/* Col B: Description */}
                    <td 
                      onClick={() => handleCellClick(index, 'B', m.description)}
                      className={`border-r border-stone-100 px-3 py-1.5 text-stone-700 font-medium cursor-cell select-text ${
                        selectedCell.row === index + 1 && selectedCell.colName === 'B' 
                          ? 'outline-2 outline-emerald-500 bg-arza-100/30' 
                          : ''
                      }`}
                    >
                      {m.description}
                    </td>

                    {/* Col C: Unit */}
                    <td 
                      onClick={() => handleCellClick(index, 'C', m.unit)}
                      className={`border-r border-stone-100 px-3 py-1.5 text-center font-mono text-stone-500 cursor-cell ${
                        selectedCell.row === index + 1 && selectedCell.colName === 'C' 
                          ? 'outline-2 outline-emerald-500 bg-arza-100/30' 
                          : ''
                      }`}
                    >
                      {m.unit}
                    </td>

                    {/* Col D: Price */}
                    <td 
                      onClick={() => handleCellClick(index, 'D', `$${m.price.toFixed(2)}`)}
                      className={`px-3 py-1.5 text-right font-mono font-bold text-stone-800 cursor-cell ${
                        selectedCell.row === index + 1 && selectedCell.colName === 'D' 
                          ? 'outline-2 outline-emerald-500 bg-arza-100/30' 
                          : ''
                      }`}
                    >
                      ${m.price.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
              {filteredMaterials.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center mb-3">
                        <Search className="w-5 h-5 text-stone-400" />
                      </div>
                      <p className="text-sm font-semibold text-stone-700">No se encontraron materiales</p>
                      <p className="text-xs text-stone-500 mt-1 max-w-xs">Intenta con otra búsqueda o pídele al agente que cargue el catálogo maestro.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // --- RENDER PURCHASE ORDERS SPREADSHEET ---
  if (type === 'orders') {
    const filteredOrders = orders.filter(o => 
      o.id.toLowerCase().includes(lowercaseSearch) ||
      o.project.toLowerCase().includes(lowercaseSearch) ||
      o.supplier.toLowerCase().includes(lowercaseSearch) ||
      o.description.toLowerCase().includes(lowercaseSearch) ||
      o.code.toLowerCase().includes(lowercaseSearch)
    );

    return (
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs">
        {/* Formula Bar Simulation */}
        <div className="bg-stone-50 border-b border-stone-200 px-3 py-2 flex items-center gap-2 text-xs select-none">
          <div className="font-mono bg-white px-2 py-1 border border-stone-200 rounded font-bold text-stone-600 uppercase min-w-[50px] text-center shadow-2xs">
            {selectedCell.colName}{selectedCell.row}
          </div>
          <div className="font-serif italic text-arza-700 font-extrabold pr-2 border-r border-stone-200">
            f(x)
          </div>
          <input 
            type="text" 
            readOnly 
            value={selectedCell.value}
            className="flex-1 bg-white border border-stone-200 px-3 py-1 text-stone-800 rounded font-mono text-[11px] focus:outline-none"
          />
          <div className="text-[10px] text-stone-500 flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" title="Error de Precio" /> Sobreprecio
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" title="Clave Erránea" /> Código Inválido
          </div>
        </div>

        {/* Excel Spreadsheet Table */}
        <div className="overflow-x-auto overflow-y-auto max-h-[440px]">
          <table className="w-full border-collapse text-[11.5px] font-sans">
            <thead className="bg-stone-50 border-b border-stone-200 select-none sticky top-y z-10 text-center">
              <tr>
                {/* Row Number Column Header */}
                <th className="bg-stone-100 text-stone-500 font-bold border-r border-b border-stone-200 px-2 py-1 w-8 text-center"></th>
                <th className="border-r border-stone-200 px-2.5 py-1.5 text-stone-500 font-bold uppercase tracking-wide">ID (OC)</th>
                <th className="border-r border-stone-200 px-2.5 py-1.5 text-stone-500 font-bold uppercase tracking-wide">Obra</th>
                <th className="border-r border-stone-200 px-2.5 py-1.5 text-stone-500 font-bold uppercase tracking-wide">Código</th>
                <th className="border-r border-stone-200 px-2.5 py-1.5 text-stone-500 font-bold uppercase tracking-wide text-left">Insumo / Descripción</th>
                <th className="border-r border-stone-200 px-2.5 py-1.5 text-stone-500 font-bold uppercase tracking-wide">Cant.</th>
                <th className="border-r border-stone-200 px-2.5 py-1.5 text-stone-500 font-bold uppercase tracking-wide text-right">Precio Facturado</th>
                <th className="border-r border-stone-200 px-2.5 py-1.5 text-stone-500 font-bold uppercase tracking-wide text-right">Total O.C.</th>
                <th className="px-2.5 py-1.5 text-stone-500 font-bold uppercase tracking-wide text-center">Acciones Unificadoras</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150">
              {filteredOrders.map((o, index) => {
                const rowNum = index + 1;
                const priceIssues = getOrderPriceDiscrepancy(o);
                const codeOrphan = isCodeOrphan(o.code);
                const codeSuggestion = codeOrphan ? getCodeSuggestion(o) : null;

                return (
                  <tr 
                    key={o.id} 
                    className={`hover:bg-stone-50 transition-colors group ${
                      priceIssues ? 'bg-rose-50/10' : codeOrphan ? 'bg-amber-50/10' : ''
                    }`}
                  >
                    {/* Row Index */}
                    <td className="bg-stone-100/60 group-hover:bg-stone-100 text-stone-500 font-mono text-[10px] font-bold border-r border-stone-200 text-center select-none py-2">
                      {rowNum}
                    </td>

                    {/* ID */}
                    <td 
                      onClick={() => handleCellClick(index, 'A', o.id)}
                      className={`border-r border-stone-100 px-2.5 py-2 font-mono font-bold text-stone-600 text-center cursor-cell ${
                        selectedCell.row === index + 1 && selectedCell.colName === 'A' 
                          ? 'outline-2 outline-emerald-500 bg-arza-100/30' 
                          : ''
                      }`}
                    >
                      {o.id}
                    </td>

                    {/* Project */}
                    <td 
                      onClick={() => handleCellClick(index, 'B', o.project)}
                      className={`border-r border-stone-100 px-2.5 py-2 text-stone-700 font-bold text-center cursor-cell ${
                        selectedCell.row === index + 1 && selectedCell.colName === 'B' 
                          ? 'outline-2 outline-emerald-500 bg-arza-100/30' 
                          : ''
                      }`}
                    >
                      {o.project}
                    </td>

                    {/* Code - highlighted if errant or orphan */}
                    <td 
                      onClick={() => handleCellClick(index, 'C', o.code)}
                      className={`border-r border-stone-100 px-2.5 py-2 font-mono text-center cursor-cell ${
                        codeOrphan 
                          ? 'bg-amber-100/40 text-amber-800 font-black border-dashed border-amber-300' 
                          : 'text-arza-700 font-bold'
                      } ${
                        selectedCell.row === index + 1 && selectedCell.colName === 'C' 
                          ? 'outline-2 outline-emerald-500 bg-arza-100/30' 
                          : ''
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>{o.code || 'NULL'}</span>
                        {codeOrphan && (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" title="Código inválido en catálogo" />
                        )}
                      </div>
                    </td>

                    {/* Description */}
                    <td 
                      onClick={() => handleCellClick(index, 'D', o.description)}
                      className={`border-r border-stone-100 px-2.5 py-2 text-stone-700 cursor-cell font-medium ${
                        selectedCell.row === index + 1 && selectedCell.colName === 'D' 
                          ? 'outline-2 outline-emerald-500 bg-arza-100/30' 
                          : ''
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-stone-800">{o.description}</div>
                        <div className="text-[9px] text-stone-400 font-mono">Proveedor: {o.supplier}</div>
                      </div>
                    </td>

                    {/* Quantity */}
                    <td 
                      onClick={() => handleCellClick(index, 'E', `${o.quantity} ${o.unit}`)}
                      className={`border-r border-stone-100 px-2.5 py-2 text-center font-mono font-bold text-stone-800 cursor-cell ${
                        selectedCell.row === index + 1 && selectedCell.colName === 'E' 
                          ? 'outline-2 outline-emerald-500 bg-arza-100/30' 
                          : ''
                      }`}
                    >
                      {o.quantity} {o.unit}
                    </td>

                    {/* Price - highlighted if overcharged */}
                    <td 
                      onClick={() => handleCellClick(index, 'F', `$${o.price}`)}
                      className={`border-r border-stone-100 px-2.5 py-2 text-right font-mono cursor-cell ${
                        priceIssues 
                          ? 'bg-rose-100/40 text-rose-700 font-black border-dashed border-rose-300' 
                          : 'text-stone-800 font-semibold'
                      } ${
                        selectedCell.row === index + 1 && selectedCell.colName === 'F' 
                          ? 'outline-2 outline-emerald-500 bg-arza-100/30' 
                          : ''
                      }`}
                    >
                      <div>
                        <span>${o.price.toFixed(2)}</span>
                        {priceIssues && (
                          <div className="text-[8.5px] text-rose-500 font-sans font-bold">Pactado: ${priceIssues.officialPrice}</div>
                        )}
                      </div>
                    </td>

                    {/* Total */}
                    <td 
                      onClick={() => handleCellClick(index, 'G', `$${o.total}`)}
                      className={`border-r border-stone-100 px-2.5 py-2 text-right font-mono font-bold text-stone-900 cursor-cell ${
                        selectedCell.row === index + 1 && selectedCell.colName === 'G' 
                          ? 'outline-2 outline-emerald-500 bg-arza-100/30' 
                          : ''
                      }`}
                    >
                      ${o.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>

                    {/* Activas Corrective actions inline */}
                    <td className="px-2.5 py-1.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {priceIssues && onModifyPrice && (
                          <button
                            onClick={() => onModifyPrice(o, priceIssues.officialPrice)}
                            className="bg-rose-600 hover:bg-rose-700 text-white text-[9.5px] font-bold px-2 py-1 rounded transition-colors cursor-pointer"
                            title="Unificar precio cobrado al pactado"
                          >
                            Unificar Precio
                          </button>
                        )}

                        {codeOrphan && codeSuggestion && onModifyCode && (
                          <button
                            onClick={() => onModifyCode(o, codeSuggestion)}
                            className="bg-amber-600 hover:bg-amber-700 text-white text-[9.5px] font-bold px-2 py-1 rounded transition-colors cursor-pointer"
                            title={`Cambiar clave errada por ${codeSuggestion.code}`}
                          >
                            Homologar [{codeSuggestion.code}]
                          </button>
                        )}

                        {!priceIssues && !codeOrphan && (
                          <span className="text-[9px] bg-arza-100 text-arza-800 font-bold border border-arza-200 px-1.5 py-0.5 rounded-full">
                            ✓ Cuadrado
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={9}>
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center mb-3">
                        <FileSpreadsheet className="w-5 h-5 text-stone-400" />
                      </div>
                      <p className="text-sm font-semibold text-stone-700">No hay órdenes de compra</p>
                      <p className="text-xs text-stone-500 mt-1 max-w-xs">Crea una orden manualmente o pídele al agente que genere una nueva OC.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // --- RENDER WAREHOUSE DISCREPANCIES SPREADSHEET ---
  if (type === 'warehouse') {
    const filteredWarehouse = warehouse.filter(w => 
      w.id.toLowerCase().includes(lowercaseSearch) ||
      w.orderId.toLowerCase().includes(lowercaseSearch) ||
      w.description.toLowerCase().includes(lowercaseSearch) ||
      w.observer.toLowerCase().includes(lowercaseSearch)
    );

    return (
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs">
        {/* Formula Bar Simulation */}
        <div className="bg-stone-50 border-b border-stone-200 px-3 py-2 flex items-center gap-2 text-xs select-none">
          <div className="font-mono bg-white px-2 py-1 border border-stone-200 rounded font-bold text-stone-600 uppercase min-w-[50px] text-center shadow-2xs">
            {selectedCell.colName}{selectedCell.row}
          </div>
          <div className="font-serif italic text-arza-700 font-extrabold pr-2 border-r border-stone-200">
            f(x)
          </div>
          <input 
            type="text" 
            readOnly 
            value={selectedCell.value}
            className="flex-1 bg-white border border-stone-200 px-3 py-1 text-stone-800 rounded font-mono text-[11px] focus:outline-none"
          />
          <div className="text-[10px] text-stone-500">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> Faltante / Discrepancia de Bodega
          </div>
        </div>

        {/* Excel Spreadsheet Table */}
        <div className="overflow-x-auto overflow-y-auto max-h-[400px]">
          <table className="w-full border-collapse text-[11px] font-sans">
            <thead className="bg-stone-50 border-b border-stone-200 select-none sticky top-y z-10 text-center">
              <tr>
                <th className="bg-stone-100 text-stone-500 font-bold border-r border-b border-stone-200 px-2 py-1 w-8 text-center"></th>
                <th className="border-r border-stone-200 px-3 py-1.5 text-stone-500 font-bold uppercase tracking-wide">Folio Entrada</th>
                <th className="border-r border-stone-200 px-3 py-1.5 text-stone-500 font-bold uppercase tracking-wide">Vinculo (O.C.)</th>
                <th className="border-r border-stone-200 px-3 py-1.5 text-stone-500 font-bold uppercase tracking-wide text-left">Insumo Recibido</th>
                <th className="border-r border-stone-200 px-3 py-1.5 text-stone-500 font-bold uppercase tracking-wide">Cant. Esperada</th>
                <th className="border-r border-stone-200 px-3 py-1.5 text-stone-500 font-bold uppercase tracking-wide">Cant. Recibida</th>
                <th className="border-r border-stone-200 px-3 py-1.5 text-stone-500 font-bold uppercase tracking-wide">Recibió (Bodega)</th>
                <th className="border-r border-stone-200 px-3 py-1.5 text-stone-500 font-bold uppercase tracking-wide text-left">Observaciones de Entrega</th>
                <th className="px-3 py-1.5 text-stone-500 font-bold uppercase tracking-wide">Conciliar Saldo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150">
              {filteredWarehouse.map((w, index) => {
                const rowNum = index + 1;
                const gap = w.expectedQuantity - w.receivedQuantity;
                const hasDiscrepancy = gap > 0;

                return (
                  <tr 
                    key={w.id} 
                    className={`hover:bg-stone-50 transition-colors group ${
                      hasDiscrepancy ? 'bg-blue-50/10' : ''
                    }`}
                  >
                    {/* Row Index */}
                    <td className="bg-stone-100/60 group-hover:bg-stone-100 text-stone-500 font-mono text-[10px] font-bold border-r border-stone-200 text-center select-none py-2.5">
                      {rowNum}
                    </td>

                    {/* Folio */}
                    <td 
                      onClick={() => handleCellClick(index, 'A', w.id)}
                      className={`border-r border-stone-100 px-3 py-2.5 font-mono font-bold text-stone-600 text-center cursor-cell ${
                        selectedCell.row === index + 1 && selectedCell.colName === 'A' 
                          ? 'outline-2 outline-emerald-500 bg-arza-100/30' 
                          : ''
                      }`}
                    >
                      {w.id}
                    </td>

                    {/* Order ID Link */}
                    <td 
                      onClick={() => handleCellClick(index, 'B', w.orderId)}
                      className={`border-r border-stone-100 px-3 py-2.5 font-mono text-center cursor-cell font-bold text-stone-500 ${
                        selectedCell.row === index + 1 && selectedCell.colName === 'B' 
                          ? 'outline-2 outline-emerald-500 bg-arza-100/30' 
                          : ''
                      }`}
                    >
                      {w.orderId}
                    </td>

                    {/* Description */}
                    <td 
                      onClick={() => handleCellClick(index, 'C', w.description)}
                      className={`border-r border-stone-100 px-3 py-2.5 text-stone-700 font-medium cursor-cell ${
                        selectedCell.row === index + 1 && selectedCell.colName === 'C' 
                          ? 'outline-2 outline-emerald-500 bg-arza-100/30' 
                          : ''
                      }`}
                    >
                      {w.description}
                    </td>

                    {/* Expected Qty */}
                    <td 
                      onClick={() => handleCellClick(index, 'D', `${w.expectedQuantity} pzas`)}
                      className={`border-r border-stone-100 px-3 py-2.5 text-center font-mono text-stone-600 cursor-cell ${
                        selectedCell.row === index + 1 && selectedCell.colName === 'D' 
                          ? 'outline-2 outline-emerald-500 bg-arza-100/30' 
                          : ''
                      }`}
                    >
                      {w.expectedQuantity}
                    </td>

                    {/* Received Qty - highlighted if different */}
                    <td 
                      onClick={() => handleCellClick(index, 'E', `${w.receivedQuantity} pzas`)}
                      className={`border-r border-stone-100 px-3 py-2.5 text-center font-mono cursor-cell ${
                        hasDiscrepancy 
                          ? 'bg-blue-100/50 text-blue-800 font-black border-dashed border-blue-300' 
                          : 'text-arza-700 font-bold'
                      } ${
                        selectedCell.row === index + 1 && selectedCell.colName === 'E' 
                          ? 'outline-2 outline-emerald-500 bg-arza-100/30' 
                          : ''
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>{w.receivedQuantity}</span>
                        {hasDiscrepancy && (
                          <span className="text-[10px] text-blue-600 font-bold" title={`Faltante: -${gap}`}>(-{gap})</span>
                        )}
                      </div>
                    </td>

                    {/* Observer */}
                    <td 
                      onClick={() => handleCellClick(index, 'F', w.observer)}
                      className={`border-r border-stone-100 px-3 py-2.5 text-center text-stone-600 cursor-cell font-medium uppercase ${
                        selectedCell.row === index + 1 && selectedCell.colName === 'F' 
                          ? 'outline-2 outline-emerald-500 bg-arza-100/30' 
                          : ''
                      }`}
                    >
                      {w.observer}
                    </td>

                    {/* Observation text */}
                    <td 
                      onClick={() => handleCellClick(index, 'G', w.observation || '')}
                      className={`border-r border-stone-100 px-3 py-2.5 text-stone-500 italic cursor-cell ${
                        selectedCell.row === index + 1 && selectedCell.colName === 'G' 
                          ? 'outline-2 outline-emerald-500 bg-arza-100/30' 
                          : ''
                      }`}
                    >
                      {w.observation || <span className="text-stone-300">Ninguna</span>}
                    </td>

                    {/* Reconcile Action Button */}
                    <td className="px-3 py-1 text-center">
                      {hasDiscrepancy && onReconcileWarehouse ? (
                        <button
                          onClick={() => onReconcileWarehouse(w)}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-[9.5px] font-bold px-2 py-1 rounded transition-colors cursor-pointer"
                          title="Ajustar factura/orden de compra a lo recibido físicamente para que coincida"
                        >
                          Ajustar O.C.
                        </button>
                      ) : (
                        <span className="text-[9.5px] bg-arza-100 text-arza-800 font-bold border border-arza-200 px-1.5 py-0.5 rounded-full">
                          Completo ✓
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredWarehouse.length === 0 && (
                <tr>
                  <td colSpan={9}>
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center mb-3">
                        <FileText className="w-5 h-5 text-stone-400" />
                      </div>
                      <p className="text-sm font-semibold text-stone-700">Sin entradas de bodega</p>
                      <p className="text-xs text-stone-500 mt-1 max-w-xs">Registra un recibo parcial o completo para empezar a rastrear discrepancias.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return null;
}
