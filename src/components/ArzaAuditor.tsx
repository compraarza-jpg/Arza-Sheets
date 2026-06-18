import React, { useState } from 'react';
import { 
  ShieldCheck, 
  AlertOctagon, 
  Sparkles, 
  CornerDownRight, 
  FileCheck2, 
  TrendingDown, 
  Flame, 
  Send,
  HelpCircle,
  Copy,
  Check,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  MessageSquare,
  Scale,
  DollarSign,
  Layers,
  Archive
} from 'lucide-react';
import { Material, PurchaseOrder, WarehouseEntry } from '../types';

interface ArzaAuditorProps {
  materials: Material[];
  orders: PurchaseOrder[];
  warehouse: WarehouseEntry[];
  onUpdateOrder: (updatedOrder: PurchaseOrder) => void;
  onUpdateMaterial: (updatedMaterial: Material) => void;
  onBulkUpdateOrders: (updatedOrders: PurchaseOrder[]) => void;
  showToast: (msg: string) => void;
}

export default function ArzaAuditor({
  materials,
  orders,
  warehouse,
  onUpdateOrder,
  onUpdateMaterial,
  onBulkUpdateOrders,
  showToast
}: ArzaAuditorProps) {
  // Mini tabs inside the auditor
  const [auditTab, setAuditTab] = useState<'prices' | 'codes' | 'discrepancies'>('prices');
  const [copiedTextId, setCopiedTextId] = useState<string | null>(null);

  // 1. Audit Price Mismatches (Compare purchase order unit price with official catalogue price for that code)
  const getPriceMismatches = () => {
    return orders.map(order => {
      const match = materials.find(m => m.code === order.code);
      if (match && order.price !== match.price) {
        const overcharge = order.price - match.price;
        const totalLoss = overcharge * order.quantity;
        return {
          order,
          officialPrice: match.price,
          overcharge,
          totalLoss,
          isNegative: overcharge > 0 // Supplier is charging more
        };
      }
      return null;
    }).filter((item): item is NonNullable<typeof item> => item !== null);
  };

  // 2. Audit Missing/Orphan Codes (Order has a description but has a blank or temp code, or a code not in the master list)
  const getOrphanOrders = () => {
    return orders.map(order => {
      const match = materials.find(m => m.code === order.code);
      if (!match) {
        // Try to suggest a code based on closest description match (substring)
        const possibleMatches = materials.filter(m => 
          m.description.toLowerCase().includes(order.description.toLowerCase().slice(0, 8)) ||
          order.description.toLowerCase().includes(m.description.toLowerCase().slice(0, 8)) ||
          (order.code && m.code.slice(0, 3) === order.code.slice(0, 3))
        );
        return {
          order,
          suggestedMaterials: possibleMatches.slice(0, 3)
        };
      }
      return null;
    }).filter((item): item is NonNullable<typeof item> => item !== null);
  };

  // 3. Audit Warehouse receipts discrepancies compared to requested amounts
  const getWarehouseDiscrepancies = () => {
    return warehouse.filter(entry => entry.expectedQuantity !== entry.receivedQuantity);
  };

  // Handlers for specific audit corrections
  const fixPriceToPactado = (order: PurchaseOrder, officialPrice: number) => {
    const updatedOrder: PurchaseOrder = {
      ...order,
      price: officialPrice,
      total: order.quantity * officialPrice,
      observation: (order.observation || '') + ` (Precio corregido y unificado al pactado oficial de $${officialPrice}).`
    };
    onUpdateOrder(updatedOrder);
    showToast(`¡Precio de ${order.id} unificado a $${officialPrice} p/u!`);
  };

  const fixOrderCode = (order: PurchaseOrder, selectedMaterial: Material) => {
    const updatedOrder: PurchaseOrder = {
      ...order,
      code: selectedMaterial.code,
      description: selectedMaterial.description,
      price: selectedMaterial.price,
      total: order.quantity * selectedMaterial.price,
      observation: (order.observation || '') + ` (Código e insumo homologado por auditoría de Rossy a [${selectedMaterial.code}]).`
    };
    onUpdateOrder(updatedOrder);
    showToast(`¡Orden ${order.id} homologada al código maestro ${selectedMaterial.code}!`);
  };

  const fixAllPricesBulk = () => {
    const mismatches = getPriceMismatches();
    if (mismatches.length === 0) {
      showToast("No se detectaron sobrecostos en tus órdenes actuales.");
      return;
    }

    const updatedOrders = orders.map(order => {
      const match = materials.find(m => m.code === order.code);
      if (match && order.price !== match.price) {
        return {
          ...order,
          price: match.price,
          total: order.quantity * match.price,
          observation: (order.observation || '') + ` (Corrección masiva al precio pactado de $${match.price}).`
        };
      }
      return order;
    });

    onBulkUpdateOrders(updatedOrders);
    showToast(`¡Éxito total! ${mismatches.length} órdenes unificadas al precio pactado.`);
  };

  const reconcileWarehouseQty = (entry: WarehouseEntry) => {
    const relatedOrder = orders.find(o => o.id === entry.orderId);
    if (relatedOrder) {
      const updatedOrder: PurchaseOrder = {
        ...relatedOrder,
        quantity: entry.receivedQuantity,
        total: entry.receivedQuantity * relatedOrder.price,
        receivedQuantity: entry.receivedQuantity,
        status: 'completado',
        observation: (relatedOrder.observation || '') + ` (Cantidad ajustada a entrega de ${entry.receivedQuantity} p/u según bodeguero).`
      };
      onUpdateOrder(updatedOrder);
      showToast(`¡Orden ${relatedOrder.id} ajustada a ${entry.receivedQuantity} unidades entregadas!`);
    }
  };

  const copyReportToClipboard = (reportId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTextId(reportId);
    setTimeout(() => {
      setCopiedTextId(null);
    }, 2000);
    showToast("¡Texto de reporte copiado al portapapeles de Rossy! 📋");
  };

  // Live Statistics Indicators
  const mismatches = getPriceMismatches();
  const orphans = getOrphanOrders();
  const warehouseIssues = getWarehouseDiscrepancies();

  const totalOverspent = mismatches
    .filter(m => m.isNegative)
    .reduce((acc, curr) => acc + (curr.totalLoss), 0);

  const compileDraftReport = () => {
    let report = `🚨 *ARZA CONSTRUCTORA - REPORTE DE AUDITORÍA DE COMPRAS* 🚨\n`;
    report += `Generado el: ${new Date().toLocaleDateString('es-MX')} - Centro de Control de Compras\n\n`;
    
    if (mismatches.length > 0) {
      report += `💸 *SOBRECOSTOS DETECTADOS (DIF. DE PRECIO PACTADO):*\n`;
      mismatches.forEach(m => {
        report += `- [Orden ${m.order.id}] en ${m.order.project}: Se cobró a $${m.order.price} p/u en lugar de $${m.officialPrice}. Diferencia: +$${m.overcharge} p/u (Efecto total: $${m.totalLoss.toLocaleString()} MXN)\n`;
      });
      report += `*Fuga Financiera Acumulada:* $${totalOverspent.toLocaleString()} MXN\n\n`;
    } else {
      report += `✅ No se han detectado variaciones de precios cobrados vs contratados.\n\n`;
    }

    if (orphans.length > 0) {
      report += `🔗 *ÓRDENES CON CLAVES INCORRECTAS O HUÉRFANAS:*\n`;
      orphans.forEach(o => {
        report += `- [Orden ${o.order.id}] ${o.order.description}: Clave registrada [${o.order.code || 'Ninguna'}] no existe en el Catálogo Maestro.\n`;
      });
      report += `\n`;
    }

    if (warehouseIssues.length > 0) {
      report += `📦 *DISCREPANCIAS EN RECIBOS DE BODEGA (BODEGUERAS):*\n`;
      warehouseIssues.forEach(w => {
        const gap = w.expectedQuantity - w.receivedQuantity;
        report += `- [Entrada ${w.id} sobre OC ${w.orderId}]: Se esperaban ${w.expectedQuantity} pero se recibieron ${w.receivedQuantity} p/u. Faltante: -${gap} unidades. Observación: "${w.observation}" (Reportó: ${w.observer})\n`;
      });
      report += `\n`;
    }

    report += `Rossy Morales - Control de Obra Arza\nGenerado con el Agente de Sheets Inteligente.`;
    return report;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      {/* Header Banner - Emerald Accent */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-emerald-50 to-teal-100/30 p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="bg-emerald-600/10 p-2 rounded-lg border border-emerald-300/40 text-emerald-700">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-[13px] font-bold text-slate-850 uppercase tracking-wide flex items-center gap-1.5">
              Auditoría y Errores Humanos de Proveedor
              <span className="text-[9px] bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded-full font-bold">
                Margaritas & Rosy Sync
              </span>
            </h4>
            <p className="text-[11px] text-slate-500">Detecta discrepancias de cotización, códigos incorrectos y faltantes de bodega</p>
          </div>
        </div>

        <button
          onClick={fixAllPricesBulk}
          disabled={mismatches.length === 0}
          className="text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          Unificar Precios Pactados ({mismatches.length})
        </button>
      </div>

      {/* Grid of Audit Stats Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-slate-200 bg-slate-50/50 text-xs">
        <div className="p-3 border-r border-slate-200 flex items-center justify-between">
          <span className="text-slate-600 flex items-center gap-1"><DollarSign className="w-3.5 h-3.5 text-rose-500" /> Sobreprecios Detectados:</span>
          <span className={`font-mono text-sm font-bold ${totalOverspent > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            ${totalOverspent.toLocaleString('es-MX')} MXN
          </span>
        </div>
        <div className="p-3 border-r border-slate-200 flex items-center justify-between">
          <span className="text-slate-600 flex items-center gap-1"><Layers className="w-3.5 h-3.5 text-amber-500" /> Claves Erróneas:</span>
          <span className={`font-bold ${orphans.length > 0 ? 'text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200' : 'text-emerald-700'}`}>
            {orphans.length} registros
          </span>
        </div>
        <div className="p-3 flex items-center justify-between">
          <span className="text-slate-600 flex items-center gap-1"><Archive className="w-3.5 h-3.5 text-blue-500" /> Recibos Incompletos:</span>
          <span className={`font-bold ${warehouseIssues.length > 0 ? 'text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200' : 'text-emerald-700'}`}>
            {warehouseIssues.length} diferencias
          </span>
        </div>
      </div>

      {/* Audit filter Subtabs */}
      <div className="bg-slate-50 p-2 flex border-b border-slate-200 gap-1.5">
        {[
          { key: 'prices', label: '💸 Precios Alterados', count: mismatches.length, activeBg: 'bg-rose-50 text-rose-700 border-rose-200', defaultText: 'text-slate-600 hover:bg-slate-100' },
          { key: 'codes', label: '🔗 Claves Huérfanas', count: orphans.length, activeBg: 'bg-amber-50 text-amber-700 border-amber-200', defaultText: 'text-slate-600 hover:bg-slate-100' },
          { key: 'discrepancies', label: '📦 Faltantes de Flete', count: warehouseIssues.length, activeBg: 'bg-blue-50 text-blue-700 border-blue-200', defaultText: 'text-slate-600 hover:bg-slate-100' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setAuditTab(tab.key as any)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer transition-all border ${
              auditTab === tab.key
                ? `${tab.activeBg} shadow-sm font-bold`
                : `${tab.defaultText} border-transparent`
            }`}
          >
            <span>{tab.label}</span>
            {tab.count > 0 && (
              <span className="bg-white/80 border border-current px-1.5 py-0.2 rounded text-[10px] font-mono">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Auditor core lists with elegant scrollbar */}
      <div className="p-4 max-h-[300px] overflow-y-auto bg-white">
        
        {/* PRICES TAB */}
        {auditTab === 'prices' && (
          <div className="space-y-3">
            {mismatches.length > 0 ? (
              mismatches.map(({ order, officialPrice, overcharge, totalLoss }) => (
                <div 
                  key={order.id} 
                  className="bg-rose-50/20 p-3.5 rounded-xl border border-rose-200/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-rose-50/40 transition-colors"
                >
                  <div className="space-y-1 group">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold bg-rose-100 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full uppercase">
                        Precio Facturado Alto
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono font-bold uppercase">{order.id} ({order.project})</span>
                    </div>
                    <h5 className="text-[12px] font-bold text-slate-800">{order.description}</h5>
                    <div className="text-[10px] text-slate-500 font-mono flex flex-wrap gap-x-4">
                      <span>Proveedor: <strong className="text-slate-700">{order.supplier}</strong></span>
                      <span>Factura/Venta: <strong className="text-rose-600 font-bold">${order.price}</strong></span>
                      <span>Catálogo Arza: <strong className="text-emerald-600 font-bold">${officialPrice}</strong></span>
                    </div>
                    <div className="text-[11px] text-rose-700 font-semibold flex items-center pt-1">
                      <AlertOctagon className="w-3.5 h-3.5 mr-1 text-rose-500 shrink-0" />
                      Variación: +${overcharge} p/u • Gasto excedente en {order.quantity} unidades: <b className="font-mono">${totalLoss.toLocaleString()} MXN</b>
                    </div>
                  </div>

                  <button
                    onClick={() => fixPriceToPactado(order, officialPrice)}
                    className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Corregir a ${officialPrice}
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-slate-400 flex flex-col items-center justify-center space-y-2">
                <ShieldCheck className="w-8 h-8 text-emerald-500" />
                <span className="font-bold text-slate-700">¡Perfecto! Precios cuadrados</span>
                <span>Las órdenes de compra coinciden de forma exacta con los precios del padrón maestro de Margarita.</span>
              </div>
            )}
          </div>
        )}

        {/* CODES TAB */}
        {auditTab === 'codes' && (
          <div className="space-y-3">
            {orphans.length > 0 ? (
              orphans.map(({ order, suggestedMaterials }) => (
                <div 
                  key={order.id} 
                  className="bg-amber-50/20 p-3.5 rounded-xl border border-amber-200/50 flex flex-col gap-3 hover:bg-amber-50/40 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full uppercase">
                        Clave Errónea o Vacía
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono font-bold uppercase">{order.id}</span>
                    </div>
                    <h5 className="text-[12px] font-bold text-slate-850">{order.description}</h5>
                    <span className="text-[10px] text-slate-500 block font-mono">
                      Clave Capturada: <strong className="text-rose-600 bg-red-50 border border-red-100 rounded px-1">&quot;{order.code || 'En blanco'}&quot;</strong> (Margarita rechazará la facturación por catálogo no homologado)
                    </span>
                  </div>

                  {suggestedMaterials.length > 0 ? (
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        Sugerencias Inteligentes Encontradas en Excel de Registro:
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {suggestedMaterials.map(mat => (
                          <div 
                            key={mat.code}
                            className="bg-white border border-slate-200 p-2 rounded-lg flex items-center justify-between text-[11px] hover:border-slate-300 transition-all shadow-xs"
                          >
                            <div className="min-w-0 pr-2">
                              <span className="font-mono text-emerald-600 font-bold block">[{mat.code}]</span>
                              <span className="text-slate-700 truncate block font-medium">{mat.description}</span>
                            </div>
                            <button
                              onClick={() => fixOrderCode(order, mat)}
                              className="text-[10px] font-bold bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 px-2.5 py-1 rounded-md transition-colors cursor-pointer shrink-0 border border-emerald-200"
                            >
                              Homologar
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-500 bg-slate-50 p-2.5 rounded-lg flex items-center gap-1.5 border border-slate-200">
                      <HelpCircle className="w-4 h-4 text-slate-400 shrink-0" />
                      No se detectó similitud directa. Por favor registre este insumo como código maestro en la pestaña o pídale por chat al Agente que asigne una clave.
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-slate-400 flex flex-col items-center justify-center space-y-2">
                <FileCheck2 className="w-8 h-8 text-emerald-500" />
                <span className="font-bold text-slate-700">¡Sincronización impecable de claves!</span>
                <span>Todas las cotizaciones guardadas por Rosy poseen códigos oficiales de Margarita listos para enviar.</span>
              </div>
            )}
          </div>
        )}

        {/* WAREHOUSE TAB */}
        {auditTab === 'discrepancies' && (
          <div className="space-y-3">
            {warehouseIssues.length > 0 ? (
              warehouseIssues.map(entry => {
                const gap = entry.expectedQuantity - entry.receivedQuantity;
                const relatedOrder = orders.find(o => o.id === entry.orderId);
                const financialImpact = relatedOrder ? gap * relatedOrder.price : 0;

                return (
                  <div 
                    key={entry.id} 
                    className="bg-blue-50/20 p-3.5 rounded-xl border border-blue-200/50 flex flex-col gap-3 hover:bg-blue-50/40 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-bold bg-blue-100 text-blue-700 border border-blue-250 px-2 py-0.5 rounded-full uppercase">
                            Diferencia de Rendido / Chofer
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono font-bold uppercase">{entry.id} • Sobre: {entry.orderId}</span>
                        </div>
                        <h5 className="text-[12px] font-bold text-slate-800">{entry.description}</h5>
                        <div className="text-[11px] text-slate-600 font-mono leading-relaxed space-y-0.5">
                          <div>Fila solicitada: <strong className="text-slate-700">{entry.expectedQuantity} piezas</strong> (Orden de compra)</div>
                          <div>Recibido en flete: <strong className="text-rose-600 font-bold">{entry.receivedQuantity} piezas</strong> (Firma Almacén)</div>
                          <div className="text-rose-600 font-bold flex items-center">
                            ⚠️ Faltante Físico de Obra: {gap} unidades menos (Gasto fantasma: ${financialImpact.toLocaleString()} MXN)
                          </div>
                        </div>
                        {entry.observation && (
                          <p className="text-[10px] bg-white border border-slate-200 p-2 rounded-lg text-slate-500 italic mt-1 shadow-2xs">
                            Observación Almacenista: &quot;{entry.observation}&quot;
                          </p>
                        )}
                      </div>

                      <div className="flex sm:flex-col gap-1.5 shrink-0 self-end sm:self-center">
                        <button
                          onClick={() => reconcileWarehouseQty(entry)}
                          className="text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                        >
                          <Scale className="w-3.5 h-3.5" />
                          Conciliar OC a Real
                        </button>
                        
                        <button
                          onClick={() => copyReportToClipboard(
                            entry.id, 
                            `Estimado proveedor,\nEncontramos una discrepancia en el recibo de obra ${entry.id} vinculado a la orden ${entry.orderId}.\n\nInsumo: ${entry.description}\nCantidad solicitada: ${entry.expectedQuantity}\nCantidad recibida por bodeguero: ${entry.receivedQuantity}\nFaltante físico: ${gap} unidades.\n\nPor favor de enviar la aclaración para ajustar el saldo en la factura de Margarita.\n\nAtte: Control de Compras Arza`
                          )}
                          className="text-[10px] font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-250 px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                        >
                          {copiedTextId === entry.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                          Copiar Mensaje
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-xs text-slate-400 flex flex-col items-center justify-center space-y-2">
                <FileCheck2 className="w-8 h-8 text-emerald-500" />
                <span className="font-bold text-slate-700">¡Entregas en orden en bodega!</span>
                <span>Los reportes de Joli y Kari corresponden con los manifiestos de fletes. Sin pérdidas registradas.</span>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Copy Report Draft WhatsApp Sidebar widget */}
      <div className="bg-slate-50 p-4 border-t border-slate-200 bg-gradient-to-br from-white to-slate-50/50 space-y-2.5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h5 className="text-[12px] font-bold text-slate-800 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              Minuta de Audición de Carpeta WhatsApp
            </h5>
            <p className="text-[10px] text-slate-500">Perfecto para pasar un consolidado a José Pablo, Margarita o los proveedores</p>
          </div>
          <button
            onClick={() => copyReportToClipboard('general-report', compileDraftReport())}
            className="text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
          >
            {copiedTextId === 'general-report' ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                ¡Copiado!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copiar Minuta Completa
              </>
            )}
          </button>
        </div>
        <div className="text-[10px] font-mono text-slate-600 bg-white border border-slate-200 p-3 rounded-lg max-h-[90px] overflow-y-auto whitespace-pre-wrap select-all shadow-2xs">
          {compileDraftReport()}
        </div>
      </div>
    </div>
  );
}
