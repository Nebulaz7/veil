import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-twitter';

@Injectable()
export class TwitterStrategy extends PassportStrategy(Strategy, 'twitter') {
  constructor() {
    super({
      consumerKey: process.env.TWITTER_CONSUMER_KEY || '',
      consumerSecret: process.env.TWITTER_CONSUMER_SECRET || '',
      callbackURL:
        process.env.TWITTER_CALLBACK_URL ||
        'https://veil-1qpe.onrender.com/auth/twitter/redirect',
      includeEmail: true,
    });
  }

async validate(
  accessToken: string,
  refreshToken: string,
  profile: any,
): Promise<any> {
  const { id, username, displayName, emails } = profile;
  return {
    id,
    username,
    displayName,
    email: emails?.[0]?.value || null,
  };
}
}
