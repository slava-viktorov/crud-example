import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import {
  IUsersRepository,
  USERS_REPOSITORY,
} from './users.repository.interface';

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: IUsersRepository;

  const mockUser: User = {
    id: 'user-1',
    email: 'test@test.com',
    username: 'testuser',
    passwordHash: 'hashedPassword',
    items: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    refreshTokens: [],
  };
  const userData = {
    email: 'test@test.com',
    username: 'testuser',
    passwordHash: 'hashedPassword',
  };

  const mockUsersRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    findByEmail: jest.fn(),
    findByEmailOrUsername: jest.fn(),
  };

  beforeEach(async () => {
    // Сброс моков
    Object.values(mockUsersRepository).forEach(fn => fn.mockReset());
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: USERS_REPOSITORY,
          useValue: mockUsersRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    usersRepository = module.get<IUsersRepository>(USERS_REPOSITORY);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      jest.spyOn(usersRepository, 'create').mockResolvedValue(mockUser);

      const result = await service.create(userData);

      expect(usersRepository.create).toHaveBeenCalledWith(userData);
      expect(result).toEqual(mockUser);
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      jest.spyOn(usersRepository, 'findByEmail').mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@test.com');

      expect(usersRepository.findByEmail).toHaveBeenCalledWith('test@test.com');
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      jest.spyOn(usersRepository, 'findByEmail').mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@test.com');

      expect(usersRepository.findByEmail).toHaveBeenCalledWith('nonexistent@test.com');
      expect(result).toBeNull();
    });
  });

  describe('findByEmailOrUsername', () => {
    it('should find user by email or username', async () => {
      jest.spyOn(usersRepository, 'findByEmailOrUsername').mockResolvedValue(mockUser);

      const result = await service.findByEmailOrUsername('test@test.com', 'testuser');

      expect(usersRepository.findByEmailOrUsername).toHaveBeenCalledWith('test@test.com', 'testuser');
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      jest.spyOn(usersRepository, 'findByEmailOrUsername').mockResolvedValue(null);

      const result = await service.findByEmailOrUsername('nonexistent@test.com', 'nonexistentuser');

      expect(usersRepository.findByEmailOrUsername).toHaveBeenCalledWith(
        'nonexistent@test.com',
        'nonexistentuser',
      );
      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should find user by id', async () => {
      jest.spyOn(usersRepository, 'findById').mockResolvedValue(mockUser);

      const result = await service.findById('user-1');

      expect(usersRepository.findById).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      jest.spyOn(usersRepository, 'findById').mockResolvedValue(null);

      const result = await service.findById('nonexistent-id');

      expect(usersRepository.findById).toHaveBeenCalledWith('nonexistent-id');
      expect(result).toBeNull();
    });
  });

  describe('updateRefreshToken', () => {
  });
});
