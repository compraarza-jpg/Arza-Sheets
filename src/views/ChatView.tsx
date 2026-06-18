/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Send, Mic, Sparkles, CheckCircle2, Check, MessageSquare, RotateCcw } from 'lucide-react';
import { motion } from 'motion/react';
import type { Message } from '../types';

interface ChatViewProps {
  messages: Message[];
  inputMessage: string;
  setInputMessage: (value: string) => void;
  isGenerating: boolean;
  isMicRecording: boolean;
  onSubmitMessage: (e?: React.FormEvent, customText?: string) => void;
  onToggleMic: () => void;
  onApplyPreset: (text: string) => void;
  onExecuteAction: (action: any) => void;
  onClearChat: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

const presets = [
  { label: 'Buscar códigos sin asignar', text: '¿Qué materiales no tienen códigos de Margarita asignados?' },
  { label: 'Crear OC de monomandos', text: 'Crea una orden de compra para 20 Monomandos en Solum T40' },
  { label: 'Discrepancia de recibo', text: 'Registra que llegaron 100 codos en lugar de 120 de la orden 001' },
];

export default function ChatView({
  messages,
  inputMessage,
  setInputMessage,
  isGenerating,
  isMicRecording,
  onSubmitMessage,
  onToggleMic,
  onApplyPreset,
  onExecuteAction,
  onClearChat,
  messagesEndRef,
}: ChatViewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full min-h-[480px] bg-surface border border-border rounded-xl shadow-2xs flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 py-3 border-b border-border bg-stone-50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-arza-900 rounded-lg flex items-center justify-center text-white">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-800 flex items-center gap-2">
              Agente Arza
              <span className="flex items-center gap-1 text-[10px] font-bold text-arza-800 bg-arza-100 px-2 py-0.5 rounded-full uppercase">
                <span className="w-1.5 h-1.5 bg-arza-600 rounded-full animate-pulse" />
                En línea
              </span>
            </h3>
            <p className="text-[10px] text-stone-500">Rossy puede escribir, dictar o aprobar acciones sugeridas</p>
          </div>
        </div>
        <button
          onClick={onClearChat}
          className="text-[11px] font-semibold text-stone-500 hover:text-stone-800 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reiniciar
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-bg">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center text-stone-500 space-y-2">
            <MessageSquare className="w-10 h-10 text-stone-300" />
            <p className="text-sm font-bold text-stone-700">Empieza una conversación</p>
            <p className="text-xs max-w-xs">Pregunta por discrepancias, crea órdenes o pide un reporte para Margarita.</p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 bg-arza-900 rounded-lg flex items-center justify-center text-white text-xs shrink-0 self-start shadow-2xs">
                <Sparkles className="w-4 h-4" />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-2xl p-3.5 text-sm leading-relaxed shadow-2xs ${
                msg.role === 'user'
                  ? 'bg-white border border-border text-stone-800 font-medium'
                  : 'bg-arza-50 border border-arza-100 text-stone-800'
              }`}
            >
              <div className="whitespace-pre-line text-stone-700 font-medium">{msg.content}</div>

              {msg.action && (
                <div className="mt-3 pt-3 border-t border-arza-100/50">
                  <div className="bg-white p-2.5 rounded-xl border border-arza-200 text-[11px] mb-2 shadow-2xs">
                    <p className="font-bold text-arza-900 mb-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Modificación sugerida
                    </p>
                    {msg.action.type === 'add_order' && (
                      <span className="text-stone-600 font-mono">
                        Crear orden en <strong>{msg.action.payload.project}</strong> por {msg.action.payload.quantity}{' '}
                        {msg.action.payload.unit} de <strong>{msg.action.payload.description}</strong>.
                      </span>
                    )}
                    {msg.action.type === 'sync_codes' && (
                      <span className="text-stone-600 font-mono">Sincronizar códigos huérfanos con el catálogo.</span>
                    )}
                    {msg.action.type === 'update_received' && (
                      <span className="text-stone-600 font-mono">
                        Ingresar recibo en bodega para {msg.action.payload.orderId}. Cantidad recibida:{' '}
                        {msg.action.payload.quantity} unidades.
                      </span>
                    )}
                  </div>

                  {msg.action.executed ? (
                    <span className="inline-flex items-center text-arza-800 font-bold text-[10px] bg-arza-100 px-2.5 py-1 rounded-full shadow-2xs border border-arza-200">
                      <Check className="w-3 h-3 mr-1 text-arza-700" />
                      Aplicado
                    </span>
                  ) : (
                    <button
                      onClick={() => onExecuteAction(msg.action)}
                      className="w-full bg-arza-900 hover:bg-arza-800 text-white font-bold px-3 py-1.5 rounded-lg text-[10.5px] transition-colors cursor-pointer"
                    >
                      Aplicar cambio
                    </button>
                  )}
                </div>
              )}

              <span
                className={`block opacity-60 text-[10px] mt-1.5 font-mono ${
                  msg.role === 'user' ? 'text-right text-stone-500' : 'text-stone-500'
                }`}
              >
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}

        {isGenerating && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 bg-arza-900 text-white rounded-lg flex items-center justify-center text-xs shrink-0 self-start animate-pulse shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="max-w-[85%] rounded-2xl p-3 bg-white border border-border text-stone-500 text-xs shadow-2xs flex items-center gap-2">
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-arza-700 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-arza-700 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-arza-700 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
              <span>Mapeando catálogo y escribiendo…</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick presets */}
      <div className="px-5 py-3 bg-stone-50 border-t border-border shrink-0">
        <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wide mb-2">Atajos rápidos</p>
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <button
              key={preset.label}
              onClick={() => onApplyPreset(preset.text)}
              className="text-[11px] bg-white hover:bg-stone-100 text-stone-600 hover:text-arza-900 border border-border font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <form
        onSubmit={onSubmitMessage}
        className="p-4 bg-stone-50 border-t border-border shrink-0 flex items-center gap-2"
      >
        <button
          type="button"
          onClick={onToggleMic}
          className={`p-3 rounded-xl border transition-all flex items-center justify-center shrink-0 cursor-pointer ${
            isMicRecording
              ? 'bg-rose-600 border-rose-500 text-white animate-pulse shadow-sm'
              : 'bg-white hover:bg-stone-100 border-border text-stone-600 hover:text-stone-800 shadow-2xs'
          }`}
          title="Dictar por voz"
        >
          <Mic className="w-4 h-4" />
        </button>

        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Escríbele o háblale a tu agente de Sheets…"
          className="flex-1 bg-white border border-border text-stone-800 placeholder-stone-400 text-sm px-4 py-3 rounded-xl focus:outline-none focus:border-arza-700 shadow-2xs"
        />

        <button
          type="submit"
          disabled={!inputMessage.trim() || isGenerating}
          className={`p-3 bg-arza-900 hover:bg-arza-800 text-white rounded-xl flex items-center justify-center shrink-0 transition-all font-semibold cursor-pointer ${
            !inputMessage.trim() || isGenerating ? 'opacity-40 cursor-not-allowed' : 'shadow-sm'
          }`}
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </motion.div>
  );
}
