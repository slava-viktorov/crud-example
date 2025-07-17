import { Exclude, Expose, Type, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { AuthorResponseDto } from './author-response.dto';

@Exclude()
export class ItemResponseDto {
  @Expose()
  @ApiProperty()
  id: string;

  @Expose()
  @ApiProperty()
  title: string;

  @Expose()
  @ApiProperty()
  content: string;

  @Expose()
  @Type(() => AuthorResponseDto)
  @ApiProperty({ type: AuthorResponseDto })
  author: AuthorResponseDto;

  @Expose()
  @ApiProperty()
  @Transform(({ value }) => {
    if (value instanceof Date) {
      return value.toISOString();
    }
    return value;
  })
  createdAt: Date;

  @Expose()
  @ApiProperty()
  @Transform(({ value }) => {
    if (value instanceof Date) {
      return value.toISOString();
    }
    return value;
  })
  updatedAt: Date;
}
