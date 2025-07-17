import { Test, TestingModule } from '@nestjs/testing';
import { ItemsController } from './items.controller';
import { ItemsService } from './items.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { Item } from './entities/item.entity';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';

describe('ItemsController', () => {
  let controller: ItemsController;
  let itemsService: typeof mockItemsService;

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
  const mockItemsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    Object.values(mockItemsService).forEach(fn => fn.mockReset());
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ItemsController],
      providers: [
        {
          provide: ItemsService,
          useValue: mockItemsService,
        },
      ],
    }).compile();
    controller = module.get<ItemsController>(ItemsController);
    itemsService = module.get<any>(ItemsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a item', async () => {
      const createItemDto: CreateItemDto = {
        title: 'Test Item',
        content: 'Test Content',
      };

      mockItemsService.create.mockResolvedValue(mockItem);

      const result = await controller.create(createItemDto, mockUser);

      expect(mockItemsService.create).toHaveBeenCalledWith(createItemDto, mockUser);
      expect(result).toEqual(mockItem);
    });
  });

  describe('findAll', () => {
    it('should return all items with pagination', async () => {
      const paginationDto: PaginationDto = { page: 1, limit: 10 };
      const mockResponse: PaginatedResponseDto<Item> = { data: [mockItem], count: 1 };

      mockItemsService.findAll.mockResolvedValue(mockResponse);

      const result = await controller.findAll(paginationDto);

      expect(mockItemsService.findAll).toHaveBeenCalledWith(paginationDto);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('findById', () => {
    it('should return a item by id', async () => {
      mockItemsService.findById.mockResolvedValue(mockItem);

      const result = await controller.findById('item-1');

      expect(mockItemsService.findById).toHaveBeenCalledWith('item-1');
      expect(result).toEqual(mockItem);
    });
  });

  describe('update', () => {
    it('should update a item', async () => {
      const updateItemDto: UpdateItemDto = {
        title: 'Updated Title',
      };

      mockItemsService.update.mockResolvedValue(mockItem);

      const result = await controller.update('item-1', updateItemDto);

      expect(mockItemsService.update).toHaveBeenCalledWith('item-1', updateItemDto);
      expect(result).toEqual(mockItem);
    });
  });

  describe('remove', () => {
    it('should remove a item', async () => {
      mockItemsService.remove.mockResolvedValue(undefined);

      await controller.remove('item-1');

      expect(mockItemsService.remove).toHaveBeenCalledWith('item-1');
    });
  });
});
