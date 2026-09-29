import { createRoot } from 'react-dom/client';
import { CardsPage } from './cards-page';
import { RuntimePage } from './runtime-page';
import './style.css';

const runtime = window.location.pathname === '/runtime';

createRoot(document.getElementById('root')!).render(
  <>
    <header className="site-header">
      <a className="brand" href="/cards">playground<span> / learn by debugging</span></a>
      <nav aria-label="Кейсы">
        <a href="/cards" aria-current={!runtime ? 'page' : undefined}>01 · Путь запроса</a>
        <a href="/runtime" aria-current={runtime ? 'page' : undefined}>02 · Почему всё зависло</a>
      </nav>
    </header>
    <main>{runtime ? <RuntimePage /> : <CardsPage />}</main>
    <footer>Локальный полигон · React + NestJS · Начните с рабочего режима, затем включите эксперимент.</footer>
  </>,
);
