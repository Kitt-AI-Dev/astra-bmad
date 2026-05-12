export function shouldDeactivateTelegramSubscriber(status: number): boolean {
  return status === 400 || status === 403
}
