/** Auth failure raised by the API guards; `status` is the HTTP status to answer with (401/403). */
export class ApiAuthError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiAuthError'
    this.status = status
  }
}
