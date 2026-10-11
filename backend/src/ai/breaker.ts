// Circuit breaker per model (docs/role.md section 7.3). Three failures in a row cool a model down for ten minutes.

export const FAILURES_BEFORE_COOLDOWN = 3
export const COOLDOWN_MS = 10 * 60 * 1000

interface ModelState {
  failures: number
  coolingUntil: number
}

export class CircuitBreaker {
  private readonly states = new Map<string, ModelState>()
  private readonly now: () => number

  constructor(now: () => number = Date.now) {
    this.now = now
  }

  isCooling(model: string): boolean {
    const state = this.states.get(model)
    return state !== undefined && state.coolingUntil > this.now()
  }

  recordFailure(model: string): void {
    const state = this.states.get(model) ?? { failures: 0, coolingUntil: 0 }
    state.failures += 1
    if (state.failures >= FAILURES_BEFORE_COOLDOWN) {
      state.coolingUntil = this.now() + COOLDOWN_MS
      state.failures = 0
    }
    this.states.set(model, state)
  }

  recordSuccess(model: string): void {
    this.states.delete(model)
  }
}
