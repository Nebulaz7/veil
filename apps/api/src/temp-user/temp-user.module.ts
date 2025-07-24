import { Module } from '@nestjs/common';
import { TempUserService } from './temp-user.service';
import { TempUserController } from './temp-user.controller';
import { AuthModule } from 'src/auth/auth.module';
import { RoomModule } from 'src/room/room.module';
import { AuthService } from 'src/auth/auth.service';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { GoogleStrategy } from 'src/auth/google.strategy';
import { TwitterStrategy } from 'src/auth/twitter.strategy';
import { RoomService } from 'src/room/room.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { TempUserStoreService } from './redis-store/temp-user-store.service';

@Module({
  imports: [RoomModule, AuthModule, PassportModule, JwtModule.register({
    secret: process.env.JWT_SECRET,
    signOptions: { expiresIn: '1h' },
  })],
  providers: [TempUserService, AuthService, TempUserStoreService, GoogleStrategy, TwitterStrategy, JwtService, RoomService, PrismaService],
  controllers: [TempUserController]
})
export class TempUserModule {}
