import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { TokenService } from './token.service';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { User } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { REFRESH_TOKENS_REPOSITORY } from './refresh-tokens.repository.interface';

jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

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
const mockTokens = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
};
const mockUsersService = {
  findByEmail: jest.fn(),
  findByUsername: jest.fn(),
  create: jest.fn(),
  updateRefreshToken: jest.fn(),
  findById: jest.fn(),
  findByEmailOrUsername: jest.fn(),
};
const mockTokenService = {
  generateTokens: jest.fn(),
  hashRefreshToken: jest.fn(),
  verifyRefreshToken: jest.fn(),
  verifyRefreshTokenPayload: jest.fn(),
  decodeRefreshToken: jest.fn(),
  getRefreshTokenExpiresInMs: jest.fn(),
};
let refreshTokensRepository = {
  create: jest.fn(),
  findByToken: jest.fn(),
  findByJTI: jest.fn(),
  revokeToken: jest.fn(),
  deleteById: jest.fn(),
};

beforeAll(() => {
  process.env.JWT_SECRET = 'test_jwt_secret';
  process.env.JWT_REFRESH_SECRET = 'test_jwt_refresh_secret';
});

describe('AuthService', () => {
  let service: AuthService;
  let usersService: typeof mockUsersService;
  let tokenService: typeof mockTokenService;

  beforeEach(async () => {
    Object.values(mockUsersService).forEach(fn => fn.mockReset());
    Object.values(mockTokenService).forEach(fn => fn.mockReset());
    Object.values(refreshTokensRepository).forEach(fn => fn.mockReset && fn.mockReset());

    refreshTokensRepository = {
      create: jest.fn(),
      findByToken: jest.fn(),
      findByJTI: jest.fn(),
      revokeToken: jest.fn(),
      deleteById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: TokenService, useValue: mockTokenService },
        { provide: REFRESH_TOKENS_REPOSITORY, useValue: refreshTokensRepository },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<any>(UsersService);
    tokenService = module.get<any>(TokenService);

    mockTokenService.generateTokens.mockResolvedValue({ accessToken: 'access-token', refreshToken: 'refresh-token' });
    mockTokenService.verifyRefreshTokenPayload.mockReturnValue({ sub: 'user-1', email: 'test@test.com' });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user without password if credentials are valid', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(true as never);
      const result = await service.validateUser('test@test.com', 'password');

      expect(result).toEqual({
        id: 'user-1',
        email: 'test@test.com',
        username: 'testuser',
        items: [],
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
        passwordHash: 'hashedPassword',
        refreshTokens: [],
      });
    });

    it('should return null if user is not found', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(null);

      const result = await service.validateUser('test@test.com', 'password');

      expect(result).toBeNull();
    });

    it('should return null if password is invalid', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      const result = await service.validateUser(
        'test@test.com',
        'wrongpassword',
      );

      expect(result).toBeNull();
    });
  });

  describe('register', () => {
    it('should register a new user and create refresh token', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@test.com',
        username: 'testuser',
        password: 'password123',
      };

      jest.spyOn(usersService, 'findByEmailOrUsername').mockResolvedValue(null);
      mockedBcrypt.hash.mockResolvedValue('hashedPassword' as never);
      jest.spyOn(usersService, 'create').mockResolvedValue(mockUser);
      mockTokenService.hashRefreshToken.mockResolvedValue('hashed-refresh-token');
      mockTokenService.decodeRefreshToken.mockReturnValue({ sub: mockUser.id, email: mockUser.email, jti: 'test-jti' });

      refreshTokensRepository.create.mockResolvedValue({
        id: 'refresh-id',
        jti: 'test-jti',
        token: 'hashed-refresh-token',
        isRevoked: false,
        revokedAt: null,
        userId: mockUser.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: mockUser as any,
      });

      const result = await service.register(createUserDto);

      expect(usersService.findByEmailOrUsername).toHaveBeenCalledWith(
        createUserDto.email,
        createUserDto.username,
      );
      expect(usersService.create).toHaveBeenCalledWith({
        email: createUserDto.email,
        username: createUserDto.username,
        passwordHash: 'hashedPassword',
      });
      expect(mockTokenService.hashRefreshToken).toHaveBeenCalledWith(
        mockTokens.refreshToken,
      );
      expect(mockTokenService.decodeRefreshToken).toHaveBeenCalledWith(mockTokens.refreshToken);
      expect(refreshTokensRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          jti: 'test-jti',
          token: 'hashed-refresh-token',
          userId: mockUser.id,
          isRevoked: false,
        })
      );
      expect(result).toEqual({ user: mockUser, tokens: mockTokens });
    });

    it('should throw ConflictException if email already exists', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@test.com',
        username: 'testuser',
        password: 'password123',
      };

      const existingUser: User = {
        id: 'user-1',
        email: 'test@test.com',
        username: 'differentuser',
        passwordHash: 'hashedPassword',
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        refreshTokens: [],
      };

      jest.spyOn(usersService, 'findByEmailOrUsername').mockResolvedValue(existingUser);

      await expect(service.register(createUserDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException if username already exists', async () => {
      const createUserDto: CreateUserDto = {
        email: 'new@test.com',
        username: 'existinguser',
        password: 'password123',
      };

      const existingUser: User = {
        id: 'user-1',
        email: 'old@test.com',
        username: 'existinguser',
        passwordHash: 'hashedPassword',
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        refreshTokens: [],
      };

      jest.spyOn(usersService, 'findByEmailOrUsername').mockResolvedValue(existingUser);

      await expect(service.register(createUserDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('login', () => {
    it('should login and create refresh token', async () => {
      const loginDto: LoginDto = {
        email: 'test@test.com',
        password: 'password123',
      };

      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(true as never);
      mockTokenService.hashRefreshToken.mockResolvedValue('hashed-refresh-token');
      mockTokenService.decodeRefreshToken.mockReturnValue({ sub: mockUser.id, email: mockUser.email, jti: 'test-jti' });
      
      refreshTokensRepository.create.mockResolvedValue({
        id: 'refresh-id',
        jti: 'test-jti',
        token: 'hashed-refresh-token',
        isRevoked: false,
        revokedAt: null,
        userId: mockUser.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: mockUser as any,
      });

      const result = await service.login(loginDto);

      expect(usersService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(loginDto.password, mockUser.passwordHash);
      expect(mockTokenService.hashRefreshToken).toHaveBeenCalledWith(mockTokens.refreshToken);
      expect(mockTokenService.decodeRefreshToken).toHaveBeenCalledWith(mockTokens.refreshToken);
      expect(refreshTokensRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          jti: 'test-jti',
          token: 'hashed-refresh-token',
          userId: mockUser.id,
          isRevoked: false,
        })
      );
      expect(result).toEqual({ user: mockUser, tokens: mockTokens });
    });

    it('should throw UnauthorizedException if credentials are invalid', async () => {
      const loginDto: LoginDto = {
        email: 'test@test.com',
        password: 'wrongpassword',
      };

      jest.spyOn(service, 'validateUser').mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('should logout user and revoke refresh token', async () => {
      const refreshToken = 'refresh-token';
      const hashedToken = 'hashed-refresh-token';
      const jti = 'test-jti';
      
      mockTokenService.verifyRefreshTokenPayload.mockReturnValue({ sub: 'user-1', email: 'test@test.com', jti });
      refreshTokensRepository.findByJTI.mockResolvedValue({
        id: 'refresh-id',
        jti,
        token: hashedToken,
        isRevoked: false,
        revokedAt: null,
        userId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {} as any,
      });
      mockTokenService.verifyRefreshToken.mockResolvedValue(true);
      refreshTokensRepository.revokeToken.mockResolvedValue(true);

      await service.logout(refreshToken);

      expect(mockTokenService.verifyRefreshTokenPayload).toHaveBeenCalledWith(refreshToken);
      expect(refreshTokensRepository.findByJTI).toHaveBeenCalledWith(jti);
      expect(mockTokenService.verifyRefreshToken).toHaveBeenCalledWith(refreshToken, hashedToken);
      expect(refreshTokensRepository.revokeToken).toHaveBeenCalledWith(hashedToken);
    });

    it('should throw UnauthorizedException if token not found', async () => {
      const refreshToken = 'refresh-token';
      const jti = 'test-jti';
      
      mockTokenService.verifyRefreshTokenPayload.mockReturnValue({ sub: 'user-1', email: 'test@test.com', jti });
      refreshTokensRepository.findByJTI.mockResolvedValue(null);

      await expect(service.logout(refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if token is already revoked', async () => {
      const refreshToken = 'refresh-token';
      const hashedToken = 'hashed-refresh-token';
      const jti = 'test-jti';
      
      mockTokenService.verifyRefreshTokenPayload.mockReturnValue({ sub: 'user-1', email: 'test@test.com', jti });
      refreshTokensRepository.findByJTI.mockResolvedValue({
        id: 'refresh-id',
        jti,
        token: hashedToken,
        isRevoked: true,
        revokedAt: new Date(),
        userId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {} as any,
      });

      await expect(service.logout(refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if token hash does not match', async () => {
      const refreshToken = 'refresh-token';
      const hashedToken = 'hashed-refresh-token';
      const jti = 'test-jti';
      
      mockTokenService.verifyRefreshTokenPayload.mockReturnValue({ sub: 'user-1', email: 'test@test.com', jti });
      refreshTokensRepository.findByJTI.mockResolvedValue({
        id: 'refresh-id',
        jti,
        token: hashedToken,
        isRevoked: false,
        revokedAt: null,
        userId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {} as any,
      });
      mockTokenService.verifyRefreshToken.mockResolvedValue(false);

      await expect(service.logout(refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refreshTokensPair', () => {
    it('should refresh tokens successfully', async () => {
      const userId = 'user-1';
      const refreshToken = 'refresh-token';
      const hashedToken = 'hashed-refresh-token';
      const jti = 'test-jti';
      
      const newTokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      const user: User = {
        id: userId,
        email: 'test@test.com',
        username: 'testuser',
        passwordHash: 'hashedPassword',
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        refreshTokens: [],
      };
      
      mockTokenService.verifyRefreshTokenPayload.mockReturnValue({ sub: userId, email: user.email, jti });
      refreshTokensRepository.findByJTI.mockResolvedValue({
        id: 'refresh-id',
        jti,
        token: hashedToken,
        isRevoked: false,
        revokedAt: null,
        userId: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: user as any,
      });
      mockUsersService.findById.mockResolvedValue(user);
      refreshTokensRepository.revokeToken.mockResolvedValue(true);
      mockTokenService.generateTokens.mockResolvedValue(newTokens);
      mockTokenService.hashRefreshToken.mockResolvedValue('hashed-new-refresh-token');
      mockTokenService.decodeRefreshToken.mockReturnValue({ sub: userId, email: user.email, jti: 'new-jti' });
      refreshTokensRepository.create.mockResolvedValue({
        id: 'refresh-id2',
        jti: 'new-jti',
        token: 'hashed-new-refresh-token',
        isRevoked: false,
        revokedAt: null,
        userId: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: user as any,
      });

      const result = await service.refreshTokensPair(refreshToken);

      expect(mockTokenService.verifyRefreshTokenPayload).toHaveBeenCalledWith(refreshToken);
      expect(refreshTokensRepository.findByJTI).toHaveBeenCalledWith(jti);
      expect(refreshTokensRepository.revokeToken).toHaveBeenCalledWith(hashedToken);
      expect(mockTokenService.generateTokens).toHaveBeenCalledWith(user.id, user.email);
      expect(mockTokenService.hashRefreshToken).toHaveBeenCalledWith(newTokens.refreshToken);
      expect(mockTokenService.decodeRefreshToken).toHaveBeenCalledWith(newTokens.refreshToken);
      expect(refreshTokensRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          jti: 'new-jti',
          token: 'hashed-new-refresh-token',
          userId: userId,
          isRevoked: false,
        })
      );
      expect(result).toEqual(newTokens);
    });

    it('should throw UnauthorizedException if token not found', async () => {
      const refreshToken = 'refresh-token';
      const jti = 'test-jti';
      
      mockTokenService.verifyRefreshTokenPayload.mockReturnValue({ sub: 'user-1', email: 'test@test.com', jti });
      refreshTokensRepository.findByJTI.mockResolvedValue(null);

      await expect(service.refreshTokensPair(refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if token is revoked', async () => {
      const refreshToken = 'refresh-token';
      const hashedToken = 'hashed-refresh-token';
      const jti = 'test-jti';
      
      mockTokenService.verifyRefreshTokenPayload.mockReturnValue({ sub: 'user-1', email: 'test@test.com', jti });
      refreshTokensRepository.findByJTI.mockResolvedValue({
        id: 'refresh-id',
        jti,
        token: hashedToken,
        isRevoked: true,
        revokedAt: new Date(),
        userId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {} as any,
      });

      await expect(service.refreshTokensPair(refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if user not found', async () => {
      const refreshToken = 'refresh-token';
      const hashedToken = 'hashed-refresh-token';
      const jti = 'test-jti';
      
      mockTokenService.verifyRefreshTokenPayload.mockReturnValue({ sub: 'user-1', email: 'test@test.com', jti });
      refreshTokensRepository.findByJTI.mockResolvedValue({
        id: 'refresh-id',
        jti,
        token: hashedToken,
        isRevoked: false,
        revokedAt: null,
        userId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {} as any,
      });
      mockUsersService.findById.mockResolvedValue(null);

      await expect(service.refreshTokensPair(refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
