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
})

export type Config = z.infer<typeof envSchema>

export function loadConfig(source: NodeJS.ProcessEnv = process.env): Config {
  const parsed = envSchema.safeParse(source)
  if (!parsed.success) {
    const problems = parsed.error.issues.map((issue) => issue.message).join(' ')
    throw new Error(`Konfigurasi tidak valid. ${problems}`)
  }
  return parsed.data
}
