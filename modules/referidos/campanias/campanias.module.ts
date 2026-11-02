import { Module } from '@nestjs/common';
import { CampaniasService } from './campanias.service';
import { CampaniasController } from './campanias.controller';

@Module({
  controllers: [CampaniasController],
  providers: [CampaniasService],
})
export class CampaniasModule {}
