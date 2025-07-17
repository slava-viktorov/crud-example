import { Test, TestingModule } from '@nestjs/testing';
import { ItemsService } from './items.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { Item } from './entities/item.entity';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';

import { NotFoundException } from '@nestjs/common';

describe('ItemsService', () => {
  let service: ItemsService;
  let itemsRepository: typeof mockItemsRepository;

  const mockUser = {
    id: 'user-1',
    email: 'test@test.com',
    username: 'testuser',
    passwordHash: 'hashedPassword',
    items: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    refreshTokens: [],
  };
  const mockItem = {
    id: 'item-1',
    title: 'Test Item',
    content: 'Test Content',
    author: mockUser,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const mockItemsRepository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findAllByAuthorId: jest.fn(),
  };

  beforeEach(async () => {
    Object.values(mockItemsRepository).forEach(fn => fn.mockReset());
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ItemsService,
        {
          provide: 'ITEMS_REPOSITORY',
          useValue: mockItemsRepository,
        },
      ],
    }).compile();
    service = module.get<ItemsService>(ItemsService);
    itemsRepository = module.get<any>('ITEMS_REPOSITORY');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new item', async () => {
      const createItemDto: CreateItemDto = {
        title: 'Test Item',
        content: 'Test Content',
      };

      jest.spyOn(itemsRepository, 'create').mockResolvedValue(mockItem);

      const result = await service.create(createItemDto, mockUser);

      expect(itemsRepository.create).toHaveBeenCalledWith(
        createItemDto,
        mockUser.id,
      );
      expect(result).toEqual(mockItem);
    });
  });

  describe('findAll', () => {
    it('should return all items with pagination using page', async () => {
      const paginationDto: PaginationDto = { page: 1, limit: 10 };
      const mockResponse: PaginatedResponseDto<Item> = { data: [mockItem], count: 1 };

      jest.spyOn(itemsRepository, 'findAll').mockResolvedValue(mockResponse);

      const result = await service.findAll(paginationDto);

      expect(itemsRepository.findAll).toHaveBeenCalledWith(paginationDto);
      expect(result).toEqual(mockResponse);
    });

    it('should return all items with pagination using skip', async () => {
      const paginationDto: PaginationDto = { skip: 20, limit: 10 };
      const mockResponse: PaginatedResponseDto<Item> = { data: [mockItem], count: 1 };

      jest.spyOn(itemsRepository, 'findAll').mockResolvedValue(mockResponse);

      const result = await service.findAll(paginationDto);

      expect(itemsRepository.findAll).toHaveBeenCalledWith(paginationDto);
      expect(result).toEqual(mockResponse);
    });

    it('should prioritize skip over page when both are provided', async () => {
      const paginationDto: PaginationDto = { page: 3, skip: 20, limit: 10 };
      const mockResponse: PaginatedResponseDto<Item> = { data: [mockItem], count: 1 };

      jest.spyOn(itemsRepository, 'findAll').mockResolvedValue(mockResponse);

      const result = await service.findAll(paginationDto);

      expect(itemsRepository.findAll).toHaveBeenCalledWith(paginationDto);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('findById', () => {
    it('should return an item by id', async () => {
      jest.spyOn(itemsRepository, 'findById').mockResolvedValue(mockItem);

      const result = await service.findById('item-1');

      expect(itemsRepository.findById).toHaveBeenCalledWith('item-1');
      expect(result).toEqual(mockItem);
    });

    it('should throw NotFoundException if item not found', async () => {
      jest.spyOn(itemsRepository, 'findById').mockResolvedValue(null);

      await expect(service.findById('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update an item', async () => {
      const updateItemDto: UpdateItemDto = {
        title: 'Updated Title',
      };

      jest.spyOn(itemsRepository, 'update').mockResolvedValue(mockItem);

      const result = await service.update('item-1', updateItemDto);

      expect(itemsRepository.update).toHaveBeenCalledWith('item-1', updateItemDto);
      expect(result).toEqual(mockItem);
    });

    it('should throw NotFoundException if item not found after update', async () => {
      const updateItemDto: UpdateItemDto = {
        title: 'Updated Title',
      };

      jest.spyOn(itemsRepository, 'update').mockResolvedValue(null);

      await expect(service.update('nonexistent-id', updateItemDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should remove an item', async () => {
      jest.spyOn(itemsRepository, 'remove').mockResolvedValue(true);

      await service.remove('item-1');

      expect(itemsRepository.remove).toHaveBeenCalledWith('item-1');
    });

    it('should throw NotFoundException if item not found', async () => {
      jest.spyOn(itemsRepository, 'remove').mockResolvedValue(false);

      await expect(service.remove('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAllByAuthorId', () => {
    it('should return all items by author with pagination using page', async () => {
      const authorId = 'user-1';
      const paginationDto: PaginationDto = { page: 1, limit: 10 };
      const mockResponse: PaginatedResponseDto<Item> = { data: [mockItem], count: 1 };

      jest.spyOn(itemsRepository, 'findAllByAuthorId').mockResolvedValue(mockResponse);

      const result = await service.findAllByAuthorId(authorId, paginationDto);

      expect(itemsRepository.findAllByAuthorId).toHaveBeenCalledWith(authorId, paginationDto);
      expect(result).toEqual(mockResponse);
    });

    it('should return all items by author with pagination using skip', async () => {
      const authorId = 'user-1';
      const paginationDto: PaginationDto = { skip: 20, limit: 10 };
      const mockResponse: PaginatedResponseDto<Item> = { data: [mockItem], count: 1 };

      jest.spyOn(itemsRepository, 'findAllByAuthorId').mockResolvedValue(mockResponse);

      const result = await service.findAllByAuthorId(authorId, paginationDto);

      expect(itemsRepository.findAllByAuthorId).toHaveBeenCalledWith(authorId, paginationDto);
      expect(result).toEqual(mockResponse);
    });

    it('should prioritize skip over page when both are provided for author items', async () => {
      const authorId = 'user-1';
      const paginationDto: PaginationDto = { page: 3, skip: 20, limit: 10 };
      const mockResponse: PaginatedResponseDto<Item> = { data: [mockItem], count: 1 };

      jest.spyOn(itemsRepository, 'findAllByAuthorId').mockResolvedValue(mockResponse);

      const result = await service.findAllByAuthorId(authorId, paginationDto);

      expect(itemsRepository.findAllByAuthorId).toHaveBeenCalledWith(authorId, paginationDto);
      expect(result).toEqual(mockResponse);
    });
  });
});
