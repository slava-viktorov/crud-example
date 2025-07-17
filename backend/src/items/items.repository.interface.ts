import { Item } from './entities/item.entity';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';

export const ITEMS_REPOSITORY = 'ITEMS_REPOSITORY';

export interface IItemsRepository {
  create(createItemDto: CreateItemDto, authorId: string): Promise<Item>;

  findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<Item>>;

  findById(id: string): Promise<Item | null>;

  update(id: string, updateItemDto: UpdateItemDto): Promise<Item | null>;

  remove(id: string): Promise<boolean>;

  findAllByAuthorId(
    authorId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<Item>>;
}
