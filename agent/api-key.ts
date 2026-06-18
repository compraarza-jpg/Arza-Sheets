/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function getServerApiKey(): string | undefined {
  return process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY;
}

export function hasValidServerKey(): boolean {
  const key = getServerApiKey();
  return Boolean(key && key !== 'MY_GEMINI_API_KEY' && key !== 'MY_GOOGLE_GENAI_API_KEY');
}
