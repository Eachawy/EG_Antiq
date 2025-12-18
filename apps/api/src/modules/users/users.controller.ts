import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '@packages/database';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@CurrentUser() user: any): Promise<{ data: User }> {
    const userData = await this.usersService.findById(user.id, user.organizationId);
    return { data: userData };
  }

  @Get(':id')
  async getUser(@Param('id') id: string, @CurrentUser() user: any): Promise<{ data: User }> {
    const userData = await this.usersService.findById(id, user.organizationId);
    return { data: userData };
  }

  @Get()
  async getUsers(@CurrentUser() user: any): Promise<{ data: User[] }> {
    const users = await this.usersService.findMany(user.organizationId);
    return { data: users };
  }
}
