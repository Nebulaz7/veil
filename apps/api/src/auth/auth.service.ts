import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt'; 

@Injectable()
export class AuthService {
    constructor(private readonly jwtService: JwtService) {}

    async signJwt(payload: {
        sub: string,
        username: string,
        roomId: string,
        role: 'moderator' | 'user'
    }) {
        return this.jwtService.signAsync(payload, {
            secret: process.env.JWT_SECRET,
            expiresIn: '1h',
    });
}
}
