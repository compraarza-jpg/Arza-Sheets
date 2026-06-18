/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, GenerateContentConfig } from '@google/genai';
import { buildSystemPrompt } from './prompts';
import { AgentContext, AgentMessage, AgentResult, AgentResponse } from './types';
import { AgentResponseSchema } from './schema';

const MODEL = 'gemini-2.5-pro';
const MAX_RETRIES = 2;

export interface AgentEngineOptions {
  apiKey: string;
  model?: string;
}

export class AgentEngine {
  private ai: GoogleGenAI;
  private model: string;

  constructor(options: AgentEngineOptions) {
    this.ai = new GoogleGenAI({ apiKey: options.apiKey });
    this.model = options.model || MODEL;
  }

  async run(messages: AgentMessage[], context: AgentContext): Promise<AgentResult> {
    const start = Date.now();

    try {
      const systemPrompt = buildSystemPrompt(context);
      const contents = messages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' as const : 'user' as const,
        parts: [{ text: msg.content }],
      }));

      const config: GenerateContentConfig = {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
      };

      let lastError: Error | undefined;
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          const response = await this.ai.models.generateContent({
            model: this.model,
            contents,
            config,
          });

          const parsed = this.parseResponse(response.text);
          if (parsed) {
            return {
              response: parsed,
              metadata: {
                model: this.model,
                durationMs: Date.now() - start,
              },
            };
          }
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));
          console.warn(`AgentEngine attempt ${attempt + 1} failed:`, lastError.message);
        }
      }

      throw lastError || new Error('Could not generate valid response after retries');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('AgentEngine fatal error:', err);
      return {
        response: {
          content: `Rossy, tuve un problema al procesar esa solicitud con la IA (${errorMessage}). ¿Me la puedes repetir con más detalle?`,
          action: null,
        },
        metadata: {
          model: this.model,
          durationMs: Date.now() - start,
          error: errorMessage,
        },
      };
    }
  }

  private parseResponse(text: string | undefined): AgentResponse | null {
    if (!text) return null;

    const cleaned = text.trim();
    if (!cleaned) return null;

    try {
      const parsed = JSON.parse(cleaned);
      const result = AgentResponseSchema.safeParse(parsed);
      if (!result.success) {
        console.warn('AgentEngine validation failed:', result.error);
        return null;
      }
      return result.data as AgentResponse;
    } catch (err) {
      console.warn('AgentEngine parse/validation failed:', err);
      return null;
    }
  }
}
