import { PartialType } from '@nestjs/mapped-types';
import { CreateCampaniaDto } from './create-campania.dto';

export class UpdateCampaniaDto extends PartialType(CreateCampaniaDto) {}
