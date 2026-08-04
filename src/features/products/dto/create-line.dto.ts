import { IsString, MaxLength } from 'class-validator';

export class CreateLineDto {
  @IsString()
  @MaxLength(100)
  name!: string;
}
