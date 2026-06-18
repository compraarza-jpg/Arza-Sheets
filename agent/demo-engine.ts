/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AgentContext, AgentMessage, AgentResult, AgentResponse } from './types';

const KNOWN_PROJECTS = ['Solum T18', 'Solum T40', 'Maple', 'Ignis', 'Terra', 'Aquatec'];

export class DemoEngine {
  async run(messages: AgentMessage[], context: AgentContext): Promise<AgentResult> {
    const start = Date.now();
    const lastUserMsg = messages.filter(m => m.role === 'user').pop()?.content || '';
    const normalized = lastUserMsg.toLowerCase();

    const response = this.generateResponse(normalized, context);

    return {
      response,
      metadata: {
        model: 'demo-local',
        durationMs: Date.now() - start,
        fallback: true,
      },
    };
  }

  private generateResponse(query: string, context: AgentContext): AgentResponse {
    // 1. Detect "crear orden"
    if (this.matches(query, ['orden', 'compra', 'pedir', 'necesito', 'solicitar'])) {
      return this.handleCreateOrder(query, context);
    }

    // 2. Detect "código erróneo / sincronizar / homologar"
    if (this.matches(query, ['código', 'codigo', 'sincro', 'homologar', 'margarita', 'erróneo', 'duplicado', 'no tiene código'])) {
      return this.handleSyncCodes(query, context);
    }

    // 3. Detect "bodega / recibido / llegó / faltante"
    if (this.matches(query, ['bodega', 'recib', 'lleg', 'faltante', 'kari', 'joli', 'entrada'])) {
      return this.handleWarehouse(query, context);
    }

    // 4. Detect "gasto / reporte / dashboard"
    if (this.matches(query, ['gasto', 'reporte', 'dashboard', 'cuánto', 'cuanto', 'proveedor'])) {
      return this.handleReport(query, context);
    }

    // Default
    return {
      content: `¡Hola Rossy! 👋 Estoy operando en **modo demo** (sin API key de Gemini configurada).\n\nPuedo ayudarte a simular:\n• Crear órdenes de compra\n• Detectar códigos huérfanos\n• Registrar entradas de bodega\n• Ver reportes de gasto\n\nPara respuestas completamente inteligentes, pídele a tu administrador que configure la variable de entorno \\"GEMINI_API_KEY\\".`,
      action: null,
    };
  }

  private matches(query: string, keywords: string[]): boolean {
    return keywords.some(k => query.includes(k));
  }

  private handleCreateOrder(query: string, context: AgentContext): AgentResponse {
    // Find a project
    const project = KNOWN_PROJECTS.find(p => query.includes(p.toLowerCase())) || 'Solum T18';

    // Find a material by description match
    const material = context.materials.find(m =>
      query.includes(m.description.toLowerCase().split(' ').slice(0, 2).join(' ')) ||
      query.includes(m.code)
    ) || context.materials[0];

    if (!material) {
      return {
        content: `Rossy, para crear la orden necesito que me digas qué material necesitas. Puedes escribir algo como: *"20 codos de 2 pulgadas para Solum T18"*.`,
        action: null,
      };
    }

    // Extract quantity
    const qtyMatch = query.match(/(\d+)\s*(?:pz|piezas|pzas|unidades|sacos|kg|ton|tram)?/i);
    const quantity = qtyMatch ? parseInt(qtyMatch[1], 10) : 10;

    return {
      content: `Modo Demo: preparé una orden para **${project}** usando el código **${material.code}** del catálogo.\n\n📦 ${material.description}\n🔢 ${quantity} ${material.unit}\n💰 $${material.price.toFixed(2)} p/u`,
      action: {
        type: 'add_order',
        payload: {
          project,
          code: material.code,
          description: material.description,
          unit: material.unit,
          quantity,
          price: material.price,
          supplier: material.description.toLowerCase().includes('pvc')
            ? 'PVC y Plomería de Occidente'
            : 'Comercializadora Ruba',
        },
      },
    };
  }

