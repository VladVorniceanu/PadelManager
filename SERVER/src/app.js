import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import apiRouter from './routes/index.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  // Middleware-uri esențiale
  app.use(cors());
  app.use(express.json());
  app.use(morgan('dev'));

  // Prefix pentru API
  app.use('/api', apiRouter);

  // 404 + error handler
  app.use(notFound);
  app.use(errorHandler);

  return app;
}