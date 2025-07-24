// poll.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PollService {
  constructor(private prisma: PrismaService) {}

  async getPollsByRoomSlug(slug: string) {
    const room = await this.prisma.room.findUnique({
      where: { slug },
      include: { polls: { orderBy: { createdAt: 'desc' } } },
    });

    if (!room) throw new Error('Room not found');
    return room.polls;
  }

  async createPollForRoom(
    slug: string,
    data: { name: string; status: string; question: string }
  ) {
    const room = await this.prisma.room.findUnique({ where: { slug } });
    if (!room) throw new Error('Room not found');

    const poll = await this.prisma.poll.create({
      data: {
        name: data.name,
        status: data.status,
        question: data.question,
        roomId: room.id,
      },
    });

    return poll;
  }
}
