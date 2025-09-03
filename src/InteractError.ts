export default class InteractApiError extends Error {
  constructor(public status: number, public statusText: string, message?: string) {
    super(message || `API Error: ${status} ${statusText}`)
    this.name = "InteractApiError"
  }
}
