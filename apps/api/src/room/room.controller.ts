import { Controller, Post, Body, Req, Get, UseGuards, Param, NotFoundException } from '@nestjs/common';
import { Request } from 'express';
import { RoomService } from './room.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard'
import { PrismaService } from '../prisma/prisma.service';


@Controller('rooms')
export class RoomController {
    constructor(private readonly roomService: RoomService,
                private readonly prisma: PrismaService
    ) {}
@UseGuards(JwtAuthGuard)
  @Post()
  async createRoom(@Req() req: Request, @Body() dto: CreateRoomDto) {
    const user = req.user as any;
    console.log('Moderator creating room:', user);

    const moderator = await this.prisma.moderator.findUnique({
      where: { email: user.email },
    });

    if (!moderator) {
      throw new NotFoundException('Moderator not found');
    }

    return this.roomService.createRoom(dto, moderator.id);
  }

@UseGuards(JwtAuthGuard)
@Get()
async getMyRooms(@Req() req: Request) {
  const user = req.user as any;
  return this.roomService.findRoomsByUserId(user.id);
}

@UseGuards(JwtAuthGuard)
@Get(':id')
async getRoomById(@Param('id') id: string) {
  return this.roomService.findRoomsByUserId(id);
}

  @Get('me')
  getMe(@Req() req) {
  return req.user;
}
}

