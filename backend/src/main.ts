import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AppModule } from './app.module.js';
import { createApi } from './api.mjs';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  if (process.env.TRUST_PROXY === '1') app.set('trust proxy', 1);
  app.use(helmet());
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:4200',
    credentials: true,
  });
  const { router, db } = await createApi();
  app.use('/api', router);
  app.enableShutdownHooks();
  for (const event of ['SIGINT', 'SIGTERM'])
    process.once(event, () => {
      void db.close();
    });
  // La validación de entrada la hace cada ruta de api.mjs (campos, formatos y código incrustado).

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
