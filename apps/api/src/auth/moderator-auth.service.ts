import { Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class ModeratorAuthService {
  constructor(private jwtService: JwtService) {}

async signJwt(user: {
  id: string;
  email: string;
  name: string;
  picture: string;
  createdAt: Date;
}) {
  return this.jwtService.signAsync(
    {
      sub: user.id,
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      createdAt: user.createdAt,
    },
    {
      secret: process.env.JWT_SECRET,
      expiresIn: '1h',
    },
  );
}}
