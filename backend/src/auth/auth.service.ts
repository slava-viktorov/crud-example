import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { TokenService } from './token.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { User } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { REFRESH_TOKENS_REPOSITORY, IRefreshTokensRepository } from './refresh-tokens.repository.interface';

export interface JWTTokensPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult {
  user: User;
  tokens: JWTTokensPair;
}

const BCRYPT_SALT_ROUNDS = 10;

const nauthorizedExceptionMessage = 'Refresh token is invalid or revoked';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly tokenService: TokenService,
    @Inject(REFRESH_TOKENS_REPOSITORY)
    private readonly refreshTokensRepository: IRefreshTokensRepository,
  ) {}

  validate(accessToken: string): void {
    this.tokenService.verifyAccessTokenPayload(accessToken);
  }

  async validateUser(
    email: string,
    pass: string,
  ): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);
    
    if (user && (await bcrypt.compare(pass, user.passwordHash))) {
      return user;
    }
    
    return null;
  }

  async me(user: User): Promise<User> {
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return user;
  }

  async register(userInput: CreateUserDto, source?: string): Promise<AuthResult> {
    const { email: userInputEmail, username: userInputUsername, password: userInputPassword } = userInput;

    const existingUser = await this.usersService.findByEmailOrUsername(
      userInputEmail,
      userInputUsername,
    );
    
    if (existingUser) {
      if (existingUser.email === userInputEmail && existingUser.username === userInputUsername) {
        throw new ConflictException('Email and username already exist');
      }
      if (existingUser.email === userInputEmail) {
        throw new ConflictException('Email already exists');
      }
      if (existingUser.username === userInputUsername) {
        throw new ConflictException('Username already exists');
      }
    }

    const passwordHash = await bcrypt.hash(
      userInputPassword,
      BCRYPT_SALT_ROUNDS,
    );

    const user = await this.usersService.create({
      email: userInputEmail,
      username: userInputUsername,
      passwordHash,
      source,
    });
    const { id, email } = user;
    const tokens = await this.tokenService.generateTokens(id, email);
    const { refreshToken } = tokens;
    const hashedRefreshToken = await this.tokenService.hashRefreshToken(refreshToken);
    const { jti } = this.tokenService.decodeRefreshToken(refreshToken);

    await this.refreshTokensRepository.create({
      jti,
      token: hashedRefreshToken,
      userId: id,
      isRevoked: false,
    });

    return { user, tokens };
  }

  async login(loginDto: LoginDto): Promise<AuthResult> {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    
    const tokens = await this.tokenService.generateTokens(user.id, user.email);
    const { refreshToken } = tokens;
    const hashedRefreshToken = await this.tokenService.hashRefreshToken(refreshToken);
    const { jti } = this.tokenService.decodeRefreshToken(refreshToken);

    await this.refreshTokensRepository.create({
      jti,
      token: hashedRefreshToken,
      userId: user.id,
      isRevoked: false,
    });
    
    return { user, tokens };
  }

  async logout(refreshToken: string): Promise<void> {
    const payload = this.tokenService.verifyRefreshTokenPayload(refreshToken);
    const { jti } = payload;

    const tokenEntity = await this.refreshTokensRepository.findByJTI(jti);
    if (!tokenEntity || tokenEntity.isRevoked) {
      throw new UnauthorizedException(nauthorizedExceptionMessage);
    }
    const isMatch = await this.tokenService.verifyRefreshToken(refreshToken, tokenEntity.token);
    if (!isMatch) {
      throw new UnauthorizedException(nauthorizedExceptionMessage);
    }

    await this.refreshTokensRepository.revokeToken(tokenEntity.token);
  }

  async refreshTokensPair(refreshToken: string): Promise<JWTTokensPair> {
    const payload = this.tokenService.verifyRefreshTokenPayload(refreshToken);
    const { sub: userId, jti} = payload;

    const tokenEntity = await this.refreshTokensRepository.findByJTI(jti);

    if (!tokenEntity || tokenEntity.isRevoked) {
      throw new UnauthorizedException(nauthorizedExceptionMessage);
    }
    
    await this.refreshTokensRepository.revokeToken(tokenEntity.token);
    
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Access denied');
    }

    const { id, email } = user;
    const tokens = await this.tokenService.generateTokens(id, email);
    const { refreshToken: newRefreshToken } = tokens;
    const newHashedRefreshToken = await this.tokenService.hashRefreshToken(newRefreshToken);
    const { jti: newJti } = this.tokenService.decodeRefreshToken(newRefreshToken);

    await this.refreshTokensRepository.create({
      jti: newJti,
      token: newHashedRefreshToken,
      userId: id,
      isRevoked: false,
    });

    return tokens;
  }
}
