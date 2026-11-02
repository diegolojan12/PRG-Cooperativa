import { Test, TestingModule } from '@nestjs/testing';
import { CampaniasController } from './campanias.controller';
import { CampaniasService } from './campanias.service';

describe('CampaniasController', () => {
  let controller: CampaniasController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CampaniasController],
      providers: [CampaniasService],
    }).compile();

    controller = module.get<CampaniasController>(CampaniasController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
