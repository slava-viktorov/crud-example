import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateItemDto {
  @ApiProperty({ example: 'My First Item', description: 'Item title' })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  title: string;

  @ApiProperty({
    example: 'This is the content of my first item.',
    description: 'Item content',
  })
  @IsString()
  @IsNotEmpty()
  content: string;
}
