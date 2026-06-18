/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  ShieldCheck,
  AlertOctagon,
  Sparkles,
  FileCheck2,
  Layers,
  Archive,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  MessageSquare,
  FileSpreadsheet,
  Search,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  GitMerge,
  DollarSign,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type {
  Material,
  PurchaseOrder,
  WarehouseEntry,
  AuditIssue,
  DuplicateGroup,
  CodeSuggestion,
} from '../types';

interface ArzaAuditorProps {
  materials: Material[];
  orders: PurchaseOrder[];
  warehouse: WarehouseEntry[];
  token: string | null;
  onUpdateOrder: (updatedOrder: PurchaseOrder) => void;
  onUpdateMaterial: (updatedMaterial: Material) => void;
  onBulkUpdateOrders: (updatedOrders: PurchaseOrder[]) => void;
  showToast: (msg: string) => void;
}

type AuditTab = 'issues' | 'duplicates' | 'codes';

function severityBadge(severity: AuditIssue['severity']) {
  switch (severity) {
    case 'critical':
      return 'bg-rose-100 text-rose-700 border-rose-200';
    case 'warning':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    default:
      return 'bg-stone-100 text-stone-600 border-stone-200';
  }
}

function severityLabel(severity: AuditIssue['severity']) {
  switch (severity) {
    case 'critical':
      return 'Crítico';
    case 'warning':
      return 'Advertencia';
    default:
      return 'Informativo';
  }
}

