import bcrypt from 'bcryptjs'
import { config } from '../config/index.js'

// Tests use a low cost so the suite stays fast. Production uses the recommended cost.
const ROUNDS = config.NODE_ENV === 'test' ? 4 : 12

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, ROUNDS)
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}
