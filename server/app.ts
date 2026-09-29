import 'reflect-metadata';
import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { CardsService } from './cards.service';
import { LabController } from './lab.controller';

@Module({ controllers: [LabController], providers: [CardsService] })
class AppModule {}

export async function createApp() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.use((req: Request, res: Response, next: NextFunction) => {
    const inputId = req.header('x-request-id');
    const requestId = inputId && /^[\w-]{1,64}$/.test(inputId) ? inputId : randomUUID();
    const started = performance.now();
    res.setHeader('x-request-id', requestId);
    res.setHeader('cache-control', 'no-store');
    console.log(`[${requestId}] → ${req.method} ${req.path}`);
    res.on('finish', () => console.log(
      `[${requestId}] ← ${res.statusCode} ${Math.round(performance.now() - started)}ms`,
    ));
    next();
  });
  app.enableShutdownHooks();
  return app;
}