export default function ArzaAuditor({
  materials,
  orders,
  warehouse,
  token,
  onUpdateOrder,
  onUpdateMaterial,
  onBulkUpdateOrders,
  showToast,
}: ArzaAuditorProps) {
  const [activeTab, setActiveTab] = useState<AuditTab>('issues');
  const [issues, setIssues] = useState<AuditIssue[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [codeSuggestions, setCodeSuggestions] = useState<CodeSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [fallback, setFallback] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const runAudit = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ materials, orders, warehouse }),
      });
      const data = await res.json();
      setIssues(data.issues || []);
      setDuplicates(data.duplicates || []);
      setFallback(Boolean(data.fallback));
    } catch (err) {
      console.error('Audit request failed:', err);
      showToast('No se pudo contactar al auditor. Usando análisis local.');
      setFallback(true);
      setIssues([]);
      setDuplicates([]);
    } finally {
      setLoading(false);
    }
  };

  const runCodeSuggestions = async () => {
    try {
      const res = await fetch('/api/audit/suggest-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ materials }),
      });
      const data = await res.json();
      setCodeSuggestions(data.suggestions || []);
    } catch (err) {
      console.error('Code suggestions failed:', err);
      setCodeSuggestions([]);
    }
  };

  useEffect(() => {
    runAudit();
    runCodeSuggestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materials.length, orders.length, warehouse.length]);

  const stats = useMemo(() => {
    const critical = issues.filter((i) => i.severity === 'critical').length;
    const warning = issues.filter((i) => i.severity === 'warning').length;
    const info = issues.filter((i) => i.severity === 'info').length;
    const financialImpact = issues.reduce((acc, i) => acc + (i.impact || 0), 0);
    return { critical, warning, info, financialImpact, total: issues.length };
  }, [issues]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    showToast('Texto copiado al portapapeles 📋');
  };

  const exportToSheets = async () => {
    if (!token) {
      showToast('Conecta Google primero para exportar a Sheets.');
      return;
    }
    setExporting(true);
    try {
      const res = await fetch('/api/audit/export-to-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: token,
          issues,
          duplicates,
          suggestions: codeSuggestions,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Auditoría exportada a Sheets: ${data.title}`);
      } else {
        showToast(`Error al exportar: ${data.error || 'desconocido'}`);
      }
    } catch (err) {
      console.error('Export error:', err);
      showToast('No se pudo exportar a Sheets.');
    } finally {
      setExporting(false);
    }
  };

  const handleFixPrice = (issue: AuditIssue) => {
    const order = orders.find((o) => o.id === issue.data.orderId);
    const expected = issue.data.expected as number | undefined;
    if (!order || expected === undefined) return;
    const updated: PurchaseOrder = {
      ...order,
      price: expected,
      total: order.quantity * expected,
      observation:
        (order.observation || '') +
        ` [Auditoría] Precio corregido de $${order.price} a $${expected} tras aprobación de Rossy.`,
    };
    onUpdateOrder(updated);
    showToast(`Orden ${order.id} corregida a precio pactado $${expected}`);
  };

  const handleFixOrphan = (issue: AuditIssue, material: Material) => {
    const order = orders.find((o) => o.id === issue.data.orderId);
    if (!order) return;
    const updated: PurchaseOrder = {
      ...order,
      code: material.code,
      description: material.description,
      price: material.price,
      total: order.quantity * material.price,
      observation:
        (order.observation || '') +
        ` [Auditoría] Código homologado a ${material.code} (${material.description}) tras aprobación de Rossy.`,
    };
    onUpdateOrder(updated);
    showToast(`Orden ${order.id} homologada a ${material.code}`);
  };

  const handleCreateMaterialForOrphan = (issue: AuditIssue) => {
    const order = orders.find((o) => o.id === issue.data.orderId);
    if (!order) return;
    const exists = materials.some((m) => m.code === order.code);
    if (exists) {
      showToast('El código ya existe en el catálogo. Usa homologar en lugar de crear.');
      return;
    }
    const newMaterial: Material = {
      code: order.code,
      description: order.description,
      unit: order.unit,
      price: order.price,
    };
    onUpdateMaterial(newMaterial);
    showToast(`Nuevo material ${order.code} agregado al catálogo maestro`);
  };

  const handleFixWarehouse = (issue: AuditIssue) => {
    const entry = warehouse.find((w) => w.orderId === issue.data.orderId);
    const order = orders.find((o) => o.id === issue.data.orderId);
    if (!entry || !order) return;
    const received = entry.receivedQuantity;
    const updated: PurchaseOrder = {
      ...order,
      receivedQuantity: received,
      status: received >= order.quantity ? 'completado' : 'parcial',
      observation:
        (order.observation || '') +
        ` [Auditoría] Cantidad conciliada a ${received} unidades según recepción de bodega.`,
    };
    onUpdateOrder(updated);
    showToast(`Orden ${order.id} conciliada con bodega`);
  };

  const handleMergeDuplicates = (group: DuplicateGroup) => {
    const codesToMerge = group.items.map((i) => i.code);
    const updatedOrders = orders.map((o) => {
      if (codesToMerge.includes(o.code)) {
        return {
          ...o,
          code: group.suggestedCode,
          description: group.canonicalDescription,
          observation:
            (o.observation || '') +
            ` [Auditoría] Código fusionado a ${group.suggestedCode} por duplicidad detectada.`,
        };
      }
      return o;
    });
    onBulkUpdateOrders(updatedOrders);
    showToast(`Duplicados fusionados bajo ${group.suggestedCode}`);
  };

  const handleApplySuggestion = (suggestion: CodeSuggestion) => {
    const exists = materials.some((m) => m.code === suggestion.suggestedCode);
    if (exists) {
      showToast('El código sugerido ya existe. Revisa antes de aplicar.');
      return;
    }
    const newMaterial: Material = {
      code: suggestion.suggestedCode,
      description: suggestion.materialDescription,
      unit: 'PZ',
      price: suggestion.suggestedPrice,
    };
    onUpdateMaterial(newMaterial);
    showToast(`Código ${suggestion.suggestedCode} registrado en catálogo`);
  };

  const compileReport = () => {
    let report = `🚨 *ARZA CONSTRUCTORA - REPORTE DE AUDITORÍA* 🚨\n`;
    report += `Generado: ${new Date().toLocaleDateString('es-MX')}\n`;
    report += `Hallazgos: ${stats.total} | Críticos: ${stats.critical} | Advertencias: ${stats.warning} | Impacto: $${stats.financialImpact.toLocaleString('es-MX')} MXN\n\n`;
    issues.forEach((i) => {
      report += `- [${severityLabel(i.severity)}] ${i.title}: ${i.description}\n`;
      report += `  Acción sugerida: ${i.suggestedAction}\n\n`;
    });
    if (duplicates.length) {
      report += `\n🔗 *POSIBLES DUPLICADOS EN CATÁLOGO:*\n`;
      duplicates.forEach((g) => {
        report += `- ${g.canonicalDescription} → usar ${g.suggestedCode}\n`;
      });
    }
    return report;
  };

  const orphanSuggestionsFor = (issue: AuditIssue) => {
    const order = orders.find((o) => o.id === issue.data.orderId);
    if (!order) return [];
    const term = order.description.toLowerCase().slice(0, 8);
    return materials
      .filter(
        (m) =>
          m.description.toLowerCase().includes(term) ||
          order.description.toLowerCase().includes(m.description.toLowerCase().slice(0, 8))
      )
      .slice(0, 4);
  };

  return (
    <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-arza-500/10 via-emerald-50 to-arza-100/30 p-4 border-b border-stone-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="bg-arza-600/10 p-2 rounded-lg border border-arza-300/40 text-arza-700">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-[13px] font-bold text-stone-800 uppercase tracking-wide flex items-center gap-1.5">
              Auditoría de Datos
              {fallback && (
                <span className="text-[9px] bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-bold">
                  Modo local
                </span>
              )}
            </h4>
            <p className="text-[11px] text-stone-500">
              Hallazgos del agente. Rossy aprueba cada corrección; nunca se tocan los Excel fuente sin permiso.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={runAudit}
            disabled={loading}
            className="text-[11px] font-bold bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Analizando...' : 'Volver a auditar'}
          </button>
          <button
            onClick={() => copyText('general-report', compileReport())}
            className="text-[11px] font-bold bg-arza-600 hover:bg-arza-700 text-white px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            {copiedId === 'general-report' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            Copiar reporte
          </button>
          <button
            onClick={exportToSheets}
            disabled={exporting || !token}
            className="text-[11px] font-bold bg-white hover:bg-stone-50 disabled:opacity-40 text-stone-700 border border-stone-200 px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <FileSpreadsheet className={`w-4 h-4 ${exporting ? 'animate-spin' : ''}`} />
            {exporting ? 'Exportando...' : 'Exportar a Sheets'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-stone-200 bg-stone-50/50 text-xs">
        <div className="p-3 border-r border-stone-200 flex flex-col">
          <span className="text-stone-500 text-[10px] uppercase tracking-wider font-semibold">Hallazgos</span>
          <span className="font-mono text-lg font-bold text-stone-800">{stats.total}</span>
        </div>
        <div className="p-3 border-r border-stone-200 flex flex-col">
          <span className="text-stone-500 text-[10px] uppercase tracking-wider font-semibold">Críticos</span>
          <span className="font-mono text-lg font-bold text-rose-600">{stats.critical}</span>
        </div>
        <div className="p-3 border-r border-stone-200 flex flex-col">
          <span className="text-stone-500 text-[10px] uppercase tracking-wider font-semibold">Advertencias</span>
          <span className="font-mono text-lg font-bold text-amber-600">{stats.warning}</span>
        </div>
        <div className="p-3 flex flex-col">
          <span className="text-stone-500 text-[10px] uppercase tracking-wider font-semibold">Impacto estimado</span>
          <span className="font-mono text-lg font-bold text-stone-800">
            ${stats.financialImpact.toLocaleString('es-MX')}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-stone-50 p-2 flex border-b border-stone-200 gap-1.5">
        {[
          { key: 'issues', label: 'Hallazgos', count: issues.length },
          { key: 'duplicates', label: 'Duplicados', count: duplicates.length },
          { key: 'codes', label: 'Sugerir códigos', count: codeSuggestions.length },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as AuditTab)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer transition-all border ${
              activeTab === tab.key
                ? 'bg-arza-100 text-arza-800 border-arza-300 shadow-sm'
                : 'text-stone-600 hover:bg-stone-100 border-transparent'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="bg-white/80 border border-current px-1.5 py-0.5 rounded text-[10px] font-mono">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4 max-h-[420px] overflow-y-auto bg-white">
        <AnimatePresence mode="wait">
          {activeTab === 'issues' && (
            <motion.div
              key="issues"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="space-y-3"
            >
              {issues.length === 0 ? (
                <div className="text-center py-10 text-xs text-stone-400 flex flex-col items-center justify-center space-y-2">
                  <ShieldCheck className="w-8 h-8 text-arza-500" />
                  <span className="font-bold text-stone-700">No se detectaron inconsistencias</span>
                  <span>El análisis local y el agente no encontraron problemas relevantes.</span>
                </div>
              ) : (
                issues.map((issue) => {
                  const isOpen = expanded[issue.id];
                  return (
                    <div
                      key={issue.id}
                      className={`rounded-xl border p-3.5 transition-colors ${
                        issue.severity === 'critical'
                          ? 'bg-rose-50/30 border-rose-200/60 hover:bg-rose-50/50'
                          : issue.severity === 'warning'
                            ? 'bg-amber-50/30 border-amber-200/60 hover:bg-amber-50/50'
                            : 'bg-stone-50 border-stone-200 hover:bg-stone-100/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase ${severityBadge(issue.severity)}`}
                            >
                              {severityLabel(issue.severity)}
                            </span>
                            <span className="text-[10px] text-stone-500 font-mono font-bold uppercase">
                              {issue.type}
                            </span>
                          </div>
                          <h5 className="text-[12px] font-bold text-stone-800">{issue.title}</h5>
                          <p className="text-[11px] text-stone-600 leading-relaxed">{issue.description}</p>
                          {issue.impact > 0 && (
                            <p className="text-[11px] font-mono text-stone-700">
                              Impacto estimado:{' '}
                              <strong className={issue.severity === 'critical' ? 'text-rose-600' : 'text-amber-600'}>
                                ${issue.impact.toLocaleString('es-MX')} MXN
                              </strong>
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => toggleExpand(issue.id)}
                          className="shrink-0 text-stone-400 hover:text-stone-700 transition-colors"
                        >
                          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>

                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="pt-3 mt-3 border-t border-stone-200/70 space-y-3">
                              <div className="text-[10px] text-stone-500 font-mono bg-white border border-stone-200 p-2 rounded-lg">
                                <strong>Acción sugerida:</strong> {issue.suggestedAction}
                              </div>

                              {issue.type === 'price_mismatch' && (
                                <button
                                  onClick={() => handleFixPrice(issue)}
                                  className="text-[11px] font-bold bg-arza-600 hover:bg-arza-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                                >
                                  <DollarSign className="w-3.5 h-3.5" />
                                  Aprobar corrección de precio
                                </button>
                              )}

                              {issue.type === 'orphan_code' && (
                                <div className="space-y-2">
                                  <p className="text-[10px] font-semibold text-stone-600 uppercase tracking-wider">
                                    Homologar con catálogo maestro
                                  </p>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {orphanSuggestionsFor(issue).map((mat) => (
                                      <div
                                        key={mat.code}
                                        className="flex items-center justify-between bg-white border border-stone-200 p-2 rounded-lg"
                                      >
                                        <div className="min-w-0 pr-2">
                                          <span className="font-mono text-arza-600 font-bold text-[11px] block">
                                            {mat.code}
                                          </span>
                                          <span className="text-stone-700 text-[11px] truncate block">
                                            {mat.description}
                                          </span>
                                        </div>
                                        <button
                                          onClick={() => handleFixOrphan(issue, mat)}
                                          className="text-[10px] font-bold bg-arza-50 hover:bg-arza-600 hover:text-white text-arza-700 px-2.5 py-1 rounded-md transition-colors cursor-pointer shrink-0 border border-arza-200"
                                        >
                                          Homologar
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                  <button
                                    onClick={() => handleCreateMaterialForOrphan(issue)}
                                    className="text-[10px] font-bold bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                                  >
                                    <Sparkles className="w-3.5 h-3.5" />
                                    Agregar orden como nuevo material maestro
                                  </button>
                                </div>
                              )}

                              {issue.type === 'warehouse_discrepancy' && (
                                <button
                                  onClick={() => handleFixWarehouse(issue)}
                                  className="text-[11px] font-bold bg-arza-600 hover:bg-arza-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Aprobar conciliación con bodega
                                </button>
                              )}

                              <button
                                onClick={() => copyText(issue.id, `${issue.title}\n${issue.description}\n${issue.suggestedAction}`)}
                                className="text-[10px] font-bold text-stone-600 hover:text-arza-700 flex items-center gap-1 transition-colors"
                              >
                                {copiedId === issue.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                Copiar detalle
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })
              )}
            </motion.div>
          )}

          {activeTab === 'duplicates' && (
            <motion.div
              key="duplicates"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="space-y-3"
            >
              {duplicates.length === 0 ? (
                <div className="text-center py-10 text-xs text-stone-400 flex flex-col items-center justify-center space-y-2">
                  <FileCheck2 className="w-8 h-8 text-arza-500" />
                  <span className="font-bold text-stone-700">Sin duplicados detectados</span>
                  <span>No se encontraron descripciones similares en el catálogo.</span>
                </div>
              ) : (
                duplicates.map((group, idx) => (
                  <div
                    key={idx}
                    className="bg-amber-50/20 border border-amber-200/50 rounded-xl p-3.5 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h5 className="text-[12px] font-bold text-stone-800">{group.canonicalDescription}</h5>
                        <p className="text-[11px] text-stone-600">
                          Código recomendado:{' '}
                          <span className="font-mono font-bold text-arza-600">{group.suggestedCode}</span>
                        </p>
                      </div>
                      <button
                        onClick={() => handleMergeDuplicates(group)}
                        className="shrink-0 text-[10px] font-bold bg-arza-600 hover:bg-arza-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                      >
                        <GitMerge className="w-3.5 h-3.5" />
                        Fusionar
                      </button>
                    </div>
                    <div className="space-y-1">
                      {group.items.map((item) => (
                        <div
                          key={item.code}
                          className="flex items-center justify-between text-[11px] bg-white border border-stone-200 px-2 py-1.5 rounded-lg"
                        >
                          <span className="font-mono text-stone-700">{item.code}</span>
                          <span className="text-stone-600 truncate max-w-[180px]">{item.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}

          {activeTab === 'codes' && (
            <motion.div
              key="codes"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="space-y-3"
            >
              {codeSuggestions.length === 0 ? (
                <div className="text-center py-10 text-xs text-stone-400 flex flex-col items-center justify-center space-y-2">
                  <Lightbulb className="w-8 h-8 text-arza-500" />
                  <span className="font-bold text-stone-700">Sin sugerencias de código</span>
                  <span>Todos los materiales parecen tener código oficial.</span>
                </div>
              ) : (
                codeSuggestions.map((s, idx) => (
                  <div
                    key={idx}
                    className="bg-stone-50 border border-stone-200 rounded-xl p-3.5 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <h5 className="text-[12px] font-bold text-stone-800">{s.materialDescription}</h5>
                        <div className="flex items-center gap-2 text-[11px] text-stone-600">
                          <span>
                            Código actual:{' '}
                            <span className="font-mono font-bold text-rose-600">{s.currentCode || 'Ninguno'}</span>
                          </span>
                          <span>→</span>
                          <span>
                            Sugerido:{' '}
                            <span className="font-mono font-bold text-arza-600">{s.suggestedCode}</span>
                          </span>
                        </div>
                        <p className="text-[10px] text-stone-500">{s.reason}</p>
                      </div>
                      <button
                        onClick={() => handleApplySuggestion(s)}
                        className="shrink-0 text-[10px] font-bold bg-arza-600 hover:bg-arza-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Registrar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer report preview */}
      <div className="bg-stone-50 p-4 border-t border-stone-200 space-y-2">
        <div className="flex items-center justify-between">
          <h5 className="text-[12px] font-bold text-stone-800 flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-arza-600" />
            Minuta para WhatsApp
          </h5>
          <span className="text-[10px] text-stone-500">Se copia sin modificar archivos fuente.</span>
        </div>
        <div className="text-[10px] font-mono text-stone-600 bg-white border border-stone-200 p-3 rounded-lg max-h-[90px] overflow-y-auto whitespace-pre-wrap select-all shadow-2xs">
          {compileReport()}
        </div>
      </div>
    </div>
  );
}
