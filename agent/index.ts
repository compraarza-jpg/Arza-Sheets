/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AgentEngine } from './engine';
import { DemoEngine } from './demo-engine';
import { AgentContext, AgentMessage, AgentResult } from './types';

export * from './types';
export * from './schema';

export interface RunAgentOptions {
  apiKey?: string;
  model?: string;
}

export function createAgent(options: RunAgentOptions) {
  const hasValidKey = Boolean(options.apiKey && options.apiKey !== 'MY_GEMINI_API_KEY');

  if (hasValidKey) {
    return new AgentEngine({ apiKey: options.apiKey!, model: options.model });
  }

  return new DemoEngine();
}

export async function runAgent(
  messages: AgentMessage[],
  context: AgentContext,
  options: RunAgentOptions
): Promise<AgentResult> {
  const agent = createAgent(options);
  return agent.run(messages, context);
}
