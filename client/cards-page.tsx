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
    <p className="eyebrow">01 / Карточки</p>
    <h1>Карточки</h1>
    <p className="lead">Редактирование и сохранение текстовых карточек.</p>
    <section className="panel">
      <div className="panel-heading"><h2>Мои карточки</h2><span className="badge">живой API</span></div>
      <label htmlFor="cards-mode">Режим</label>
      <select id="cards-mode" value={mode} disabled={saving} onChange={(event) => {
        modeVersion.current += 1;
        setMode(event.target.value);
      }}>
        <option value="normal">Обычный режим</option>
        <option value="race">Эксперимент 1</option>
        <option value="dns">Эксперимент 2</option>
        <option value="route">Эксперимент 3</option>
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
  </>;
}
