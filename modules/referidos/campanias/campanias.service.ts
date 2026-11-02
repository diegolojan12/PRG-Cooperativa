import { Injectable } from '@nestjs/common';
import { CreateCampaniaDto } from './dto/create-campania.dto';
import { UpdateCampaniaDto } from './dto/update-campania.dto';

@Injectable()
export class CampaniasService {
  create(createCampaniaDto: CreateCampaniaDto) {
    return 'This action adds a new campania';
  }

  findAll() {
    return `This action returns all campanias`;
  }

  findOne(id: number) {
    return `This action returns a #${id} campania`;
  }

  update(id: number, updateCampaniaDto: UpdateCampaniaDto) {
    return `This action updates a #${id} campania`;
  }

  remove(id: number) {
    return `This action removes a #${id} campania`;
  }
}
