import { BadRequestException, Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { setTimeout as delay } from 'node:timers/promises';
import { CardsService } from './cards.service';

function readText(body: unknown, field: string): string {
  if (typeof body !== 'object' || body === null || !(field in body)) {
    throw new BadRequestException(`Нужно поле ${field}`);
  }
  const value = Reflect.get(body, field);
  if (typeof value !== 'string' || !value.trim() || value.length > 2000) {
    throw new BadRequestException(`${field}: от 1 до 2000 символов, не только пробелы`);
  }
  return value;
}

@Controller()
export class LabController {
  constructor(private readonly cards: CardsService) {}

  @Get('health')
  health() {
    return { ok: true, pid: process.pid, time: new Date().toISOString() };
  }

  @Get('cards/:id')
  async getCard(@Param('id') id: string, @Query('slow') slow?: string) {
    if (slow !== undefined && slow !== '1') throw new BadRequestException('slow: только 1');
    const card = this.cards.get(id);
    if (slow === '1') await delay(id === 'a' ? 1400 : 150);
    return card;
  }

  @Put('cards/:id')
  saveCard(@Param('id') id: string, @Body() body: unknown) {
    return this.cards.save(id, readText(body, 'text'));
  }

  @Post('generate')
  async generate(@Body() body: unknown, @Query('mode') mode = 'normal') {
    if (mode !== 'normal' && mode !== 'server') throw new BadRequestException('Неизвестный режим');
    const prompt = readText(body, 'prompt');
    const started = performance.now();
    if (mode === 'server') {
      while (performance.now() - started < 2500) Math.sqrt(Math.random());
    } else {
      await delay(2500);
    }
    return {
      text: `Идея для «${prompt.trim()}»: начните с маленького работающего примера и проверьте его в действии.`,
      serverMs: Math.round(performance.now() - started),
    };
  }
}
