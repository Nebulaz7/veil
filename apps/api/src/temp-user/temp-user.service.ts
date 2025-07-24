import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { RoomService } from '../room/room.service';
import { AuthService } from '../auth/auth.service';
import { v4 as uuidv4 } from 'uuid';
import { TempUserStoreService } from './redis-store/temp-user-store.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class TempUserService {
  private readonly adjectives = [
    'Quick', 'Brave', 'Bright', 'Cool', 'Smart', 'Fast', 'Bold', 'Calm', 'Wise', 'Kind',
    'Sharp', 'Swift', 'Strong', 'Happy', 'Lucky', 'Fancy', 'Noble', 'Keen', 'Gentle', 'Lively'
  ];

  private readonly nouns = [
    'Tiger', 'Eagle', 'Lion', 'Wolf', 'Bear', 'Fox', 'Hawk', 'Shark', 'Falcon', 'Phoenix',
    'Dragon', 'Panther', 'Leopard', 'Cheetah', 'Raven', 'Owl', 'Viper', 'Cobra', 'Jaguar', 'Lynx'
  ];

  constructor(
    private readonly roomService: RoomService,
    private readonly authService: AuthService,
    private readonly tempUserStoreService: TempUserStoreService,
    private readonly jwtService: JwtService
  ) {}

  private generateRandomUsername(): string {
    const adjective = this.adjectives[Math.floor(Math.random() * this.adjectives.length)];
    const noun = this.nouns[Math.floor(Math.random() * this.nouns.length)];
    const number = Math.floor(Math.random() * 1000);
    return `${adjective}${noun}${number}`;
  }

  async joinRoom(slug: string, username?: string, isModerator = false) {
    const room = await this.roomService.findRoomBySlug(slug);
    if (!room) {
      throw new NotFoundException('Room Not Found');
    }

    const userId = uuidv4();
    const finalUsername = username || this.generateRandomUsername();

    const token = await this.authService.signJwt({
        sub: userId,
        username: finalUsername,
        roomId: room.id,
        role: isModerator ? 'moderator' : 'user'
    });

    await this.tempUserStoreService.setUser(userId, {
      username: finalUsername,
      roomId: room.id,
      role: isModerator ? 'moderator' : 'user',
      joinedAt: new Date().toISOString()
    });

    const roomUsers = await this.tempUserStoreService.getRoomUsers(room.id);
    const roomUserCount = await this.tempUserStoreService.getRoomUserCount(room.id);
     
    return {
        user: {
            id: userId,
            username: finalUsername,
            roomId: room.id,
            role: isModerator ? 'moderator' : 'user'
        },
        token,
        roomUsers,
        roomUserCount
    };
  }

  async joinRoomAsModerator(slug: string, moderatorToken: string) {
    // Verify the moderator token (you might want to check against room owner or admin)
    try {
      const payload = await this.jwtService.verifyAsync(moderatorToken);
      const room = await this.roomService.findRoomBySlug(slug);
      
      if (!room || room.ownerId !== payload.sub) {
        throw new UnauthorizedException('Invalid moderator access');
      }

      return this.joinRoom(slug, `Moderator`, true);
    } catch (err) {
      throw new UnauthorizedException('Invalid moderator token');
    }
  }

  async getUserFromToken(token: string) {
    try{
      const payload = await this.jwtService.verifyAsync(token);
      return payload;
    } catch (err) {
       throw new UnauthorizedException('Invalid or Expired Token')
    }
  }

  async leaveRoom(userId: string) {
    return await this.tempUserStoreService.deleteUser(userId);
  }
}