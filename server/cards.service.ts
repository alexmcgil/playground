import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class CardsService {
  // ponytail: per-process storage resets on restart; use a DB when persistence is the lesson.
  private readonly cards = new Map([
    ['a', { id: 'a', title: 'Карточка А', text: 'Привет из карточки А' }],
    ['b', { id: 'b', title: 'Карточка Б', text: 'Привет из карточки Б' }],
  ]);

  get(id: string) {
    const card = this.cards.get(id);
    if (!card) throw new NotFoundException('Карточка не найдена');
    return { ...card };
  }

  save(id: string, text: string) {
    const card = { ...this.get(id), text };
    this.cards.set(id, card);
    return { ...card };
  }
}