  private handleSyncCodes(query: string, context: AgentContext): AgentResponse {
    const orphanOrders = context.orders.filter(o => !context.materials.some(m => m.code === o.code));

    if (orphanOrders.length === 0) {
      return {
        content: `¡Buenas noticias, Rossy! ✅ Todas las órdenes actuales tienen códigos válidos en el catálogo maestro. No detecté claves huérfanas ni discrepancias.`,
        action: null,
      };
    }

    const mappings = orphanOrders
      .map(o => {
        const suggestion = context.materials.find(m =>
          m.description.toLowerCase().includes(o.description.toLowerCase().slice(0, 8)) ||
          o.description.toLowerCase().includes(m.description.toLowerCase().slice(0, 8))
        );
        return suggestion
          ? { name: o.description, suggestedCode: suggestion.code, price: suggestion.price }
          : null;
      })
      .filter(Boolean) as { name: string; suggestedCode: string; price: number }[];

    if (mappings.length === 0) {
      return {
        content: `Detecté ${orphanOrders.length} orden(es) con códigos no homologados, pero no encontré coincidencias claras en el catálogo. ¿Quieres que los revise uno por uno?`,
        action: null,
      };
    }

    return {
      content: `Modo Demo: detecté **${mappings.length}** insumo(s) sin código homologado. Aquí están las sugerencias del catálogo maestro para corregir antes de que Margarita facture.`,
      action: {
        type: 'sync_codes',
        payload: { mappings },
      },
    };
  }

  private handleWarehouse(query: string, context: AgentContext): AgentResponse {
    // Try to find an order mentioned
    const orderIdMatch = query.match(/(?:oc[- ]?|orden[- ]?)([\w-]+)/i);
    const orderId = orderIdMatch ? orderIdMatch[1].toUpperCase().replace(/^/, 'OC-') : null;

    const targetOrder = orderId
      ? context.orders.find(o => o.id.toLowerCase() === orderId.toLowerCase())
      : context.orders.find(o => o.status === 'pendiente' || o.status === 'parcial');

    if (!targetOrder) {
      return {
        content: `Rossy, no encontré una orden activa para registrar la entrada de bodega. ¿Me das el número de OC o me dices de qué material se trata?`,
        action: null,
      };
    }

    const qtyMatch = query.match(/(\d+)\s*(?:pz|piezas|pzas|unidades|sacos|kg|ton|tram)?/i);
    const received = qtyMatch ? parseInt(qtyMatch[1], 10) : targetOrder.quantity;
    const status = received >= targetOrder.quantity ? 'completado' : 'parcial';

    return {
      content: `Modo Demo: registré la entrada de bodega para **${targetOrder.id}**.\n\nEsperado: ${targetOrder.quantity} ${targetOrder.unit}\nRecibido: ${received} ${targetOrder.unit}\nEstado: ${status === 'completado' ? '✅ Completo' : '⚠️ Parcial'}`,
      action: {
        type: 'update_received',
        payload: {
          orderId: targetOrder.id,
          quantity: received,
          status,
          observation: `Registro de recepción en modo demo para ${targetOrder.description}.`,
        },
      },
    };
  }

  private handleReport(query: string, context: AgentContext): AgentResponse {
    const total = context.orders.reduce((sum, o) => sum + o.total, 0);
    const byProject: Record<string, number> = {};
    context.orders.forEach(o => {
      byProject[o.project] = (byProject[o.project] || 0) + o.total;
    });

    const lines = Object.entries(byProject)
      .sort((a, b) => b[1] - a[1])
      .map(([project, amount]) => `• ${project}: $${amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`)
      .join('\n');

    return {
      content: `Modo Demo: aquí está el gasto acumulado por obra:\n\n${lines}\n\n**Total general: $${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN**`,
      action: null,
    };
  }
}
