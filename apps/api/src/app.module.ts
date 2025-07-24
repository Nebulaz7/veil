import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { RoomModule } from './room/room.module';
import { TempUserModule } from './temp-user/temp-user.module';
import { QuestionModule } from './question/question.module';
import { PollModule } from './poll/poll.module';
import { WebsocketModule } from './websocket/websocket.module';
import { CacheModule } from '@nestjs/cache-manager'
import * as redisStore from 'cache-manager-redis-store';
import { AccountModule } from './account/account.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CacheModule.register({
      isGlobal: true,
      store: redisStore,
      host: 'localhost',
      port: 6379,
    }),
    AuthModule,
    RoomModule,
    TempUserModule,
    QuestionModule,
    PollModule,
    AccountModule,
    WebsocketModule
  ],
})
export class AppModule {}
