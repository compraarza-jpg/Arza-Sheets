/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, GenerateContentConfig } from '@google/genai';
import {
  analyzePriceMismatches,
  analyzeOrphanCodes,
  analyzeWarehouseDiscrepancies,
  detectDuplicates,
} from './audit';
import { buildAuditPrompt, buildCodeSuggestionPrompt } from './prompts';
import { AuditReportSchema, CodeSuggestionSchema } from './schema';
import type {
  Material,
  PurchaseOrder,
  WarehouseEntry,
  AuditIssue,
  AuditContext,
  DuplicateGroup,
} from '../src/types';

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-pro';
const MAX_RETRIES = 2;

function hasValidKey(): boolean {
  return Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');
}

export async function runAudit(context: AuditContext) {
  const localIssues: AuditIssue[] = [
    ...analyzePriceMismatches(context.materials, context.orders),
    ...analyzeOrphanCodes(context.materials, context.orders),
    ...analyzeWarehouseDiscrepancies(context.orders, context.warehouse),
  ];

  const localDuplicates = detectDuplicates(context.materials);

  if (!hasValidKey()) {
    return {
      issues: localIssues,
      duplicates: localDuplicates,
      fallback: true,
    };
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  const contents = [{ role: 'user' as const, parts: [{ text: buildAuditPrompt(context) }] }];
  const config: GenerateContentConfig = {
    responseMimeType: 'application/json',
  };

  let lastError: Error | undefined;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: MODEL,
        contents,
        config,
      });
      const parsed = JSON.parse(response.text || '{}');
      const result = AuditReportSchema.safeParse(parsed);
      if (result.success) {
        return { issues: result.data.issues, duplicates: localDuplicates, fallback: false };
      }
      console.warn('Audit report validation failed:', result.error);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`Audit attempt ${attempt + 1} failed:`, lastError.message);
    }
  }

  return { issues: localIssues, duplicates: localDuplicates, fallback: true };
}

export async function suggestCodes(materials: Material[]) {
  if (!hasValidKey()) {
    return { suggestions: [], fallback: true };
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  const contents = [{ role: 'user' as const, parts: [{ text: buildCodeSuggestionPrompt(materials) }] }];
  const config: GenerateContentConfig = {
    responseMimeType: 'application/json',
  };

  let lastError: Error | undefined;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: MODEL,
        contents,
        config,
      });
      const parsed = JSON.parse(response.text || '{}');
      const result = CodeSuggestionSchema.safeParse(parsed);
      if (result.success) {
        return { suggestions: result.data.suggestions, fallback: false };
      }
      console.warn('Code suggestion validation failed:', result.error);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`Code suggestion attempt ${attempt + 1} failed:`, lastError.message);
    }
  }

  return { suggestions: [], fallback: true };
}

export { detectDuplicates };
export type { DuplicateGroup };
