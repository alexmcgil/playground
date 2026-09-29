const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../dist/server/app.js');

test('HTTP: save/read, validation, request tracing and response ordering', async () => {
  const app = await createApp();
  await app.listen(0, '127.0.0.1');
  const base = await app.getUrl();
  const call = (path, options) => fetch(`${base}/api${path}`, options);
  const json = (body) => ({
    method: 'PUT', headers: { 'content-type': 'application/json', 'x-request-id': 'test-save' },
    body: JSON.stringify(body),
  });
  try {
    const saved = await call('/cards/a', json({ text: 'Новый текст' }));
    assert.equal(saved.status, 200);
    assert.equal(saved.headers.get('x-request-id'), 'test-save');
    assert.equal(saved.headers.get('cache-control'), 'no-store');
    assert.equal((await (await call('/cards/a')).json()).text, 'Новый текст');
    assert.equal((await (await call('/cards/b')).json()).text, 'Привет из карточки Б');
    for (const body of [{}, { text: 42 }, { text: '  ' }, { text: 'a'.repeat(2001) }]) {
      assert.equal((await call('/cards/a', json(body))).status, 400);
    }
    assert.equal((await call('/cards/missing')).status, 404);
    assert.equal((await call('/cards/a?slow=999')).status, 400);
    assert.equal((await call('/generate?mode=unknown', { ...json({ prompt: 'test' }), method: 'POST' })).status, 400);
    assert.equal((await call('/generate', { ...json({ prompt: '' }), method: 'POST' })).status, 400);
    const order = [];
    await Promise.all(['a', 'b'].map(async (id) => {
      const response = await call(`/cards/${id}?slow=1`);
      assert.equal(response.status, 200);
      order.push((await response.json()).id);
    }));
    assert.deepEqual(order, ['b', 'a']);
  } finally {
    await app.close();
  }
});
