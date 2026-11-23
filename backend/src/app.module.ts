import { Module } from '@nestjs/common';
import { createObserveModule } from '@nestjs/observe';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

/**
 * Módulo raíz de Nest. Por ahora solo activa la observabilidad (si hay claves);
 * las rutas de la API viven en src/api.mjs y se montan en main.ts.
 */
@Module({
  imports:
    process.env.OBSERVE_APP_KEY && process.env.OBSERVE_APP_SECRET
      ? [
          ObserveModule.forRoot({
            appKey: process.env.OBSERVE_APP_KEY,
            appSecret: process.env.OBSERVE_APP_SECRET,
            serviceId: 'backend',
          }),
        ]
      : [],
})
export class AppModule {}
