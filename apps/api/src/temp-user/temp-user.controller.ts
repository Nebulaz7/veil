import { Controller, Post, Body, Param, Get, Delete, Headers } from '@nestjs/common';
import { JoinRoomDto } from './dto/join-room.dto';
import { TempUserService } from './temp-user.service';
import { TempUserStoreService } from './redis-store/temp-user-store.service';
import { SetTempUserDto } from './dto/set-temp-user.dto';

@Controller('user')
export class TempUserController {
    constructor(private readonly tempUserService: TempUserService,
                private readonly tempUserStoreService: TempUserStoreService
    ) {}
    
 @Post('room/:slug/users')
async joinRoom(@Param('slug') slug: string, @Body() joinRoomDto: JoinRoomDto) {
  return this.tempUserService.joinRoom(slug, joinRoomDto.username);
}

@Post('temp-user')
async setUser(@Body() setTempUserDto: SetTempUserDto) {
  const result = await this.tempUserStoreService.setUser(
    setTempUserDto.username,
    setTempUserDto.roomId
  );
  return result;
}

    @Get('room/:userId')
    async getUser(
        @Param('userId') userId: string
    ) {
        const user = await this.tempUserStoreService.getUser(userId)
        return user
    }

    @Delete('room/logout/:userId')
    async deleteUser(
        @Param('userId') userId: string
    ) {
        const logout = await this.tempUserStoreService.deleteUser(userId);
        return logout
    }
    
    @Get('room/:roomId/list')
    async getRoomUsers(
        @Param('roomId') roomId: string
    ) {
        const list = await this.tempUserStoreService.getRoomUsers(roomId);
        return list
    }

    @Get('room/:roomId/no')
    async getRoomUserCount(
        @Param('roomId') roomId: string
    ) {
        const no = await this.tempUserStoreService.getRoomUserCount(roomId)
        return no
    }

@Post('/room/:slug/join-moderator')
async joinRoomAsModerator(@Param('slug') slug: string, @Headers('authorization') auth: string) {
  const token = auth.replace('Bearer ', '');
  return this.tempUserService.joinRoomAsModerator(slug, token);
}

@Delete('/temp-user/:userId/leave')
async leaveRoom(@Param('userId') userId: string) {
  return this.tempUserService.leaveRoom(userId);
}
    }
