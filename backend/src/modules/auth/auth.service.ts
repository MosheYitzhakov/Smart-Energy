import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return user;
  }

  login(user: User): TokenPair {
    return this.generateTokens(user);
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: process.env['JWT_REFRESH_SECRET'] ?? process.env['JWT_SECRET'],
      });
      const user = await this.usersService.findById(payload.sub);
      if (!user) throw new UnauthorizedException();
      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  private generateTokens(user: User): TokenPair {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env['JWT_REFRESH_SECRET'] ?? process.env['JWT_SECRET'],
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }
}
