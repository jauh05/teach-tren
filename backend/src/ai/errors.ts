// Raised when every model in the chain failed. The message is shown to users as it is.
export class AiUnavailableError extends Error {
  constructor() {
    super('Layanan belajar sedang sibuk. Coba lagi beberapa saat.')
    this.name = 'AiUnavailableError'
  }
}
