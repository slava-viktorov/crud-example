import {
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
  UnauthorizedException,
  Res,
  Req,
  Head,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { Public } from '../common/decorators/public.decorator';

import {
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { plainToInstance } from 'class-transformer';
import { ConfigService } from '@nestjs/config';
import { CookieService } from './cookie.service';

@ApiTags('auth')
@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly cookieService: CookieService,
  ) {}

  @Head('validate-token')
  @UseGuards(JwtAuthGuard)
  @Public()
  async validate(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const accessTokenName = this.configService.get<string>('JWT_ACCESS_TOKEN_NAME')!;
    const accessToken = req.cookies?.[accessTokenName];
    if (!accessToken) {
      throw new UnauthorizedException('Access token required');
    }
    this.authService.validate(accessToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 401, description: 'Invalid credentials.', type: ErrorResponseDto })
  @ApiOperation({ summary: 'Get current user' })
  @ApiResponse({
    status: 200,
    description: 'User successfully retrieved.',
    type: UserResponseDto,
  })
  async me(@CurrentUser() user: User): Promise<UserResponseDto> {
    const result = await this.authService.me(user);
    const userResponse = plainToInstance(UserResponseDto, result);
    return userResponse;
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered.',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Email or username already exists.', type: ErrorResponseDto })
  async register(
    @Body() createUserDto: CreateUserDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<UserResponseDto> {
    const { user, tokens } = await this.authService.register(createUserDto);
    
    this.cookieService.setAuthCookies(res, tokens);

    const userResponse = plainToInstance(UserResponseDto, user);
    return userResponse;
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log in a user' })
  @ApiResponse({
    status: 200,
    description:
      'User successfully logged in, sets access and refresh tokens in HttpOnly cookie.',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials.', type: ErrorResponseDto })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<UserResponseDto> {
    const { user, tokens } = await this.authService.login(loginDto);

    this.cookieService.setAuthCookies(res, tokens);

    const userResponse = plainToInstance(UserResponseDto, user);
    return userResponse;
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshTokenName = this.configService.get<string>('JWT_REFRESH_TOKEN_NAME')!;
    const refreshToken = req.cookies?.[refreshTokenName];
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token required');
    }
    await this.authService.logout(refreshToken);
    this.cookieService.clearAuthCookies(res);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: 200,
    description: 'Tokens successfully refreshed, new tokens set in HttpOnly cookie.',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid refresh token.' })
  async refreshTokens(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const refreshTokenName = this.configService.get<string>('JWT_REFRESH_TOKEN_NAME')!;
    const refreshToken = req.cookies?.[refreshTokenName];

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token required');
    }
    const tokens = await this.authService.refreshTokensPair(refreshToken);
    
    this.cookieService.setAuthCookies(res, tokens);
  }
}
