import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  Body,
  Headers,
  Param,
  UnauthorizedException,
} from '@nestjs/common';
import { AdminAuthService } from './admin-auth.service';

function extractBearer(header: string | undefined): string {
  if (!header?.startsWith('Bearer ')) return '';
  return header.slice(7);
}

@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  // POST /admin/auth/login
  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    return this.adminAuthService.login(body.email, body.password);
  }

  // GET /admin/auth/me
  @Get('me')
  async getMe(@Headers('authorization') auth: string) {
    return this.adminAuthService.getMe(extractBearer(auth));
  }

  // GET /admin/auth/accounts
  @Get('accounts')
  async listAdmins(@Headers('authorization') auth: string) {
    const adminId = this.adminAuthService.verifyAdminToken(extractBearer(auth));
    if (!adminId) throw new UnauthorizedException('유효하지 않은 관리자 토큰입니다.');
    return this.adminAuthService.listAdmins();
  }

  // POST /admin/auth/accounts
  @Post('accounts')
  async createAdmin(
    @Headers('authorization') auth: string,
    @Body() body: { name: string; email: string; password: string },
  ) {
    const adminId = this.adminAuthService.verifyAdminToken(extractBearer(auth));
    if (!adminId) throw new UnauthorizedException('유효하지 않은 관리자 토큰입니다.');
    return this.adminAuthService.createAdmin(body.name, body.email, body.password);
  }

  // DELETE /admin/auth/accounts/:id
  @Delete('accounts/:id')
  async deleteAdmin(
    @Headers('authorization') auth: string,
    @Param('id') id: string,
  ) {
    const requestorId = this.adminAuthService.verifyAdminToken(extractBearer(auth));
    if (!requestorId) throw new UnauthorizedException('유효하지 않은 관리자 토큰입니다.');
    return this.adminAuthService.deleteAdmin(id, requestorId);
  }

  // PATCH /admin/auth/accounts/:id/password
  @Patch('accounts/:id/password')
  async changePassword(
    @Headers('authorization') auth: string,
    @Param('id') id: string,
    @Body() body: { oldPassword: string; newPassword: string },
  ) {
    const requestorId = this.adminAuthService.verifyAdminToken(extractBearer(auth));
    if (!requestorId) throw new UnauthorizedException('유효하지 않은 관리자 토큰입니다.');
    if (requestorId !== id) throw new UnauthorizedException('자신의 비밀번호만 변경할 수 있습니다.');
    return this.adminAuthService.changePassword(id, body.oldPassword, body.newPassword);
  }
}
