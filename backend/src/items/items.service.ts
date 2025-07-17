import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { User } from '../users/entities/user.entity';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { Item } from './entities/item.entity';
import { ItemResponseDto } from './dto/item-response.dto';
import {
  IItemsRepository,
  ITEMS_REPOSITORY,
} from './items.repository.interface';

@Injectable()
export class ItemsService {
  constructor(
    @Inject(ITEMS_REPOSITORY)
    private readonly itemsRepository: IItemsRepository,
  ) {}

  async create(createItemDto: CreateItemDto, user: User): Promise<ItemResponseDto> {
    const item = await this.itemsRepository.create(createItemDto, user.id);
    return item as ItemResponseDto;
  }

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<Item>> {
    const items = await this.itemsRepository.findAll(paginationDto);
    return items;
  }

  async findById(id: string): Promise<Item> {
    const item = await this.itemsRepository.findById(id);
    if (!item) {
      throw new NotFoundException(`Item with ID "${id}" not found`);
    }
    return item;
  }

  async update(id: string, updateItemDto: UpdateItemDto): Promise<Item> {
    const updatedItem = await this.itemsRepository.update(id, updateItemDto);
    if (!updatedItem) {
      throw new NotFoundException(
        `Item with ID "${id}" not found after update`,
      );
    }
    return updatedItem;
  }

  async remove(id: string): Promise<void> {
    const wasDeleted = await this.itemsRepository.remove(id);

    if (!wasDeleted) {
      throw new NotFoundException(`Item with ID "${id}" not found`);
    }
  }

  async findAllByAuthorId(
    authorId: string,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<Item>> {
    const items = await this.itemsRepository.findAllByAuthorId(authorId, paginationDto);
    return items;
  }
}
