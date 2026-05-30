/**
 * Shim remplaçant @tauri-apps/api/core invoke().
 * Envoie les commandes au backend Node.js via POST /api/invoke.
 * L'interface est identique à celle de Tauri : invoke(command, params) → Promise<T>
 * Les erreurs sont retournées comme des strings (identique au comportement Tauri).
 */
export async function invoke<T>(
  command: string,
  params?: Record<string, unknown>
): Promise<T> {
  const res = await fetch('/api/invoke', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command, params }),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw errText
  }

  const text = await res.text()
  if (!text) return undefined as unknown as T
  return JSON.parse(text) as T
}
