import { Module } from '@nestjs/common';
import { RoomService } from './room.service';
import { RoomController } from './room.controller';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedGuard } from '../auth/guard/authenticated.guard';
import { RoomGateway } from './room.gateway';
import { QuestionStoreService } from './question-store.service';
import { TempUserStoreService } from 'src/temp-user/redis-store/temp-user-store.service';

@Module({
  controllers: [RoomController],
  providers: [RoomService, PrismaService, AuthenticatedGuard, RoomGateway, QuestionStoreService, TempUserStoreService],
  exports: [RoomGateway],
})
export class RoomModule {}
