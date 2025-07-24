import { PassportStrategy } from '@nestjs/passport';
import { Strategy, StrategyOptions, VerifyCallback } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private prisma: PrismaService) {
    const options: StrategyOptions = {
      clientID: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackURL: 'https://veil-1qpe.onrender.com/auth/google/redirect',
      scope: ['profile', 'email'],
      passReqToCallback: false,
    };
    super(options);
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback): Promise<any> {
    const { name, emails, photos } = profile;

    // 1. Try to find moderator by email
    let moderator = await this.prisma.moderator.findUnique({
      where: { email: emails[0].value },
    });

    // 2. If not found, create one
    if (!moderator) {
      moderator = await this.prisma.moderator.create({
        data: {
          email: emails[0].value,
          username: name.givenName.toLowerCase() + Math.floor(Math.random() * 1000),
          password: '', // You can leave this blank or set a placeholder for OAuth users
        },
      });
    }

    // 3. Return a proper user payload
    const user = {
      id: moderator.id,
      email: moderator.email,
      name: `${name.givenName} ${name.familyName}`,
      picture: photos[0].value,
      createdAt: moderator.createdAt,
    };

    done(null, user);
  }
}
