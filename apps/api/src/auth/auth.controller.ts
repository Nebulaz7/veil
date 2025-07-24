import { Controller, Req, UseGuards, Get, Res } from '@nestjs/common'
import { ModeratorAuthService } from './moderator-auth.service'
import { Response } from 'express'
import { AuthGuard } from '@nestjs/passport'
import * as jwt from 'jsonwebtoken'
import { JwtModule } from '@nestjs/jwt'

@Controller('auth')
export class AuthController{
  constructor(private moderatorAuthService: ModeratorAuthService){}
@Get('google')
@UseGuards(AuthGuard('google'))
  async googleAuth(){}

@Get('google/redirect')
@UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res() res: Response) {
    const user = req.user;

    const token = await this.moderatorAuthService.signJwt({
  id: user.id,
  email: user.email,
  name: user.name,
  picture: user.picture,
  createdAt: user.createdAt,
});

    res.redirect(`http://localhost:3000/client-handler?token=${token}`)
}

@Get('twitter')
@UseGuards(AuthGuard('twitter'))
async twitterAuth(){}

@Get('twitter/redirect')
@UseGuards(AuthGuard('twitter'))
twitterAuthRedirect(@Req() req, @Res() res: Response) {
    const user = req.user;

    const token = jwt.sign(user, process.env.JWT_SECRET, {
      expiresIn: '1h'
    });

    res.redirect(`http://localhost:3000/client-handler?token=${token}`)
}
}