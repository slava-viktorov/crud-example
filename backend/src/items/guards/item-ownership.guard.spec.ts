import { Test, TestingModule } from '@nestjs/testing';
import { ItemOwnershipGuard } from './item-ownership.guard';
import { ItemsService } from '../items.service';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { User } from '../../users/entities/user.entity';
import { Item } from '../entities/item.entity';

describe('ItemOwnershipGuard', () => {
  let guard: ItemOwnershipGuard;
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
  const otherUser = {
    id: 'other-user-id',
    email: 'other@test.com',
    username: 'otheruser',
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
  const mockItemOtherUser = {
    id: 'item-2',
    title: 'Test Item 2',
    content: 'Test Content 2',
    author: otherUser,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const mockItemsService = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    Object.values(mockItemsService).forEach(fn => fn.mockReset());
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ItemOwnershipGuard,
        {
          provide: ItemsService,
          useValue: mockItemsService,
        },
      ],
    }).compile();
    guard = module.get<ItemOwnershipGuard>(ItemOwnershipGuard);
    itemsService = module.get<any>(ItemsService);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    const createMockContext = (
      userId: string,
      itemId: string,
    ): ExecutionContext => {
      return {
        switchToHttp: () => ({
          getRequest: () => ({
            user: { id: userId },
            params: { id: itemId },
          }),
        }),
      } as ExecutionContext;
    };

    it('should allow access if user owns the item', async () => {
      const context = createMockContext(mockUser.id, mockItem.id);

      jest.spyOn(itemsService, 'findById').mockResolvedValue(mockItem);

      const result = await guard.canActivate(context);

      expect(itemsService.findById).toHaveBeenCalledWith(mockItem.id);
      expect(result).toBe(true);
    });

    it('should deny access if user does not own the item', async () => {
      const context = createMockContext(mockUser.id, mockItem.id);

      jest.spyOn(itemsService, 'findById').mockResolvedValue(mockItemOtherUser);

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should handle non-existent item', async () => {
      const context = createMockContext(mockUser.id, 'nonexistent-id');

      jest
        .spyOn(itemsService, 'findById')
        .mockRejectedValue(new Error('Item not found'));

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
