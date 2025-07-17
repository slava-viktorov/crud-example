import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Item } from '../entities/item.entity';
import { IItemsRepository } from '../items.repository.interface';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { CreateItemDto } from '../dto/create-item.dto';
import { UpdateItemDto } from '../dto/update-item.dto';
import { User } from 'src/users/entities/user.entity';

type UpdateResult = Item | null;

@Injectable()
export class TypeOrmItemsRepository implements IItemsRepository {
  constructor(
    @InjectRepository(Item)
    private readonly itemsRepository: Repository<Item>,
  ) {}

  async create(createItemDto: CreateItemDto, authorId: string): Promise<Item> {
    const item = this.itemsRepository.create({
      ...createItemDto,
      author: { id: authorId } as Pick<User, 'id'>,
    });
    
    const savedItem = await this.itemsRepository.save(item);
    
    const result = await this.itemsRepository.findOne({
      where: { id: savedItem.id },
      relations: ['author'],
    });
    
    return result!;
  }

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<Item>> {
    const items = await this.findItemsWithPagination(paginationDto);
    return items;
  }

  async findById(id: string): Promise<Item | null> {
    const item = await this.itemsRepository.findOne({
      where: { id },
      relations: ['author'],
    });
    return item ?? null;
  }

  async update(id: string, updateItemDto: UpdateItemDto): Promise<UpdateResult> {
    const result = await this.itemsRepository.update(id, updateItemDto);
    if (result.affected === 0) {
      return null;
    }

    const updatedItem = await this.findById(id);
    
    return updatedItem;
  }

  async remove(id: string): Promise<boolean> {
    const result = await this.itemsRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async findAllByAuthorId(
    authorId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<Item>> {
    const items = await this.findItemsWithPagination(pagination, { authorId });
    return items;
  }

  private async findItemsWithPagination(
    pagination: PaginationDto,
    filters?: { authorId?: string },
  ): Promise<PaginatedResponseDto<Item>> {
    const { page = 1, limit = 10, skip } = pagination;
    
    const offset = skip !== undefined ? skip : (page - 1) * limit;

    const queryBuilder = this.itemsRepository
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.author', 'author')
      .orderBy('item.createdAt', 'DESC')
      .skip(offset)
      .take(limit);

    if (filters?.authorId) {
      queryBuilder.where('author.id = :authorId', { authorId: filters.authorId });
    }

    const [result, total] = await queryBuilder.getManyAndCount();

    return {
      data: result,
      count: total,
    };
  }
}
