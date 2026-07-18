import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '../generated/prisma/client';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthenticatedUser } from './types/authenticated-user.type';

type AuthResponse = {
  accessToken: string;
  tokenType: 'Bearer';
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
  };
  workspace: {
    id: string;
    name: string;
    slug: string;
  };
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const email = this.normalizeEmail(dto.email);

    const existingUser = await this.prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
      },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const baseSlug = this.createSlug(dto.workspaceName);
    const workspaceSlug = await this.createUniqueWorkspaceSlug(baseSlug);
    const passwordHash = await argon2.hash(dto.password);

    const workspace = await this.prisma.workspace.create({
      data: {
        name: dto.workspaceName.trim(),
        slug: workspaceSlug,
        users: {
          create: {
            email,
            passwordHash,
            firstName: dto.firstName.trim(),
            lastName: dto.lastName.trim(),
            role: UserRole.OWNER,
          },
        },
      },
      include: {
        users: {
          where: {
            email,
          },
          take: 1,
        },
      },
    });

    const user = workspace.users[0];

    if (!user) {
      throw new Error('Failed to create user');
    }

    return this.createAuthResponse({
      user,
      workspace,
    });
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const email = this.normalizeEmail(dto.email);

    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
      include: {
        workspace: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordIsValid = await argon2.verify(
      user.passwordHash,
      dto.password,
    );

    if (!passwordIsValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.createAuthResponse({
      user,
      workspace: user.workspace,
    });
  }

  async getCurrentUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Authenticated user no longer exists');
    }

    return user;
  }

  private async createAuthResponse(params: {
    user: {
      id: string;
      workspaceId: string;
      email: string;
      firstName: string;
      lastName: string;
      role: UserRole;
    };
    workspace: {
      id: string;
      name: string;
      slug: string;
    };
  }): Promise<AuthResponse> {
    const { user, workspace } = params;

    const payload: AuthenticatedUser = {
      userId: user.id,
      workspaceId: workspace.id,
      email: user.email,
      role: user.role,
    };
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      tokenType: 'Bearer',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      workspace: {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
      },
    };
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private createSlug(value: string): string {
    const slug = value
      .trim()
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return slug || 'workspace';
  }

  private async createUniqueWorkspaceSlug(baseSlug: string): Promise<string> {
    let slug = baseSlug;
    let suffix = 1;
    while (
      await this.prisma.workspace.findUnique({
        where: { slug },
        select: { id: true },
      })
    ) {
      suffix += 1;
      slug = `${baseSlug}-${suffix}`;
    }

    return slug;
  }
}
