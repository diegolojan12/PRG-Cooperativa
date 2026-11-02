import { Module } from '@nestjs/common';
import { CampaniasModule } from './campanias/campanias.module';

@Module({
  imports: [CampaniasModule]
})
export class ReferidosModule {}
