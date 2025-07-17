import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { JWT_STRATEGY_NAME } from './constants';
import { User } from '../users/entities/user.entity';

interface JwtPayload {
  sub: string;
  email: string;
}

type ValidateResult = Omit<User, 'passwordHash'>;

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, JWT_STRATEGY_NAME) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: (req) => {
        if (!req || !req.cookies) return null;
        return req.cookies[configService.get<string>('JWT_ACCESS_TOKEN_NAME')!];
      },
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET')!,
    });
  }

  async validate(payload: JwtPayload): Promise<ValidateResult> {
    const { sub: userId } = payload;
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException();
    }
    
    const { passwordHash: _, ...result } = user;
    return result;
  }
}
