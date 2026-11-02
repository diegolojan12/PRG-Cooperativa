import { Test, TestingModule } from '@nestjs/testing';
import { CampaniasService } from './campanias.service';

describe('CampaniasService', () => {
  let service: CampaniasService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CampaniasService],
    }).compile();

    service = module.get<CampaniasService>(CampaniasService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
