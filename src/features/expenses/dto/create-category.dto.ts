import { IsString, MaxLength } from 'class-validator';

export class CreateExpenseCategoryDto {
  @IsString()
  @MaxLength(100)
  name: string;
}
