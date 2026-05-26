import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../auth.service';
import { UsersService } from '../../users/users.service';
import { User, UserRole } from '../../users/user.entity';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));
import * as bcrypt from 'bcrypt';

const makeUser = (overrides: Partial<User> = {}): User => ({
  id: 'abc-123',
  email: 'test@test.com',
  password: 'hashed',
  role: UserRole.USER,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(() => {
    usersService = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
    } as unknown as jest.Mocked<UsersService>;

    jwtService = {
      sign: jest.fn().mockReturnValue('token'),
      verify: jest.fn(),
    } as unknown as jest.Mocked<JwtService>;

    authService = new AuthService(usersService, jwtService);
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('returns user when credentials are valid', async () => {
      const user = makeUser();
      usersService.findByEmail.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await authService.validateUser(
        'test@test.com',
        'plaintext',
      );
      expect(result).toBe(user);
    });

    it('throws UnauthorizedException when user not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      await expect(
        authService.validateUser('bad@test.com', 'x'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when password is wrong', async () => {
      const user = makeUser();
      usersService.findByEmail.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        authService.validateUser('test@test.com', 'wrong'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('login', () => {
    it('returns accessToken and refreshToken', () => {
      jwtService.sign.mockReturnValue('signed-token');
      const user = makeUser();
      const result = authService.login(user);
      expect(result.accessToken).toBe('signed-token');
      expect(result.refreshToken).toBe('signed-token');
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(jwtService.sign).toHaveBeenCalledTimes(2);
    });
  });

  describe('refresh', () => {
    it('returns new token pair when refresh token is valid', async () => {
      const user = makeUser();
      jwtService.verify.mockReturnValue({
        sub: user.id,
        email: user.email,
        role: user.role,
      });
      usersService.findById.mockResolvedValue(user);
      jwtService.sign.mockReturnValue('new-token');

      const result = await authService.refresh('valid-refresh');
      expect(result.accessToken).toBe('new-token');
    });

    it('throws UnauthorizedException when refresh token is invalid', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('expired');
      });
      await expect(authService.refresh('bad-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
