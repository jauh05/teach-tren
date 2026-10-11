import { parseChain } from '../config/env.js'
import { config } from '../config/index.js'
import { AiService } from './service.js'

// The single AI service of the process, configured from environment variables.
export const ai = new AiService({
  mode: config.AI_MODE,
  apiKey: config.OPENROUTER_API_KEY ?? '',
  baseUrl: config.OPENROUTER_BASE_URL,
  chains: {
    chat: parseChain(config.AI_CHAIN_CHAT),
    kuis: parseChain(config.AI_CHAIN_KUIS),
    ringan: parseChain(config.AI_CHAIN_RINGAN),
  },
  timeoutMs: config.AI_TIMEOUT_MS,
  maxTokens: { chat: config.AI_MAX_TOKENS_CHAT, kuis: config.AI_MAX_TOKENS_KUIS },
  fetchImpl: fetch,
})
