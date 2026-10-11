import 'dotenv/config'
import { z } from 'zod'

// All settings come from environment variables. Secrets never live in the code.
const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL wajib diisi.'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET minimal 32 karakter.'),
  PORT: z.coerce.number().int().positive().default(3001),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  LOG_LEVEL: z.string().default('info'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  // Time a material stays in "Memproses" before its summary is ready. Tests use a short delay.
  MATERI_PROCESSING_MS: z.coerce.number().int().nonnegative().default(1200),
  // AI. "mock" answers without calling any model. "live" calls OpenRouter with the key and the model chains below.
  AI_MODE: z.enum(['live', 'mock']).default('mock'),
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_BASE_URL: z.string().url().default('https://openrouter.ai/api/v1'),
  // Comma-separated model slugs in priority order. Set them in .env (see .env.example), not in code.
  AI_CHAIN_CHAT: z.string().default(''),
  AI_CHAIN_KUIS: z.string().default(''),
  AI_CHAIN_RINGAN: z.string().default(''),
  AI_TIMEOUT_MS: z.coerce.number().int().positive().default(45000),
  AI_MAX_TOKENS_CHAT: z.coerce.number().int().positive().default(1200),
  AI_MAX_TOKENS_KUIS: z.coerce.number().int().positive().default(3000),
  // Reasoning effort sent with every live call. "low" was tested and gave identical quiz options, so medium is the default.
  AI_REASONING_EFFORT: z.enum(['low', 'medium', 'high']).default('medium'),
  // Pause between pieces of a mock answer. Tests use zero.
  AI_MOCK_DELAY_MS: z.coerce.number().int().nonnegative().default(20),
  // Chat messages allowed per minute, per IP and per account or guest (docs/role.md CC-10).
  CHAT_RATE_PER_MINUTE: z.coerce.number().int().positive().default(10),
})

export type Config = z.infer<typeof envSchema>

export function loadConfig(source: NodeJS.ProcessEnv = process.env): Config {
  const parsed = envSchema.safeParse(source)
  if (!parsed.success) {
    const problems = parsed.error.issues.map((issue) => issue.message).join(' ')
    throw new Error(`Konfigurasi tidak valid. ${problems}`)
  }
  const config = parsed.data
  if (config.AI_MODE === 'live') {
    const missing: string[] = []
    if (!config.OPENROUTER_API_KEY) missing.push('OPENROUTER_API_KEY')
    if (parseChain(config.AI_CHAIN_CHAT).length === 0) missing.push('AI_CHAIN_CHAT')
    if (parseChain(config.AI_CHAIN_KUIS).length === 0) missing.push('AI_CHAIN_KUIS')
    if (parseChain(config.AI_CHAIN_RINGAN).length === 0) missing.push('AI_CHAIN_RINGAN')
    if (missing.length > 0) {
      throw new Error(`AI_MODE=live memerlukan: ${missing.join(', ')}.`)
    }
  }
  return config
}

// Splits "a/b, c" style lists. Empty items are dropped, so a blank setting means an empty chain.
export function parseChain(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
}
