import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RoomModule } from 'src/room/room.module';
import { PassportModule } from '@nestjs/passport';
import { GoogleStrategy } from './google.strategy';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import {TwitterStrategy } from './twitter.strategy';
import { JwtStrategy } from './jwt.strategy';

@Module({
  providers: [AuthService, GoogleStrategy, TwitterStrategy, JwtStrategy],
  controllers: [AuthController],
  imports: [RoomModule, JwtModule, PassportModule],
  exports: [AuthService, JwtModule]
})
export class AuthModule {}
