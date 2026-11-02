import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CampaniasService } from './campanias.service';
import { CreateCampaniaDto } from './dto/create-campania.dto';
import { UpdateCampaniaDto } from './dto/update-campania.dto';

@Controller('campanias')
export class CampaniasController {
  constructor(private readonly campaniasService: CampaniasService) {}

  @Post()
  create(@Body() createCampaniaDto: CreateCampaniaDto) {
    return this.campaniasService.create(createCampaniaDto);
  }

  @Get()
  findAll() {
    return this.campaniasService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.campaniasService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCampaniaDto: UpdateCampaniaDto) {
    return this.campaniasService.update(+id, updateCampaniaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.campaniasService.remove(+id);
  }
}
