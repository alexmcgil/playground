import { useEffect, useRef, useState } from 'react';
import { errorMessage, parseCard, request, type Card } from './api';

export function CardsPage() {
  const [mode, setMode] = useState('normal');
  const [selected, setSelected] = useState('a');
  const [card, setCard] = useState<Card>();
  const [text, setText] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const modeVersion = useRef(0);
  const prefix = mode === 'dns' ? '/dns-api' : mode === 'route' ? '/wrong-api' : '/api';

  useEffect(() => {
    const current = modeVersion.current;
    let active = true;
    setLoading(true);
    setCard(undefined);
    setText('');
    setError('');
    setStatus('Загружаем карточку…');
    // LAB: experiment 1 intentionally accepts an outdated response.
    const canApply = () => (active || mode === 'race') && current === modeVersion.current;
    request(`${prefix}/cards/${selected}?slow=1`)
      .then(parseCard)
      .then((result) => {
        if (!canApply()) return;
        setCard(result);
        setText(result.text);
        setStatus('Карточка загружена');
      })
      .catch((err: unknown) => {
        if (!canApply()) return;
        setStatus('Не удалось загрузить карточку');
        setError(errorMessage(err));
      })
      .finally(() => { if (canApply()) setLoading(false); });
    return () => { active = false; };
  }, [selected, mode, prefix]);

  async function save() {
    if (!card) return;
    setSaving(true);
    setError('');
    try {
      const result = parseCard(await request(`${prefix}/cards/${selected}`, {
        method: 'PUT', body: JSON.stringify({ text }),
      }));
      setCard(result);
      setText(result.text);
      setStatus('Сохранено на сервере. Можно обновить страницу.');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return <>
    <p className="eyebrow">Кейс 01 / браузер → сервер → браузер</p>
    <h1>Куда ушёл запрос?</h1>
    <p className="lead">Откройте карточку, измените текст и сохраните. Проследите, как одно действие проходит через всё приложение.</p>
    <div className="flow" aria-label="Путь запроса">
      <span>React · fetch</span><b>⇄</b><span>HTTP · сеть</span><b>⇄</b><span>Vite proxy</span><b>⇄</b><span>NestJS</span><b>⇄</b><span>Память сервера</span>
    </div>
    <div className="columns">
      <section className="panel">
        <div className="panel-heading"><h2>Мои карточки</h2><span className="badge">живой API</span></div>
        <label htmlFor="cards-mode">Режим</label>
        <select id="cards-mode" value={mode} disabled={saving} onChange={(event) => {
          modeVersion.current += 1;
          setMode(event.target.value);
        }}>
          <option value="normal">Рабочий сценарий</option>
          <option value="race">Эксперимент 1 · не та карточка</option>
          <option value="dns">Эксперимент 2 · запрос не дошёл</option>
          <option value="route">Эксперимент 3 · ответ с ошибкой</option>
        </select>
        <div className="card-picker" aria-label="Выбор карточки">
          {['a', 'b'].map((id) => <button key={id} type="button" aria-pressed={selected === id}
            disabled={saving} onClick={() => setSelected(id)}>Карточка {id === 'a' ? 'А' : 'Б'}</button>)}
        </div>
        <form onSubmit={(event) => { event.preventDefault(); void save(); }}>
          <label htmlFor="card-text">Текст карточки</label>
          <textarea id="card-text" value={text} required maxLength={2000} rows={6}
            disabled={loading || saving || !card} onChange={(event) => setText(event.target.value)} />
          <div className="actions"><button className="primary" disabled={loading || saving || !card || !text.trim()}>
            {saving ? 'Сохраняем…' : 'Сохранить'}</button><span className="muted">{text.length} / 2000</span></div>
        </form>
        <p role="status" className="status">{status}</p>
        {error && <p role="alert" className="error">{error}</p>}
        <p className="note">Данные переживают обновление страницы. Перезапуск API возвращает исходные карточки.</p>
      </section>
      <aside className="panel exercise">
        <p className="eyebrow">Попробуйте сами</p><h2>От симптома к причине</h2>
        <ol>
          <li>В рабочем режиме сохраните текст в карточке А и обновите страницу.</li>
          <li>Откройте DevTools → Network. Найдите запрос сохранения: адрес, метод, тело, ответ.</li>
          <li>В эксперименте 1 быстро переключите Б → А → Б. Подождите две секунды. Повторите в рабочем режиме.</li>
          <li>Сравните эксперименты 2 и 3. Есть ли запрос в логах Nest? Дошёл ли он до контроллера?</li>
        </ol>
        <details><summary>Инструменты для расследования</summary><p>Network → Timing и заголовок x-request-id. Этот же ID есть в Console и терминале API. Breakpoint: request → getCard / saveCard → CardsService → setText.</p>
          <p>DNS происходит до HTTP. Здесь браузер обращается к локальному Vite, а имя API при необходимости разрешает сам прокси. Подробная схема — в README.</p></details>
      </aside>
    </div>
  </>;
}
