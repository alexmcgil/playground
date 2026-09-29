export async function request(path: string, init: RequestInit = {}) {
  const requestId = crypto.randomUUID();
  const started = performance.now();
  const headers = new Headers(init.headers);
  headers.set('x-request-id', requestId);
  if (init.body) headers.set('content-type', 'application/json');
  console.log(`[${requestId}] → ${init.method ?? 'GET'} ${path}`);
  const response = await fetch(path, { ...init, headers });
  const body: unknown = await response.json().catch(() => undefined);
  console.log(`[${requestId}] ← ${response.status} ${Math.round(performance.now() - started)}ms`, body);
  if (!response.ok) {
    const message = typeof body === 'object' && body !== null && 'message' in body
      ? String(body.message) : response.statusText;
    throw new Error(`HTTP ${response.status}: ${message || 'Ошибка запроса'} · ${requestId}`);
  }
  return body;
}

export type Card = { id: string; title: string; text: string };

export function parseCard(value: unknown): Card {
  if (typeof value !== 'object' || value === null || !('id' in value) ||
    !('title' in value) || !('text' in value) || typeof value.id !== 'string' ||
    typeof value.title !== 'string' || typeof value.text !== 'string') {
    throw new Error('Сервер вернул некорректную карточку');
  }
  return { id: value.id, title: value.title, text: value.text };
}

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Неизвестная ошибка';
}
