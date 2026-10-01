export function createClientId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`
}
