import { useEffect, useState } from 'react';
import { errorMessage, request } from './api';

export function RuntimePage() {
  const [mode, setMode] = useState('normal');
  const [prompt, setPrompt] = useState('Занятие по отладке');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [ticks, setTicks] = useState(0);
  const [clicks, setClicks] = useState(0);
  const [health, setHealth] = useState('Проверяем…');
  const [peakHealth, setPeakHealth] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => setTicks((value) => value + 1), 100);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    let active = true;
    let timer: number;
    const controller = new AbortController();
    async function ping() {
      const started = performance.now();
      try {
        await request('/api/health', { signal: controller.signal });
        if (active) {
          const elapsed = Math.round(performance.now() - started);
          setHealth(`${elapsed} мс`);
          setPeakHealth((peak) => Math.max(peak, elapsed));
        }
      } catch (err) {
        if (active) setHealth(errorMessage(err));
      }
      if (active) timer = window.setTimeout(ping, 500);
    }
    void ping();
    return () => { active = false; clearTimeout(timer); controller.abort(); };
  }, []);

  async function generate() {
    setBusy(true);
    setError('');
    setResult('');
    setPeakHealth(0);
    const started = performance.now();
    try {
      const data = await request(`/api/generate?mode=${mode === 'server' ? 'server' : 'normal'}`, {
        method: 'POST', body: JSON.stringify({ prompt }),
      });
      if (typeof data !== 'object' || data === null || !('text' in data) || typeof data.text !== 'string') {
        throw new Error('Сервер вернул некорректный результат');
      }
      if (mode === 'browser') {
        const processingStarted = performance.now();
        while (performance.now() - processingStarted < 2500) Math.sqrt(Math.random());
      }
      setResult(`${data.text}\n\nПолное время: ${Math.round(performance.now() - started)} мс`);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return <>
    <p className="eyebrow">02 / Генерация</p>
    <h1>Генератор идей</h1>
    <p className="lead">Генерация текста по вашему запросу.</p>
    <div className="metrics">
      <div><span>Таймер браузера · шаги по 100 мс</span><strong data-testid="ticks">{ticks}</strong></div>
      <div><span>Последний ответ /health</span><strong data-testid="health">{health}</strong><small>Максимум: {peakHealth} мс · сброс при генерации</small></div>
      <div><span>Проверка отзывчивости</span><button onClick={() => setClicks((value) => value + 1)}>Кликов: {clicks}</button></div>
    </div>
    <section className="panel">
      <div className="panel-heading"><h2>Генератор идей</h2><span className="badge">локальная заглушка</span></div>
      <form onSubmit={(event) => { event.preventDefault(); void generate(); }}>
        <label htmlFor="runtime-mode">Режим</label>
        <select id="runtime-mode" value={mode} disabled={busy} onChange={(event) => setMode(event.target.value)}>
          <option value="normal">Обычный режим</option>
          <option value="server">Эксперимент 1</option>
          <option value="browser">Эксперимент 2</option>
        </select>
        <label htmlFor="prompt">О чём придумать идею?</label>
        <textarea id="prompt" rows={3} maxLength={2000} required value={prompt} disabled={busy}
          onChange={(event) => setPrompt(event.target.value)} />
        <button className="primary" disabled={busy || !prompt.trim()}>{busy ? 'Генерируем…' : 'Сгенерировать'}</button>
      </form>
      <div className="result" role="status">{result || (busy ? 'Ждём результат…' : 'Здесь появится результат генерации.')}</div>
      {error && <p role="alert" className="error">{error}</p>}
    </section>
  </>;
}
