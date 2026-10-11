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
  // AI. "mock" answers without calling any model. "live" calls OpenRouter with the key and the model chains below.
  AI_MODE: z.enum(['live', 'mock']).default('mock'),
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_BASE_URL: z.string().url().default('https://openrouter.ai/api/v1'),
  // Comma-separated model slugs in priority order. Set them in .env (see .env.example), not in code.
  AI_CHAIN_CHAT: z.string().default(''),
  AI_CHAIN_KUIS: z.string().default(''),
  AI_CHAIN_RINGAN: z.string().default(''),
  AI_TIMEOUT_MS: z.coerce.number().int().positive().default(45000),
  // Quiz batches get more time. Reasoning models often need more than 45 seconds for five questions.
  AI_TIMEOUT_KUIS_MS: z.coerce.number().int().positive().default(120000),
  AI_MAX_TOKENS_CHAT: z.coerce.number().int().positive().default(1200),
  AI_MAX_TOKENS_KUIS: z.coerce.number().int().positive().default(3000),
  // Reasoning effort per kind of task. Low saves tokens for chat. Quizzes need medium: low gave identical quiz options.
  AI_EFFORT_CHAT: z.enum(['low', 'medium', 'high']).default('low'),
  AI_EFFORT_KUIS: z.enum(['low', 'medium', 'high']).default('medium'),
  AI_EFFORT_RINGAN: z.enum(['low', 'medium', 'high']).default('low'),
  // Pause between pieces of a mock answer. Tests use zero.
  AI_MOCK_DELAY_MS: z.coerce.number().int().nonnegative().default(20),
  // Chat messages allowed per minute, per IP and per account or guest (docs/role.md CC-10).
  CHAT_RATE_PER_MINUTE: z.coerce.number().int().positive().default(10),
  // Quizzes a guest (per guest id and per IP address) may start per hour (docs/role.md CC-10).
  QUIZ_RATE_PER_HOUR: z.coerce.number().int().positive().default(3),
  // Guest sessions one IP address may start per hour.
  GUEST_SESSION_RATE_PER_HOUR: z.coerce.number().int().positive().default(30),
  // Pattern suggestions (AI) per account per hour.
  POLA_SARAN_PER_HOUR: z.coerce.number().int().positive().default(20),
  // Material parts (AI) per account per hour.
  MATERI_BULAT_PER_HOUR: z.coerce.number().int().positive().default(30),
  // Sign-in attempts per 15 minutes for one email from one IP address, and for one IP address in total.
  // The per-email limit stops password guessing. The per-IP limit is higher, so a school network is not blocked.
  AUTH_ATTEMPTS_PER_15_MIN: z.coerce.number().int().positive().default(10),
  AUTH_IP_PER_15_MIN: z.coerce.number().int().positive().default(100),
  // Accounts one IP address may register per hour.
  REGISTER_PER_HOUR: z.coerce.number().int().positive().default(30),
  // Number of proxies in front of the server. Set it behind a reverse proxy, so the real client IP address is used.
  TRUST_PROXY: z.coerce.number().int().nonnegative().default(0),
  // Seconds an answer may take before the server gives up (docs/role.md CC-10).
  REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(60000),
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
